import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword } from "./auth";
import { storage } from "./storage";
import { paymentConfigStorage } from "./payment-config-storage";
import { verificationService } from "./verification-service";
import { insertProductSchema, insertAddressSchema, insertOrderSchema, updateOrderStatusSchema, createPaymentPreferenceSchema, paymentWebhookSchema, createDirectTransferOrderSchema, verifyTransferSchema, uploadReceiptSchema, insertPaymentConfigSchema, updatePaymentConfigSchema, insertSupportTicketSchema, insertTicketMessageSchema, updateTicketStatusSchema, insertBannerSchema, updateBannerSchema, insertSpecialOfferSchema, updateSpecialOfferSchema, type SupportTicket, type TicketMessage } from "@shared/schema";
import { createPaymentPreference, processPaymentWebhook, getMercadoPagoPublicKey } from "./payments";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // Public Banners routes
  app.get("/api/banners", async (req, res) => {
    try {
      const banners = await storage.getActiveBanners();
      res.json(banners);
    } catch (error) {
      console.error("Error fetching banners:", error);
      res.status(500).json({ message: "Failed to fetch banners" });
    }
  });

  // Public Special Offers routes
  app.get("/api/special-offers", async (req, res) => {
    try {
      const offers = await storage.getActiveSpecialOffers();
      res.json(offers);
    } catch (error) {
      console.error("Error fetching special offers:", error);
      res.status(500).json({ message: "Failed to fetch special offers" });
    }
  });

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const { featured, category } = req.query;
      
      let products;
      if (featured === "true") {
        products = await storage.getFeaturedProducts();
      } else if (category) {
        products = await storage.getProductsByCategory(category as string);
      } else {
        products = await storage.getAllProducts();
      }
      
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  // Admin product management
  app.post("/api/admin/products", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const result = insertProductSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid product data" });
      }

      // Normalize object storage URL if imageUrl is provided
      if (result.data.imageUrl) {
        const objectStorageService = new ObjectStorageService();
        result.data.imageUrl = objectStorageService.normalizeObjectEntityPath(result.data.imageUrl);
      }

      const product = await storage.createProduct(result.data);
      res.status(201).json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.patch("/api/admin/products/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      // Normalize object storage URL if imageUrl is provided
      if (req.body.imageUrl) {
        const objectStorageService = new ObjectStorageService();
        req.body.imageUrl = objectStorageService.normalizeObjectEntityPath(req.body.imageUrl);
      }

      const product = await storage.updateProduct(req.params.id, req.body);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/admin/products/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const deleted = await storage.deleteProduct(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // User profile route
  app.patch("/api/user/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { fullName, email, username, phone } = req.body;
      const profileData = { fullName, email, username, phone };
      
      // Remove undefined values
      const cleanedProfileData = Object.fromEntries(
        Object.entries(profileData).filter(([, value]) => value !== undefined)
      );

      const updatedUser = await storage.updateUserProfile(req.user!.id, cleanedProfileData);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      if (error instanceof Error && (error.message.includes("Username already exists") || error.message.includes("Email already exists"))) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Address routes
  app.get("/api/addresses", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const addresses = await storage.getUserAddresses(req.user!.id);
      res.json(addresses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch addresses" });
    }
  });

  app.post("/api/addresses", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const result = insertAddressSchema.safeParse({
        ...req.body,
        userId: req.user!.id,
      });
      if (!result.success) {
        return res.status(400).json({ error: "Invalid address data" });
      }

      const address = await storage.createAddress(result.data);
      res.status(201).json(address);
    } catch (error) {
      res.status(500).json({ error: "Failed to create address" });
    }
  });

  app.patch("/api/addresses/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const address = await storage.updateAddress(req.params.id, req.body);
      if (!address) {
        return res.status(404).json({ error: "Address not found" });
      }
      res.json(address);
    } catch (error) {
      res.status(500).json({ error: "Failed to update address" });
    }
  });

  app.delete("/api/addresses/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const deleted = await storage.deleteAddress(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Address not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete address" });
    }
  });

  // Order routes
  app.post("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const result = insertOrderSchema.safeParse({
        ...req.body,
        userId: req.user!.id,
      });
      if (!result.success) {
        return res.status(400).json({ error: "Invalid order data" });
      }

      const order = await storage.createOrder(result.data);
      res.status(201).json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.get("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const orders = await storage.getUserOrders(req.user!.id);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const order = await storage.getOrder(req.params.id);
      if (!order || order.userId !== req.user!.id) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  // Security verification routes
  app.post("/api/security/send-code", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    try {
      const { action } = req.body;
      
      if (!action) {
        return res.status(400).json({ message: "Acción requerida" });
      }

      const result = await verificationService.sendVerificationCode(req.user!.id, action);
      
      if (result.success) {
        res.json({ 
          message: result.message,
          method: result.method 
        });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error("Error sending verification code:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/security/verify-code", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    try {
      const { code, action } = req.body;
      
      if (!code || !action) {
        return res.status(400).json({ message: "Código y acción requeridos" });
      }

      const clientIP = req.ip || req.connection.remoteAddress;
      const userAgent = req.get("User-Agent");

      const result = await verificationService.verifyCode(
        req.user!.id, 
        code, 
        action,
        clientIP,
        userAgent
      );
      
      if (result.success) {
        res.json({ message: result.message });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error("Error verifying code:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/security/update-2fa", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    try {
      const { enabled, method } = req.body;
      
      if (typeof enabled !== "boolean") {
        return res.status(400).json({ message: "Estado de activación requerido" });
      }

      const result = await verificationService.updateTwoFactorSettings(
        req.user!.id, 
        enabled, 
        method
      );
      
      if (result.success) {
        res.json({ message: result.message });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error("Error updating 2FA settings:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/security/check-required", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    try {
      const { action } = req.body;
      
      if (!action) {
        return res.status(400).json({ message: "Acción requerida" });
      }

      const required = await verificationService.requiresVerification(req.user!.id, action);
      
      res.json({ required });
    } catch (error) {
      console.error("Error checking verification requirement:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Object storage routes for file uploads
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/objects/upload", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  app.post("/api/objects/normalize", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    try {
      const { path } = req.body;
      console.log("Normalize request received for path:", path);
      
      if (!path) {
        return res.status(400).json({ error: "Path is required" });
      }

      const objectStorageService = new ObjectStorageService();
      const normalizedPath = await objectStorageService.trySetObjectEntityPath(path);
      console.log("Normalized path:", normalizedPath);
      
      return res.json({ path: normalizedPath });
    } catch (error) {
      console.error("Error normalizing path:", error);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Route to serve private objects (uploaded product images)
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Banner management routes
  app.get("/api/banners", async (req, res) => {
    try {
      const banners = await storage.getActiveBanners();
      res.json(banners);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch banners" });
    }
  });

  app.get("/api/admin/banners", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const banners = await storage.getAllBanners();
      res.json(banners);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch banners" });
    }
  });

  app.post("/api/admin/banners", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const result = insertBannerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid banner data", details: result.error.issues });
      }

      // Normalize image URL if it's from object storage
      if (result.data.imageUrl) {
        const objectStorageService = new ObjectStorageService();
        result.data.imageUrl = objectStorageService.normalizeObjectEntityPath(result.data.imageUrl);
      }

      const banner = await storage.createBanner(result.data);
      res.json(banner);
    } catch (error) {
      res.status(500).json({ error: "Failed to create banner" });
    }
  });

  app.put("/api/admin/banners/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const result = updateBannerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid banner data", details: result.error.issues });
      }

      // Normalize image URL if it's from object storage
      if (result.data.imageUrl) {
        const objectStorageService = new ObjectStorageService();
        result.data.imageUrl = objectStorageService.normalizeObjectEntityPath(result.data.imageUrl);
      }

      const banner = await storage.updateBanner(req.params.id, result.data);
      if (!banner) {
        return res.status(404).json({ error: "Banner not found" });
      }
      res.json(banner);
    } catch (error) {
      res.status(500).json({ error: "Failed to update banner" });
    }
  });

  app.delete("/api/admin/banners/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const deleted = await storage.deleteBanner(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Banner not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete banner" });
    }
  });

  // Special offers management routes
  app.get("/api/special-offers", async (req, res) => {
    try {
      const offers = await storage.getActiveSpecialOffers();
      res.json(offers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch special offers" });
    }
  });

  app.get("/api/admin/special-offers", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const offers = await storage.getAllSpecialOffers();
      res.json(offers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch special offers" });
    }
  });

  app.post("/api/admin/special-offers", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const result = insertSpecialOfferSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid offer data", details: result.error.issues });
      }

      // Normalize image URL if it's from object storage
      if (result.data.imageUrl) {
        const objectStorageService = new ObjectStorageService();
        result.data.imageUrl = objectStorageService.normalizeObjectEntityPath(result.data.imageUrl);
      }

      const offer = await storage.createSpecialOffer(result.data);
      res.json(offer);
    } catch (error) {
      res.status(500).json({ error: "Failed to create special offer" });
    }
  });

  app.put("/api/admin/special-offers/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const result = updateSpecialOfferSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid offer data", details: result.error.issues });
      }

      // Normalize image URL if it's from object storage
      if (result.data.imageUrl) {
        const objectStorageService = new ObjectStorageService();
        result.data.imageUrl = objectStorageService.normalizeObjectEntityPath(result.data.imageUrl);
      }

      const offer = await storage.updateSpecialOffer(req.params.id, result.data);
      if (!offer) {
        return res.status(404).json({ error: "Special offer not found" });
      }
      res.json(offer);
    } catch (error) {
      res.status(500).json({ error: "Failed to update special offer" });
    }
  });

  app.delete("/api/admin/special-offers/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const deleted = await storage.deleteSpecialOffer(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Special offer not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete special offer" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.put("/api/admin/users/:userId/password", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const { password } = req.body;
      
      if (!password || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      const hashedPassword = await hashPassword(password);
      const updated = await storage.updateUserPassword(req.params.userId, hashedPassword);
      
      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating user password:", error);
      res.status(500).json({ error: "Failed to update password" });
    }
  });

  app.post("/api/admin/users/:userId/block", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const { reason } = req.body;
      
      if (!reason || reason.trim().length === 0) {
        return res.status(400).json({ error: "Block reason is required" });
      }

      const blocked = await storage.blockUser(req.params.userId, reason, req.user.id);
      
      if (!blocked) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ success: true, message: "User blocked successfully" });
    } catch (error) {
      console.error("Error blocking user:", error);
      res.status(500).json({ error: "Failed to block user" });
    }
  });

  app.post("/api/admin/users/:userId/unblock", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const unblocked = await storage.unblockUser(req.params.userId);
      
      if (!unblocked) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ success: true, message: "User unblocked successfully" });
    } catch (error) {
      console.error("Error unblocking user:", error);
      res.status(500).json({ error: "Failed to unblock user" });
    }
  });

  app.get("/api/admin/orders", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.patch("/api/admin/orders/:id/status", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const result = updateOrderStatusSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const order = await storage.updateOrderStatus(req.params.id, result.data.status);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  app.get("/api/admin/stats", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Direct transfer order creation
  app.post("/api/payments/create-direct-transfer", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      const validatedData = createDirectTransferOrderSchema.parse(req.body);
      const product = await storage.getProduct(validatedData.productId);
      
      if (!product) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      const shippingAddress = validatedData.shippingAddressId 
        ? await storage.getAddress(validatedData.shippingAddressId)
        : undefined;

      // Create order with direct transfer payment type
      const orderNumber = `MB-TF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      const order = await storage.createOrder({
        userId: req.user.id,
        productId: product.id,
        quantity: validatedData.quantity,
        totalAmount: (parseFloat(validatedData.originalAmount) - parseFloat(validatedData.discountApplied) + 99).toString(), // Including shipping
        status: "PENDIENTE",
        paymentStatus: "pending",
        paymentType: "direct_transfer",
        originalAmount: validatedData.originalAmount,
        discountApplied: validatedData.discountApplied,
        shippingAddressId: shippingAddress?.id,
        orderNumber,
      });

      res.json({ 
        success: true, 
        order,
        bankDetails: {
          bankName: "BBVA México",
          clabe: "012180004799747847",
          accountHolder: "MercadoBoom SA de CV",
          reference: orderNumber,
          amount: order.totalAmount,
          instructions: [
            "Realiza la transferencia usando la CLABE interbancaria",
            "Usa como referencia el número de pedido: " + orderNumber,
            "Envía comprobante por WhatsApp: +52 55 1256 2704",
            "O por email: ventas@mercadoboom.com",
            "El pedido se procesa al confirmar el pago (24-48 hrs)"
          ]
        }
      });
    } catch (error: any) {
      console.error("Error creating direct transfer order:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Error interno del servidor" });
    }
  });

  // Payment routes
  app.post("/api/payments/create-preference", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      const validatedData = createPaymentPreferenceSchema.parse(req.body);
      const product = await storage.getProduct(validatedData.productId);
      
      if (!product) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      const shippingAddress = validatedData.shippingAddressId 
        ? await storage.getAddress(validatedData.shippingAddressId)
        : undefined;

      const paymentData = await createPaymentPreference(
        product,
        req.user,
        validatedData.quantity,
        shippingAddress
      );

      res.json(paymentData);
    } catch (error: any) {
      console.error("Error creating payment preference:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Error interno del servidor" });
    }
  });

  app.post("/api/payments/webhook", async (req, res) => {
    try {
      console.log("MercadoPago webhook received:", req.body);
      const success = await processPaymentWebhook(req.body);
      
      if (success) {
        res.status(200).json({ status: "processed" });
      } else {
        res.status(400).json({ status: "ignored" });
      }
    } catch (error: any) {
      console.error("Error processing webhook:", error);
      res.status(500).json({ error: "Error procesando webhook" });
    }
  });

  app.get("/api/payments/config", async (req, res) => {
    try {
      // Get active payment methods from config
      const allPaymentConfigs = await paymentConfigStorage.getAllPaymentConfigs();
      const paymentConfigs = allPaymentConfigs.filter(config => config.isActive);
      const activePaymentMethods = {
        mercadopago: false,
        bank_transfer: false,
        conekta: false
      };
      
      // Check which payment methods are active
      paymentConfigs.forEach(config => {
        if (config.configKey === "mercadopago" && config.isActive) {
          activePaymentMethods.mercadopago = true;
        }
        if (config.configKey === "bank_transfer" && config.isActive) {
          activePaymentMethods.bank_transfer = true;
        }
        if (config.configKey === "conekta" && config.isActive) {
          activePaymentMethods.conekta = true;
        }
      });
      
      res.json({
        publicKey: getMercadoPagoPublicKey(),
        env: process.env.NODE_ENV || 'development',
        activePaymentMethods
      });
    } catch (error) {
      console.error("Error fetching payment config:", error);
      // Fallback to basic config if there's an error
      res.json({
        publicKey: getMercadoPagoPublicKey(),
        env: process.env.NODE_ENV || 'development',
        activePaymentMethods: {
          mercadopago: true, // fallback to true if config can't be read
          bank_transfer: true,
          conekta: false
        }
      });
    }
  });

  // Payment success/failure pages
  app.get("/payment/success", async (req, res) => {
    const orderId = req.query.order as string;
    if (orderId) {
      await storage.updateOrderStatus(orderId, "PAGADO");
    }
    res.redirect(`/user-dashboard?payment=success&order=${orderId}`);
  });

  app.get("/payment/failure", (req, res) => {
    const orderId = req.query.order as string;
    res.redirect(`/user-dashboard?payment=failure&order=${orderId}`);
  });

  app.get("/payment/pending", (req, res) => {
    const orderId = req.query.order as string;
    res.redirect(`/user-dashboard?payment=pending&order=${orderId}`);
  });

  // Transfer verification endpoints (Admin only)
  app.post("/api/admin/verify-transfer", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const validatedData = verifyTransferSchema.parse(req.body);
      const order = await storage.getOrder(validatedData.orderId);
      
      if (!order) {
        return res.status(404).json({ error: "Pedido no encontrado" });
      }

      if (order.paymentType !== "direct_transfer") {
        return res.status(400).json({ error: "Este pedido no es por transferencia directa" });
      }

      const updatedOrder = await storage.updateOrderPaymentInfo(validatedData.orderId, {
        paymentStatus: validatedData.verified ? "verified" : "rejected",
        transferVerifiedAt: validatedData.verified ? new Date() : null,
        transferVerifiedBy: req.user.id,
        transferNotes: validatedData.notes,
      });

      if (validatedData.verified && updatedOrder) {
        await storage.updateOrderStatus(validatedData.orderId, "PAGADO");
      }

      res.json({ success: true, order: updatedOrder });
    } catch (error: any) {
      console.error("Error verifying transfer:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Upload receipt endpoint (User)
  app.post("/api/upload-receipt", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    try {
      const validatedData = uploadReceiptSchema.parse(req.body);
      const order = await storage.getOrder(validatedData.orderId);
      
      if (!order) {
        return res.status(404).json({ error: "Pedido no encontrado" });
      }

      if (order.userId !== req.user.id) {
        return res.status(403).json({ error: "No tienes permiso para acceder a este pedido" });
      }

      if (order.paymentType !== "direct_transfer") {
        return res.status(400).json({ error: "Este pedido no es por transferencia directa" });
      }

      const updatedOrder = await storage.updateOrderPaymentInfo(validatedData.orderId, {
        transferReceiptUrl: validatedData.receiptUrl,
        paymentStatus: "pending_verification",
      });

      res.json({ success: true, order: updatedOrder });
    } catch (error: any) {
      console.error("Error uploading receipt:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Get pending transfers (Admin only)
  app.get("/api/admin/pending-transfers", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const orders = await storage.getAllOrders();
      const pendingTransfers = orders.filter(order => 
        order.paymentType === "direct_transfer" && 
        ["pending", "pending_verification"].includes(order.paymentStatus || "")
      );
      res.json(pendingTransfers);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener transferencias pendientes" });
    }
  });

  // Payment configuration endpoints (Admin only)
  app.get("/api/admin/payment-config", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const configs = await paymentConfigStorage.getAllPaymentConfigs();
      res.json(configs);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener configuraciones de pago" });
    }
  });

  app.post("/api/admin/payment-config", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const validatedData = insertPaymentConfigSchema.parse(req.body);
      const config = await paymentConfigStorage.createPaymentConfig(validatedData);
      res.json({ success: true, config });
    } catch (error: any) {
      console.error("Error creating payment config:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  app.patch("/api/admin/payment-config/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const { id } = req.params;
      const validatedData = updatePaymentConfigSchema.parse({ ...req.body, id });
      const config = await paymentConfigStorage.updatePaymentConfig(id, validatedData);
      
      if (!config) {
        return res.status(404).json({ error: "Configuración no encontrada" });
      }
      
      res.json({ success: true, config });
    } catch (error: any) {
      console.error("Error updating payment config:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Support ticket routes
  app.post("/api/support/tickets", async (req, res) => {
    try {
      console.log("[DEBUG] Creating support ticket, body:", req.body);
      const result = insertSupportTicketSchema.safeParse(req.body);
      if (!result.success) {
        console.log("[DEBUG] Validation failed:", result.error.issues);
        return res.status(400).json({ error: "Invalid ticket data", details: result.error.issues });
      }

      const ticketNumber = `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      const ticketData = {
        ...result.data,
        ticketNumber,
        userId: req.user?.id || null,
        // Use authenticated user data if available
        email: result.data.email || req.user?.email || '',
        name: result.data.name || req.user?.fullName || req.user?.username || '',
        // Convert empty string to null for optional foreign keys
        orderId: result.data.orderId && result.data.orderId.trim() !== '' ? result.data.orderId : null,
      };
      
      console.log("[DEBUG] Ticket data to create:", ticketData);
      const ticket = await storage.createSupportTicket(ticketData);
      console.log("[DEBUG] Ticket created successfully:", ticket);
      res.status(201).json(ticket);
    } catch (error) {
      console.error("[ERROR] Failed to create support ticket:", error);
      console.error("[ERROR] Stack trace:", error instanceof Error ? error.stack : error);
      res.status(500).json({ error: "Failed to create support ticket" });
    }
  });

  app.get("/api/support/tickets", async (req, res) => {
    try {
      if (req.user?.isAdmin) {
        const tickets = await storage.getAllSupportTickets();
        res.json(tickets);
      } else if (req.user) {
        const tickets = await storage.getUserSupportTickets(req.user.id);
        res.json(tickets);
      } else {
        res.status(401).json({ error: "Authentication required" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tickets" });
    }
  });

  app.get("/api/support/tickets/:id", async (req, res) => {
    try {
      const ticket = await storage.getSupportTicket(req.params.id);
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      if (!req.user?.isAdmin && ticket.userId !== req.user?.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const messages = await storage.getTicketMessages(req.params.id);
      res.json({ ticket, messages });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ticket details" });
    }
  });

  app.post("/api/support/tickets/:id/messages", async (req, res) => {
    try {
      const ticket = await storage.getSupportTicket(req.params.id);
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      if (!req.user?.isAdmin && ticket.userId !== req.user?.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const result = insertTicketMessageSchema.safeParse({
        ...req.body,
        ticketId: req.params.id,
        senderId: req.user?.id || null,
        senderType: req.user?.isAdmin ? "ADMIN" : "CLIENTE",
        senderName: req.user?.username || req.body.senderName,
        senderEmail: req.user?.email || req.body.senderEmail,
      });

      if (!result.success) {
        return res.status(400).json({ error: "Invalid message data", details: result.error.issues });
      }

      const message = await storage.createTicketMessage(result.data);
      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to create message" });
    }
  });

  app.patch("/api/admin/support/tickets/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const result = updateTicketStatusSchema.safeParse({
        ...req.body,
        ticketId: req.params.id,
      });

      if (!result.success) {
        return res.status(400).json({ error: "Invalid update data", details: result.error.issues });
      }

      const ticket = await storage.updateSupportTicket(result.data);
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ error: "Failed to update ticket" });
    }
  });

  app.get("/api/admin/support/stats", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const stats = await storage.getSupportTicketStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch support stats" });
    }
  });

  // Transfer discount configuration routes
  app.get("/api/admin/transfer-discount-config", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const config = await storage.getTransferDiscountConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transfer discount config" });
    }
  });

  app.put("/api/admin/transfer-discount-config", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const { insertTransferDiscountConfigSchema } = await import("@shared/schema");
      const result = insertTransferDiscountConfigSchema.safeParse({
        ...req.body,
        updatedBy: req.user.id,
      });

      if (!result.success) {
        return res.status(400).json({ error: "Invalid configuration data", details: result.error.issues });
      }

      const updatedConfig = await storage.updateTransferDiscountConfig(result.data);
      res.json(updatedConfig);
    } catch (error) {
      console.error("Error updating transfer discount config:", error);
      res.status(500).json({ error: "Failed to update transfer discount config" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
