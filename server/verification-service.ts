import { db } from "./db";
import { users, securityLogs } from "@shared/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export class VerificationService {
  // Generate 6-digit verification code
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Generate verification code and save to user
  async createVerificationCode(userId: string, action: string): Promise<string> {
    const code = this.generateCode();
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db
      .update(users)
      .set({
        verificationCode: code,
        verificationCodeExpiry: expiryTime,
      })
      .where(eq(users.id, userId));

    return code;
  }

  // Verify code and log the action
  async verifyCode(
    userId: string, 
    code: string, 
    action: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; message: string }> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return { success: false, message: "Usuario no encontrado" };
    }

    if (!user.verificationCode || user.verificationCode !== code) {
      // Log failed attempt
      await db.insert(securityLogs).values({
        userId,
        action,
        method: user.twoFactorMethod || "email",
        code,
        verified: false,
        ipAddress,
        userAgent,
      });
      
      return { success: false, message: "Código de verificación incorrecto" };
    }

    if (!user.verificationCodeExpiry || new Date() > user.verificationCodeExpiry) {
      return { success: false, message: "Código de verificación expirado" };
    }

    // Clear verification code after successful verification
    await db
      .update(users)
      .set({
        verificationCode: null,
        verificationCodeExpiry: null,
      })
      .where(eq(users.id, userId));

    // Log successful verification
    await db.insert(securityLogs).values({
      userId,
      action,
      method: user.twoFactorMethod || "email",
      code,
      verified: true,
      ipAddress,
      userAgent,
      verifiedAt: new Date(),
    });

    return { success: true, message: "Código verificado correctamente" };
  }

  // Send verification code via email (simulated)
  async sendEmailVerification(email: string, code: string, action: string): Promise<boolean> {
    try {
      // In production, integrate with a real email service like SendGrid, Resend, etc.
      console.log(`📧 [EMAIL VERIFICATION] To: ${email}`);
      console.log(`🔐 Código de seguridad para ${action}: ${code}`);
      console.log(`⏰ Este código expira en 10 minutos`);
      
      // Simulated email sending - replace with real service
      return true;
    } catch (error) {
      console.error("Error sending email verification:", error);
      return false;
    }
  }

  // Send verification code via SMS (simulated)
  async sendSMSVerification(phone: string, code: string, action: string): Promise<boolean> {
    try {
      // In production, integrate with a real SMS service like Twilio, MessageBird, etc.
      console.log(`📱 [SMS VERIFICATION] To: ${phone}`);
      console.log(`🔐 MercadoBoom - Código de seguridad: ${code}`);
      console.log(`⏰ Este código expira en 10 minutos`);
      
      // Simulated SMS sending - replace with real service
      return true;
    } catch (error) {
      console.error("Error sending SMS verification:", error);
      return false;
    }
  }

  // Send verification code via WhatsApp (simulated)
  async sendWhatsAppVerification(phone: string, code: string, action: string): Promise<boolean> {
    try {
      // In production, integrate with WhatsApp Business API or Twilio WhatsApp API
      console.log(`💬 [WHATSAPP VERIFICATION] To: ${phone}`);
      console.log(`🔐 MercadoBoom - Tu código de seguridad es: ${code}`);
      console.log(`⏰ Este código es válido por 10 minutos`);
      console.log(`🛡️ Acción: ${action}`);
      
      // Simulated WhatsApp sending - replace with real WhatsApp API service
      return true;
    } catch (error) {
      console.error("Error sending WhatsApp verification:", error);
      return false;
    }
  }

  // Send verification code based on user's preferred method
  async sendVerificationCode(
    userId: string, 
    action: string
  ): Promise<{ success: boolean; message: string; method?: string }> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return { success: false, message: "Usuario no encontrado" };
    }

    const code = await this.createVerificationCode(userId, action);
    const method = user.twoFactorMethod || "email";

    let emailSent = false;
    let smsSent = false;
    let whatsappSent = false;

    // Send email verification
    if (method === "email" || method === "email_sms" || method === "email_whatsapp" || method === "all") {
      emailSent = await this.sendEmailVerification(user.email, code, action);
    }

    // Send SMS verification
    if (method === "sms" || method === "email_sms" || method === "sms_whatsapp" || method === "all") {
      if (!user.phone) {
        return { 
          success: false, 
          message: "No hay número de teléfono registrado para verificación SMS" 
        };
      }
      smsSent = await this.sendSMSVerification(user.phone, code, action);
    }

    // Send WhatsApp verification
    if (method === "whatsapp" || method === "email_whatsapp" || method === "sms_whatsapp" || method === "all") {
      if (!user.phone) {
        return { 
          success: false, 
          message: "No hay número de teléfono registrado para verificación WhatsApp" 
        };
      }
      whatsappSent = await this.sendWhatsAppVerification(user.phone, code, action);
    }

    // Determine success message based on method
    const successChannels = [];
    const failedChannels = [];

    if (method.includes("email") || method === "email") {
      if (emailSent) successChannels.push("email");
      else failedChannels.push("email");
    }

    if (method.includes("sms") || method === "sms") {
      if (smsSent) successChannels.push("SMS");
      else failedChannels.push("SMS");
    }

    if (method.includes("whatsapp") || method === "whatsapp") {
      if (whatsappSent) successChannels.push("WhatsApp");
      else failedChannels.push("WhatsApp");
    }

    // Handle legacy "both" method (email + SMS)
    if (method === "both") {
      if (emailSent) successChannels.push("email");
      else failedChannels.push("email");
      if (smsSent) successChannels.push("SMS");
      else failedChannels.push("SMS");
    }

    if (successChannels.length > 0) {
      const methodText = successChannels.join(" y ");
      return { 
        success: true, 
        message: `Código de verificación enviado por ${methodText}`,
        method: methodText
      };
    } else {
      const failedText = failedChannels.join(" y ");
      return { 
        success: false, 
        message: `Error al enviar código por ${failedText}`
      };
    }
  }

  // Check if verification is required for a specific action
  async requiresVerification(userId: string, action: string): Promise<boolean> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return false;
    }

    // Define actions that require verification
    const highSecurityActions = ["admin_access", "large_order", "profile_change", "payment_update"];
    
    return user.twoFactorEnabled && highSecurityActions.includes(action);
  }

  // Update 2FA settings
  async updateTwoFactorSettings(
    userId: string, 
    enabled: boolean, 
    method?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const updateData: any = { twoFactorEnabled: enabled };
      
      if (method) {
        updateData.twoFactorMethod = method;
      }

      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId));

      const statusMessage = enabled 
        ? `Verificación en dos pasos activada con método: ${method || "email"}`
        : "Verificación en dos pasos desactivada";

      return { success: true, message: statusMessage };
    } catch (error) {
      console.error("Error updating 2FA settings:", error);
      return { success: false, message: "Error al actualizar configuración de seguridad" };
    }
  }

  // Verify contact method (for testing verification codes)
  async verifyContact(
    userId: string, 
    type: "email" | "phone", 
    code: string
  ): Promise<{ success: boolean; message: string }> {
    const verification = await this.verifyCode(userId, code, `verify_${type}`);
    
    if (verification.success) {
      // Mark contact as verified
      const updateField = type === "email" ? "isEmailVerified" : "isPhoneVerified";
      await db
        .update(users)
        .set({ [updateField]: true })
        .where(eq(users.id, userId));
      
      return { 
        success: true, 
        message: `${type === "email" ? "Email" : "Teléfono"} verificado correctamente` 
      };
    }
    
    return verification;
  }
}

export const verificationService = new VerificationService();