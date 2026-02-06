import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, passwordResetRequestSchema, passwordResetConfirmSchema } from "@shared/schema";
import { sendPasswordResetEmail } from "./email-service";
import { sendPasswordResetSMS } from "./sms-service";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) {
    return false;
  }
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  
  // Ensure both buffers have the same length before comparison
  if (hashedBuf.length !== suppliedBuf.length) {
    return false;
  }
  
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

function generateResetToken() {
  return randomBytes(32).toString("hex");
}

export { hashPassword, comparePasswords, generateResetToken };

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      
      // If user doesn't exist, return false
      if (!user) {
        return done(null, false);
      }
      
      // Check if user is blocked BEFORE verifying password
      // This ensures blocked users get the blocked message even if password is wrong
      if (user.isBlocked) {
        return done(null, false, { message: "Tu cuenta ha sido bloqueada. Contacta con el administrador." });
      }
      
      // Verify password
      if (!(await comparePasswords(password, user.password))) {
        return done(null, false);
      }
      
      return done(null, user);
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }

    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password),
    });

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        // If there's a message from the strategy (e.g., blocked user message)
        if (info && info.message) {
          return res.status(401).json({ error: info.message });
        }
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // Enhanced password reset endpoints
  app.post("/api/password-reset/request", async (req, res) => {
    try {
      const result = passwordResetRequestSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: "Datos inválidos", 
          details: result.error.issues 
        });
      }

      const { identifier, method } = result.data;
      let user;

      // Find user by the specified method
      switch (method) {
        case "username":
          user = await storage.getUserByUsername(identifier);
          break;
        case "email":
          user = await storage.getUserByEmail(identifier);
          break;
        case "phone":
          user = await storage.getUserByPhone(identifier);
          break;
        default:
          return res.status(400).json({ error: "Método de recuperación inválido" });
      }

      if (!user) {
        // For security: don't reveal if user exists or not
        // Always return success message but don't actually send anything
        const response: any = {
          message: `Token de recuperación enviado`,
          method: method,
          sentTo: method === "email" || method === "username" ? identifier : identifier,
          messagesSent: [],
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };

        if (process.env.NODE_ENV === "development") {
          response.note = "Usuario no encontrado - token no enviado (solo visible en desarrollo)";
        }

        return res.json(response);
      }

      const resetToken = generateResetToken();
      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await storage.updateUserResetToken(user.username, resetToken, expiry);

      // Send recovery message based on method
      let messagesSent = [];
      let hasError = false;

      if (method === "email" || method === "username") {
        if (user.email) {
          const emailSent = await sendPasswordResetEmail(user.email, resetToken, user.username);
          if (emailSent) {
            messagesSent.push("email");
          } else {
            hasError = true;
          }
        }
      }

      if (method === "phone") {
        if (user.phone) {
          const smsSent = await sendPasswordResetSMS(user.phone, resetToken, user.username);
          if (smsSent) {
            messagesSent.push("SMS");
          } else {
            hasError = true;
          }
        } else {
          return res.status(400).json({ error: "El usuario no tiene número de teléfono registrado" });
        }
      }

      // For development, still show the token
      const response: any = {
        message: `Token de recuperación enviado`,
        method: method,
        sentTo: method === "email" || method === "username" ? user.email : user.phone,
        messagesSent,
        expiresAt: expiry.toISOString()
      };

      // Security: Never include the token in response
      // Token must only be sent via email/SMS

      if (hasError) {
        // If we found a user but couldn't send the message, return an error
        console.error(`Failed to send password reset to ${method === "email" || method === "username" ? user.email : user.phone}`);
        return res.status(502).json({ 
          error: `No se pudo enviar el token de recuperación. Verifica que ${method === "email" ? "tu email esté configurado correctamente" : "tu teléfono pueda recibir SMS"}.`,
          details: "Error del proveedor de email/SMS"
        });
      }

      res.json(response);
    } catch (error) {
      console.error("Error generating reset token:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  app.post("/api/password-reset/confirm", async (req, res) => {
    try {
      const result = passwordResetConfirmSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: "Datos inválidos", 
          details: result.error.issues 
        });
      }

      const { identifier, resetToken, newPassword, method } = result.data;
      
      let user;
      switch (method) {
        case "username":
          user = await storage.getUserByUsername(identifier);
          break;
        case "email":
          user = await storage.getUserByEmail(identifier);
          break;
        case "phone":
          user = await storage.getUserByPhone(identifier);
          break;
        default:
          return res.status(400).json({ error: "Método de recuperación inválido" });
      }

      if (!user) {
        // For security: don't reveal if user exists or not
        // Return generic error for invalid token/user combination
        return res.status(400).json({ error: "Token de recuperación inválido o expirado" });
      }

      const hashedPassword = await hashPassword(newPassword);
      await storage.resetUserPassword(user.username, resetToken, hashedPassword);

      res.json({ 
        message: "Contraseña actualizada exitosamente",
        success: true
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      if (error instanceof Error && error.message.includes("Token de recuperación")) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Error interno del servidor" });
      }
    }
  });
}
