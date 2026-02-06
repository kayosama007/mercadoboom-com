var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  addresses: () => addresses,
  banners: () => banners,
  categories: () => categories,
  createDirectTransferOrderSchema: () => createDirectTransferOrderSchema,
  createPaymentPreferenceSchema: () => createPaymentPreferenceSchema,
  generateResetTokenSchema: () => generateResetTokenSchema,
  insertAddressSchema: () => insertAddressSchema,
  insertBannerSchema: () => insertBannerSchema,
  insertCategorySchema: () => insertCategorySchema,
  insertOrderSchema: () => insertOrderSchema,
  insertPaymentConfigSchema: () => insertPaymentConfigSchema,
  insertProductSchema: () => insertProductSchema,
  insertSecurityLogSchema: () => insertSecurityLogSchema,
  insertSpecialOfferSchema: () => insertSpecialOfferSchema,
  insertSupportTicketSchema: () => insertSupportTicketSchema,
  insertTicketMessageSchema: () => insertTicketMessageSchema,
  insertTransferDiscountConfigSchema: () => insertTransferDiscountConfigSchema,
  insertUserSchema: () => insertUserSchema,
  orders: () => orders,
  passwordResetConfirmSchema: () => passwordResetConfirmSchema,
  passwordResetRequestSchema: () => passwordResetRequestSchema,
  paymentConfig: () => paymentConfig,
  paymentWebhookSchema: () => paymentWebhookSchema,
  products: () => products,
  resetPasswordSchema: () => resetPasswordSchema,
  securityLogs: () => securityLogs,
  specialOffers: () => specialOffers,
  supportTickets: () => supportTickets,
  ticketMessages: () => ticketMessages,
  transferDiscountConfig: () => transferDiscountConfig,
  updateBannerSchema: () => updateBannerSchema,
  updateOrderStatusSchema: () => updateOrderStatusSchema,
  updatePaymentConfigSchema: () => updatePaymentConfigSchema,
  updateSpecialOfferSchema: () => updateSpecialOfferSchema,
  updateTicketStatusSchema: () => updateTicketStatusSchema,
  uploadReceiptSchema: () => uploadReceiptSchema,
  users: () => users,
  verifyTransferSchema: () => verifyTransferSchema
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users, securityLogs, categories, products, addresses, orders, insertUserSchema, insertSecurityLogSchema, insertCategorySchema, insertProductSchema, insertAddressSchema, insertOrderSchema, updateOrderStatusSchema, verifyTransferSchema, uploadReceiptSchema, paymentConfig, insertPaymentConfigSchema, updatePaymentConfigSchema, createPaymentPreferenceSchema, createDirectTransferOrderSchema, paymentWebhookSchema, resetPasswordSchema, generateResetTokenSchema, supportTickets, ticketMessages, insertSupportTicketSchema, insertTicketMessageSchema, updateTicketStatusSchema, transferDiscountConfig, insertTransferDiscountConfigSchema, banners, specialOffers, insertBannerSchema, insertSpecialOfferSchema, updateBannerSchema, updateSpecialOfferSchema, passwordResetRequestSchema, passwordResetConfirmSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    users = pgTable("users", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      username: text("username").notNull().unique(),
      email: text("email").notNull().unique(),
      password: text("password").notNull(),
      fullName: text("full_name").notNull(),
      phone: text("phone"),
      isAdmin: boolean("is_admin").default(false),
      resetToken: text("reset_token"),
      resetTokenExpiry: timestamp("reset_token_expiry"),
      // Two-factor authentication fields
      twoFactorEnabled: boolean("two_factor_enabled").default(false),
      twoFactorMethod: text("two_factor_method"),
      // "email", "sms", "whatsapp", "email_sms", "email_whatsapp", "sms_whatsapp", "all"
      verificationCode: text("verification_code"),
      verificationCodeExpiry: timestamp("verification_code_expiry"),
      isPhoneVerified: boolean("is_phone_verified").default(false),
      isEmailVerified: boolean("is_email_verified").default(false),
      // User blocking fields
      isBlocked: boolean("is_blocked").default(false),
      blockReason: text("block_reason"),
      blockedAt: timestamp("blocked_at"),
      blockedBy: varchar("blocked_by"),
      createdAt: timestamp("created_at").defaultNow()
    });
    securityLogs = pgTable("security_logs", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id).notNull(),
      action: text("action").notNull(),
      // "login", "order", "profile_change", "admin_access"
      method: text("method").notNull(),
      // "sms", "email"
      code: text("code").notNull(),
      verified: boolean("verified").default(false),
      ipAddress: text("ip_address"),
      userAgent: text("user_agent"),
      createdAt: timestamp("created_at").defaultNow(),
      verifiedAt: timestamp("verified_at")
    });
    categories = pgTable("categories", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      emoji: text("emoji"),
      isActive: boolean("is_active").default(true)
    });
    products = pgTable("products", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      description: text("description"),
      price: decimal("price", { precision: 10, scale: 2 }).notNull(),
      originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
      categoryId: varchar("category_id").references(() => categories.id),
      imageUrl: text("image_url"),
      images: text("images").array(),
      // Array of additional product images
      stock: integer("stock").default(0),
      rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
      reviewCount: integer("review_count").default(0),
      promotionType: text("promotion_type"),
      // "BOOM", "OFERTA", "RELAMPAGO", "NUEVO"
      isActive: boolean("is_active").default(true),
      isFeatured: boolean("is_featured").default(false),
      isAffiliate: boolean("is_affiliate").default(false),
      affiliateUrl: text("affiliate_url"),
      // URL externa para productos afiliados
      affiliateStore: text("affiliate_store"),
      // Nombre de la tienda afiliada (ej: "Amazon", "MercadoLibre")
      // Shipping settings
      shippingMethod: text("shipping_method").default("Env\xEDo Est\xE1ndar"),
      deliveryTime: text("delivery_time").default("3-5 d\xEDas h\xE1biles"),
      freeShipping: boolean("free_shipping").default(false),
      freeShippingMinAmount: decimal("free_shipping_min_amount", { precision: 10, scale: 2 }).default("999"),
      // Transfer discount settings
      allowTransferDiscount: boolean("allow_transfer_discount").default(true),
      transferDiscountPercent: decimal("transfer_discount_percent", { precision: 5, scale: 2 }).default("3.50"),
      // Import product settings
      isImported: boolean("is_imported").default(false),
      importDeliveryDays: integer("import_delivery_days").default(15),
      importDescription: text("import_description").default("Producto de importaci\xF3n"),
      createdAt: timestamp("created_at").defaultNow()
    });
    addresses = pgTable("addresses", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id).notNull(),
      title: text("title").notNull(),
      street: text("street").notNull(),
      city: text("city").notNull(),
      state: text("state").notNull(),
      postalCode: text("postal_code").notNull(),
      country: text("country").default("M\xE9xico"),
      isDefault: boolean("is_default").default(false)
    });
    orders = pgTable("orders", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id).notNull(),
      productId: varchar("product_id").references(() => products.id).notNull(),
      quantity: integer("quantity").default(1),
      totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
      status: text("status").notNull().default("PENDIENTE"),
      // PENDIENTE, PAGADO, EN_PREPARACION, RECOGIDO, ENVIADO, EN_RUTA, ENTREGADO
      paymentStatus: text("payment_status").default("pending"),
      // pending, approved, rejected, cancelled, verified
      paymentId: text("payment_id"),
      // MercadoPago payment ID
      preferenceId: text("preference_id"),
      // MercadoPago preference ID
      paymentMethod: text("payment_method"),
      // credit_card, debit_card, bank_transfer, direct_transfer, etc.
      paymentType: text("payment_type").default("mercadopago"),
      // mercadopago, direct_transfer
      discountApplied: decimal("discount_applied", { precision: 10, scale: 2 }).default("0"),
      originalAmount: decimal("original_amount", { precision: 10, scale: 2 }),
      // Transfer verification fields
      transferReceiptUrl: text("transfer_receipt_url"),
      // URL of uploaded receipt
      transferVerifiedAt: timestamp("transfer_verified_at"),
      transferVerifiedBy: varchar("transfer_verified_by").references(() => users.id),
      transferNotes: text("transfer_notes"),
      // Admin notes about the transfer
      shippingAddressId: varchar("shipping_address_id").references(() => addresses.id),
      trackingNumber: text("tracking_number"),
      courierService: text("courier_service"),
      // DHL, FedEx, Estafeta, etc.
      estimatedDelivery: timestamp("estimated_delivery"),
      actualDelivery: timestamp("actual_delivery"),
      statusHistory: jsonb("status_history").default([]),
      // Array of status changes with timestamps
      orderNumber: text("order_number").notNull().unique(),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertUserSchema = createInsertSchema(users).pick({
      username: true,
      email: true,
      password: true,
      fullName: true,
      phone: true
    });
    insertSecurityLogSchema = createInsertSchema(securityLogs).omit({
      id: true,
      createdAt: true,
      verifiedAt: true
    });
    insertCategorySchema = createInsertSchema(categories).omit({
      id: true
    });
    insertProductSchema = createInsertSchema(products).omit({
      id: true,
      createdAt: true
    }).extend({
      images: z.array(z.string()).optional().default([]),
      allowTransferDiscount: z.boolean().default(true),
      transferDiscountPercent: z.string().default("3.50"),
      isImported: z.boolean().default(false),
      importDeliveryDays: z.number().default(15),
      importDescription: z.string().default("Producto de importaci\xF3n")
    });
    insertAddressSchema = createInsertSchema(addresses).omit({
      id: true
    });
    insertOrderSchema = createInsertSchema(orders).omit({
      id: true,
      orderNumber: true,
      createdAt: true,
      updatedAt: true
    });
    updateOrderStatusSchema = z.object({
      status: z.enum(["PENDIENTE", "PAGADO", "EN_PREPARACION", "RECOGIDO", "ENVIADO", "EN_RUTA", "ENTREGADO"])
    });
    verifyTransferSchema = z.object({
      orderId: z.string().min(1, "ID del pedido requerido"),
      verified: z.boolean(),
      notes: z.string().optional()
    });
    uploadReceiptSchema = z.object({
      orderId: z.string().min(1, "ID del pedido requerido"),
      receiptUrl: z.string().url("URL del comprobante inv\xE1lida")
    });
    paymentConfig = pgTable("payment_config", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      configKey: text("config_key").notNull().unique(),
      // mercadopago, bank_transfer, conekta
      isActive: boolean("is_active").default(true),
      displayName: text("display_name").notNull(),
      config: text("config").notNull(),
      // Store configuration as JSON string
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertPaymentConfigSchema = createInsertSchema(paymentConfig, {
      config: z.string().min(1, "Configuraci\xF3n requerida")
    }).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    updatePaymentConfigSchema = z.object({
      id: z.string(),
      isActive: z.boolean().optional(),
      displayName: z.string().optional(),
      config: z.string().optional()
    });
    createPaymentPreferenceSchema = z.object({
      productId: z.string().min(1, "El producto es requerido"),
      quantity: z.number().min(1, "La cantidad debe ser mayor a 0"),
      shippingAddressId: z.string().optional(),
      paymentType: z.enum(["mercadopago", "direct_transfer"]).default("mercadopago")
    });
    createDirectTransferOrderSchema = z.object({
      productId: z.string().min(1, "El producto es requerido"),
      quantity: z.number().min(1, "La cantidad debe ser mayor a 0"),
      shippingAddressId: z.string().optional(),
      originalAmount: z.string().min(1, "El monto original es requerido"),
      discountApplied: z.string().min(1, "El descuento aplicado es requerido")
    });
    paymentWebhookSchema = z.object({
      id: z.string(),
      type: z.string(),
      data: z.object({
        id: z.string()
      })
    });
    resetPasswordSchema = z.object({
      username: z.string().min(1, "El nombre de usuario es requerido"),
      newPassword: z.string().min(8, "La contrase\xF1a debe tener al menos 8 caracteres"),
      resetToken: z.string().min(1, "El token de recuperaci\xF3n es requerido")
    });
    generateResetTokenSchema = z.object({
      username: z.string().min(1, "El nombre de usuario es requerido")
    });
    supportTickets = pgTable("support_tickets", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      ticketNumber: text("ticket_number").notNull().unique(),
      userId: varchar("user_id").references(() => users.id),
      email: text("email").notNull(),
      // Para usuarios no registrados
      name: text("name").notNull(),
      subject: text("subject").notNull(),
      description: text("description").notNull(),
      category: text("category").notNull(),
      // "PEDIDO", "PAGO", "TECNICO", "DEVOLUCION", "OTRO"
      priority: text("priority").notNull().default("MEDIO"),
      // "BAJO", "MEDIO", "ALTO", "URGENTE"
      status: text("status").notNull().default("ABIERTO"),
      // "ABIERTO", "EN_PROCESO", "ESPERANDO_CLIENTE", "RESUELTO", "CERRADO"
      orderId: varchar("order_id").references(() => orders.id),
      // Opcional, si está relacionado con un pedido
      attachments: jsonb("attachments").default([]),
      // Array de URLs de archivos adjuntos
      assignedTo: varchar("assigned_to").references(() => users.id),
      // Admin asignado
      adminNotes: text("admin_notes"),
      // Notas internas del admin
      resolution: text("resolution"),
      // Descripción de la resolución
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow(),
      resolvedAt: timestamp("resolved_at")
    });
    ticketMessages = pgTable("ticket_messages", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      ticketId: varchar("ticket_id").references(() => supportTickets.id, { onDelete: "cascade" }).notNull(),
      senderId: varchar("sender_id").references(() => users.id),
      senderType: text("sender_type").notNull(),
      // "CLIENTE", "ADMIN"
      senderName: text("sender_name").notNull(),
      senderEmail: text("sender_email").notNull(),
      message: text("message").notNull(),
      attachments: jsonb("attachments").default([]),
      isInternal: boolean("is_internal").default(false),
      // Solo visible para admins
      createdAt: timestamp("created_at").defaultNow()
    });
    insertSupportTicketSchema = createInsertSchema(supportTickets, {
      subject: z.string().min(1, "El asunto es requerido"),
      description: z.string().min(10, "La descripci\xF3n debe tener al menos 10 caracteres"),
      email: z.string().email("Email inv\xE1lido").optional(),
      name: z.string().min(1, "El nombre es requerido").optional(),
      category: z.enum(["PEDIDO", "PAGO", "TECNICO", "DEVOLUCION", "OTRO"]),
      priority: z.enum(["BAJO", "MEDIO", "ALTO", "URGENTE"]).optional()
    }).omit({
      id: true,
      ticketNumber: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      resolvedAt: true
    });
    insertTicketMessageSchema = createInsertSchema(ticketMessages, {
      message: z.string().min(1, "El mensaje es requerido"),
      senderName: z.string().min(1, "El nombre es requerido"),
      senderEmail: z.string().email("Email inv\xE1lido"),
      senderType: z.enum(["CLIENTE", "ADMIN"])
    }).omit({
      id: true,
      createdAt: true
    });
    updateTicketStatusSchema = z.object({
      ticketId: z.string().min(1, "ID del ticket requerido"),
      status: z.enum(["ABIERTO", "EN_PROCESO", "ESPERANDO_CLIENTE", "RESUELTO", "CERRADO"]),
      assignedTo: z.string().optional(),
      adminNotes: z.string().optional(),
      resolution: z.string().optional()
    });
    transferDiscountConfig = pgTable("transfer_discount_config", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).notNull().default("3.50"),
      discountText: text("discount_text").notNull().default("por evitar comisiones"),
      isActive: boolean("is_active").notNull().default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow(),
      updatedBy: varchar("updated_by").references(() => users.id)
    });
    insertTransferDiscountConfigSchema = createInsertSchema(transferDiscountConfig).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    banners = pgTable("banners", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      title: varchar("title", { length: 200 }).notNull(),
      subtitle: varchar("subtitle", { length: 300 }),
      imageUrl: varchar("image_url", { length: 500 }),
      buttonText: varchar("button_text", { length: 100 }),
      buttonLink: varchar("button_link", { length: 500 }),
      backgroundColor: varchar("background_color", { length: 50 }).default("#ff4444"),
      textColor: varchar("text_color", { length: 50 }).default("#ffffff"),
      isTransparent: boolean("is_transparent").default(false),
      isActive: boolean("is_active").default(true),
      displayOrder: integer("display_order").default(0),
      startDate: timestamp("start_date"),
      endDate: timestamp("end_date"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    specialOffers = pgTable("special_offers", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      title: varchar("title", { length: 200 }).notNull(),
      description: varchar("description", { length: 500 }),
      discountPercentage: integer("discount_percentage"),
      originalPrice: varchar("original_price", { length: 50 }),
      offerPrice: varchar("offer_price", { length: 50 }),
      imageUrl: varchar("image_url", { length: 500 }),
      productId: varchar("product_id"),
      offerType: varchar("offer_type", { length: 50 }).default("BOOM"),
      // BOOM, OFERTA, RELAMPAGO, ESPECIAL
      isActive: boolean("is_active").default(true),
      displayOrder: integer("display_order").default(0),
      startDate: timestamp("start_date"),
      endDate: timestamp("end_date"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertBannerSchema = createInsertSchema(banners).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertSpecialOfferSchema = createInsertSchema(specialOffers).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    updateBannerSchema = insertBannerSchema.partial();
    updateSpecialOfferSchema = insertSpecialOfferSchema.partial();
    passwordResetRequestSchema = z.object({
      identifier: z.string().min(1, "Campo requerido"),
      method: z.enum(["username", "email", "phone"], {
        errorMap: () => ({ message: "M\xE9todo de recuperaci\xF3n inv\xE1lido" })
      })
    });
    passwordResetConfirmSchema = z.object({
      identifier: z.string().min(1, "Campo requerido"),
      resetToken: z.string().min(1, "Token de recuperaci\xF3n requerido"),
      newPassword: z.string().min(8, "La contrase\xF1a debe tener al menos 8 caracteres"),
      method: z.enum(["username", "email", "phone"], {
        errorMap: () => ({ message: "M\xE9todo de recuperaci\xF3n inv\xE1lido" })
      })
    });
  }
});

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session2 from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

// server/storage.ts
import session from "express-session";
import createMemoryStore from "memorystore";
import { eq, desc, and, sql as sql2 } from "drizzle-orm";

// server/db.ts
init_schema();
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
if (typeof WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws;
}
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle(pool, { schema: schema_exports });

// server/storage.ts
init_schema();
var MemoryStore = createMemoryStore(session);
var DbStorage = class {
  sessionStore;
  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 864e5
    });
    this.initializeData();
  }
  async initializeData() {
    const existingAdmin = await db.select().from(users).where(eq(users.username, "admin")).limit(1);
    if (existingAdmin.length === 0) {
      await db.insert(users).values({
        username: "admin",
        email: "ventas@mercadoboom.com",
        password: "4793bbf5cecad2d304f6e1274977ac0088b758c5847b094e5a826a23c9dc3dcd3b415ecc34942acb0d05df26cb456c5784eb97c56450656eb351f4cfc6b7e040.d2e8b9b2e1be66eee1469803c4ff4362",
        fullName: "Administrador MercadoBoom",
        phone: "+52 55 1234 5678",
        isAdmin: true
      });
    }
    const existingCategories = await db.select().from(categories).limit(1);
    if (existingCategories.length === 0) {
      const categoriesToInsert = [
        { name: "Smartphones", emoji: "\u{1F4F1}", isActive: true },
        { name: "Laptops", emoji: "\u{1F4BB}", isActive: true },
        { name: "Audio", emoji: "\u{1F3A7}", isActive: true },
        { name: "C\xE1maras", emoji: "\u{1F4F7}", isActive: true },
        { name: "Gaming", emoji: "\u{1F3AE}", isActive: true }
      ];
      for (const cat of categoriesToInsert) {
        await db.insert(categories).values(cat);
      }
    }
    const existingProducts = await db.select().from(products).limit(1);
    if (existingProducts.length === 0) {
      const smartphonesCat = await db.select().from(categories).where(eq(categories.name, "Smartphones")).limit(1);
      if (smartphonesCat.length > 0) {
        await db.insert(products).values({
          name: "iPhone 15 Pro Max 256GB",
          description: "El iPhone m\xE1s avanzado con chip A17 Pro y c\xE1maras profesionales",
          price: "32999.00",
          originalPrice: "35999.00",
          categoryId: smartphonesCat[0].id,
          imageUrl: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500",
          stock: 15,
          rating: "4.8",
          reviewCount: 127,
          promotionType: "BOOM",
          isActive: true,
          isFeatured: true
        });
      }
    }
    const existingConfig = await db.select().from(transferDiscountConfig).limit(1);
    if (existingConfig.length === 0) {
      await db.insert(transferDiscountConfig).values({
        discountPercentage: "3.50",
        discountText: "por evitar comisiones",
        isActive: true
      });
    }
  }
  // User management
  async getUser(id) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }
  async getUserByUsername(username) {
    const result = await db.select().from(users).where(
      sql2`LOWER(${users.username}) = LOWER(${username})`
    ).limit(1);
    return result[0];
  }
  async getUserByEmail(email) {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }
  async getUserByPhone(phone) {
    const result = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
    return result[0];
  }
  async createUser(insertUser) {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }
  async getAllUsers() {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }
  async updateUserResetToken(username, resetToken, expiry) {
    const result = await db.update(users).set({ resetToken, resetTokenExpiry: expiry }).where(eq(users.username, username)).returning();
    return result[0];
  }
  async resetUserPassword(username, resetToken, newHashedPassword) {
    const user = await this.getUserByUsername(username);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }
    if (user.resetToken !== resetToken) {
      throw new Error("Token de recuperaci\xF3n inv\xE1lido");
    }
    if (!user.resetTokenExpiry || user.resetTokenExpiry < /* @__PURE__ */ new Date()) {
      throw new Error("Token de recuperaci\xF3n expirado");
    }
    const result = await db.update(users).set({
      password: newHashedPassword,
      resetToken: null,
      resetTokenExpiry: null
    }).where(eq(users.username, username)).returning();
    return result[0];
  }
  async updateUserPassword(userId, hashedPassword) {
    const result = await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId)).returning();
    return result.length > 0;
  }
  async updateUserProfile(id, profile) {
    const result = await db.update(users).set(profile).where(eq(users.id, id)).returning();
    return result[0];
  }
  async blockUser(userId, reason, blockedBy) {
    const result = await db.update(users).set({
      isBlocked: true,
      blockReason: reason,
      blockedAt: /* @__PURE__ */ new Date(),
      blockedBy
    }).where(eq(users.id, userId)).returning();
    return result.length > 0;
  }
  async unblockUser(userId) {
    const result = await db.update(users).set({
      isBlocked: false,
      blockReason: null,
      blockedAt: null,
      blockedBy: null
    }).where(eq(users.id, userId)).returning();
    return result.length > 0;
  }
  // Category management
  async getAllCategories() {
    return await db.select().from(categories).where(eq(categories.isActive, true));
  }
  async createCategory(category) {
    const result = await db.insert(categories).values(category).returning();
    return result[0];
  }
  // Product management
  async getAllProducts() {
    return await db.select().from(products).where(eq(products.isActive, true));
  }
  async getFeaturedProducts() {
    return await db.select().from(products).where(and(eq(products.isActive, true), eq(products.isFeatured, true)));
  }
  async getProductsByCategory(categoryId) {
    return await db.select().from(products).where(and(eq(products.isActive, true), eq(products.categoryId, categoryId)));
  }
  async getProduct(id) {
    const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return result[0];
  }
  async createProduct(product) {
    const result = await db.insert(products).values(product).returning();
    return result[0];
  }
  async updateProduct(id, product) {
    const result = await db.update(products).set(product).where(eq(products.id, id)).returning();
    return result[0];
  }
  async deleteProduct(id) {
    const result = await db.update(products).set({ isActive: false }).where(eq(products.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
  // Address management
  async getUserAddresses(userId) {
    return await db.select().from(addresses).where(eq(addresses.userId, userId));
  }
  async createAddress(address) {
    const result = await db.insert(addresses).values(address).returning();
    return result[0];
  }
  async updateAddress(id, address) {
    const result = await db.update(addresses).set(address).where(eq(addresses.id, id)).returning();
    return result[0];
  }
  async deleteAddress(id) {
    const result = await db.delete(addresses).where(eq(addresses.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
  async getAddress(id) {
    const result = await db.select().from(addresses).where(eq(addresses.id, id)).limit(1);
    return result[0];
  }
  // Simplified implementations for remaining methods...
  async createOrder(order) {
    const orderNumber = `BB-${(/* @__PURE__ */ new Date()).getFullYear()}-${String(Date.now()).slice(-6)}`;
    const result = await db.insert(orders).values({
      ...order,
      orderNumber,
      status: "PENDIENTE",
      statusHistory: []
    }).returning();
    return result[0];
  }
  async getUserOrders(userId) {
    const userOrders = await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
    return userOrders.map((order) => ({
      ...order,
      product: { id: "", name: "Product", description: "", price: "0", categoryId: null, stock: 0, rating: "0", reviewCount: 0, isActive: true, isFeatured: false, isAffiliate: false, affiliateUrl: null, affiliateStore: null, shippingMethod: "Env\xEDo Est\xE1ndar", deliveryTime: "3-5 d\xEDas h\xE1biles", freeShipping: false, freeShippingMinAmount: "999", allowTransferDiscount: true, transferDiscountPercent: "3.50", createdAt: /* @__PURE__ */ new Date(), imageUrl: null, originalPrice: null, promotionType: null },
      user: { id: userId, username: "", email: "", fullName: "" }
    }));
  }
  async getAllOrders() {
    const allOrders = await db.select({
      order: orders,
      product: products,
      user: users,
      address: addresses
    }).from(orders).leftJoin(products, eq(orders.productId, products.id)).leftJoin(users, eq(orders.userId, users.id)).leftJoin(addresses, eq(orders.shippingAddressId, addresses.id)).orderBy(desc(orders.createdAt));
    return allOrders.map((row) => ({
      ...row.order,
      product: row.product,
      shippingAddress: row.address || void 0,
      user: {
        id: row.user.id,
        username: row.user.username,
        email: row.user.email,
        fullName: row.user.fullName
      }
    }));
  }
  async getOrder(id) {
    const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!result[0]) return void 0;
    return {
      ...result[0],
      product: { id: "", name: "Product", description: "", price: "0", categoryId: null, stock: 0, rating: "0", reviewCount: 0, isActive: true, isFeatured: false, isAffiliate: false, affiliateUrl: null, affiliateStore: null, shippingMethod: "Env\xEDo Est\xE1ndar", deliveryTime: "3-5 d\xEDas h\xE1biles", freeShipping: false, freeShippingMinAmount: "999", allowTransferDiscount: true, transferDiscountPercent: "3.50", createdAt: /* @__PURE__ */ new Date(), imageUrl: null, originalPrice: null, promotionType: null },
      user: { id: "", username: "", email: "", fullName: "" }
    };
  }
  async updateOrderStatus(id, status) {
    const result = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
    return result[0];
  }
  async updateOrderPaymentInfo(id, paymentInfo) {
    const result = await db.update(orders).set(paymentInfo).where(eq(orders.id, id)).returning();
    return result[0];
  }
  // For now, implement remaining methods with basic functionality
  async getAdminStats() {
    const userCount = await db.select().from(users);
    const orderCount = await db.select().from(orders);
    return {
      activeUsers: userCount.length,
      totalSales: "$0.0M",
      totalOrders: orderCount.length,
      pendingOrders: orderCount.filter((o) => o.status === "PENDIENTE").length
    };
  }
  // Stub implementations for other methods - these can be implemented as needed
  async getOrderStats() {
    return {};
  }
  async getRecentOrders(limit = 10) {
    return [];
  }
  async uploadTransferReceipt(orderId, receiptUrl) {
    return void 0;
  }
  async verifyTransfer(orderId, verified, notes, adminId) {
    return void 0;
  }
  async createPaymentConfig(config) {
    return {};
  }
  async updatePaymentConfig(id, config) {
    return {};
  }
  async getAllPaymentConfigs() {
    return [];
  }
  async getActivePaymentConfigs() {
    return [];
  }
  async createSupportTicket(ticket) {
    const result = await db.insert(supportTickets).values({
      ...ticket,
      status: "ABIERTO"
    }).returning();
    return result[0];
  }
  async getUserSupportTickets(userId) {
    return await db.select().from(supportTickets).where(eq(supportTickets.userId, userId)).orderBy(desc(supportTickets.createdAt));
  }
  async getAllSupportTickets() {
    return await db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt));
  }
  async updateTicketStatus(ticketId, status, assignedTo, adminNotes, resolution) {
    const updateData = { status };
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (adminNotes) updateData.adminNotes = adminNotes;
    if (resolution) updateData.resolution = resolution;
    if (status === "RESUELTO" || status === "CERRADO") updateData.resolvedAt = /* @__PURE__ */ new Date();
    const result = await db.update(supportTickets).set(updateData).where(eq(supportTickets.id, ticketId)).returning();
    return result[0];
  }
  async getSupportTicket(id) {
    const result = await db.select().from(supportTickets).where(eq(supportTickets.id, id)).limit(1);
    return result[0];
  }
  async updateSupportTicket(data) {
    const updateData = {};
    if (data.status) updateData.status = data.status;
    if (data.assignedTo) updateData.assignedTo = data.assignedTo;
    if (data.adminNotes) updateData.adminNotes = data.adminNotes;
    if (data.resolution) updateData.resolution = data.resolution;
    if (data.status === "RESUELTO" || data.status === "CERRADO") {
      updateData.resolvedAt = /* @__PURE__ */ new Date();
    }
    const result = await db.update(supportTickets).set(updateData).where(eq(supportTickets.id, data.ticketId)).returning();
    return result[0];
  }
  async getSupportTicketStats() {
    return {};
  }
  async createTicketMessage(message) {
    const result = await db.insert(ticketMessages).values(message).returning();
    return result[0];
  }
  async getTicketMessages(ticketId) {
    return await db.select().from(ticketMessages).where(eq(ticketMessages.ticketId, ticketId)).orderBy(ticketMessages.createdAt);
  }
  async createBanner(banner) {
    const result = await db.insert(banners).values(banner).returning();
    return result[0];
  }
  async getAllBanners() {
    return await db.select().from(banners).orderBy(desc(banners.displayOrder));
  }
  async getActiveBanners() {
    return await db.select().from(banners).where(eq(banners.isActive, true)).orderBy(desc(banners.displayOrder));
  }
  async updateBanner(id, banner) {
    const result = await db.update(banners).set(banner).where(eq(banners.id, id)).returning();
    return result[0];
  }
  async deleteBanner(id) {
    const result = await db.delete(banners).where(eq(banners.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
  async createSpecialOffer(offer) {
    const result = await db.insert(specialOffers).values(offer).returning();
    return result[0];
  }
  async getAllSpecialOffers() {
    return await db.select().from(specialOffers).orderBy(desc(specialOffers.displayOrder));
  }
  async getActiveSpecialOffers() {
    return await db.select().from(specialOffers).where(eq(specialOffers.isActive, true)).orderBy(desc(specialOffers.displayOrder));
  }
  async updateSpecialOffer(id, offer) {
    const result = await db.update(specialOffers).set(offer).where(eq(specialOffers.id, id)).returning();
    return result[0];
  }
  async deleteSpecialOffer(id) {
    const result = await db.delete(specialOffers).where(eq(specialOffers.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
  async getTransferDiscountConfig() {
    const result = await db.select().from(transferDiscountConfig).where(eq(transferDiscountConfig.isActive, true)).limit(1);
    if (result.length === 0) {
      const defaultConfig = await db.insert(transferDiscountConfig).values({
        discountPercentage: "3.50",
        discountText: "por evitar comisiones",
        isActive: true
      }).returning();
      return defaultConfig[0];
    }
    return result[0];
  }
  async updateTransferDiscountConfig(config) {
    const { updatedBy, ...configData } = config;
    const result = await db.update(transferDiscountConfig).set({
      ...configData,
      updatedBy: updatedBy || null,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(transferDiscountConfig.isActive, true)).returning();
    return result[0];
  }
};
var storage = new DbStorage();

// server/auth.ts
init_schema();

// server/email-service.ts
import { MailService } from "@sendgrid/mail";
if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY not found - email sending will be simulated");
}
var mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}
async function sendEmail(params) {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.log("\u{1F4E7} SIMULATED EMAIL SENT:");
      console.log(`To: ${params.to}`);
      console.log(`From: ${params.from}`);
      console.log(`Subject: ${params.subject}`);
      console.log(`Text: ${params.text}`);
      console.log("\u2705 Email would be sent in production with SENDGRID_API_KEY");
      return true;
    }
    const emailData = {
      to: params.to,
      from: params.from,
      subject: params.subject
    };
    if (params.text) emailData.text = params.text;
    if (params.html) emailData.html = params.html;
    const response = await mailService.send(emailData);
    console.log(`\u{1F4E7} Email sent successfully to ${params.to}`);
    if (response && response[0]) {
      console.log(`\u{1F4E7} SendGrid Message ID: ${response[0].headers["x-message-id"] || "N/A"}`);
      console.log(`\u{1F4E7} SendGrid Status Code: ${response[0].statusCode}`);
      console.log(`\u{1F4E7} SendGrid Headers:`, JSON.stringify({
        "x-message-id": response[0].headers["x-message-id"],
        "server": response[0].headers["server"],
        "date": response[0].headers["date"]
      }, null, 2));
    }
    return true;
  } catch (error) {
    console.error("SendGrid email error:", error);
    if (error.response && error.response.body && error.response.body.errors) {
      console.error("SendGrid detailed errors:", JSON.stringify(error.response.body.errors, null, 2));
    }
    return false;
  }
}
async function sendPasswordResetEmail(email, resetToken, username) {
  const resetUrl = `${process.env.APP_URL || "http://localhost:5000"}/auth?reset=${resetToken}&username=${username}`;
  const emailParams = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL || "noreply@mercadoboom.com",
    subject: "Recuperaci\xF3n de Contrase\xF1a - MercadoBoom",
    text: `
Hola,

Has solicitado recuperar tu contrase\xF1a en MercadoBoom.

Tu token de recuperaci\xF3n es: ${resetToken}
Usuario: ${username}

Tambi\xE9n puedes usar este enlace para completar la recuperaci\xF3n:
${resetUrl}

Este token expira en 24 horas por seguridad.

Si no solicitaste esta recuperaci\xF3n, puedes ignorar este correo.

Saludos,
Equipo MercadoBoom
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ef4444, #f59e0b); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">MercadoBoom</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #374151;">Recuperaci\xF3n de Contrase\xF1a</h2>
          <p style="color: #6b7280; line-height: 1.6;">
            Has solicitado recuperar tu contrase\xF1a en MercadoBoom.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="margin: 0 0 10px 0; color: #374151;">Token de Recuperaci\xF3n:</h3>
            <p style="font-family: monospace; font-size: 18px; font-weight: bold; color: #ef4444; margin: 0;">${resetToken}</p>
            <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 14px;">Usuario: <strong>${username}</strong></p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Recuperar Contrase\xF1a
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 14px; line-height: 1.6;">
            Este token expira en 24 horas por seguridad.<br>
            Si no solicitaste esta recuperaci\xF3n, puedes ignorar este correo.
          </p>
        </div>
        <div style="background: #374151; padding: 20px; text-align: center;">
          <p style="color: #9ca3af; margin: 0; font-size: 14px;">
            \xA9 2024 MercadoBoom. Todos los derechos reservados.
          </p>
        </div>
      </div>
    `
  };
  return sendEmail(emailParams);
}

// server/sms-service.ts
import twilio from "twilio";
if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
  console.warn("Twilio credentials not found - SMS sending will be simulated");
} else if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
  console.log("\u2705 Twilio Messaging Service configured:", process.env.TWILIO_MESSAGING_SERVICE_SID);
}
async function sendSMS(params) {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.log("\u{1F4F1} SIMULATED SMS SENT:");
      console.log(`To: ${params.to}`);
      console.log(`Message: ${params.message}`);
      console.log("\u2705 SMS would be sent in production with Twilio credentials");
      return true;
    }
    const client2 = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const messageOptions = {
      body: params.message,
      to: params.to
    };
    if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
      messageOptions.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
      console.log(`\u{1F4F1} Using Twilio Messaging Service: ${process.env.TWILIO_MESSAGING_SERVICE_SID}`);
    } else if (process.env.TWILIO_PHONE_NUMBER) {
      messageOptions.from = process.env.TWILIO_PHONE_NUMBER;
      console.log(`\u{1F4F1} Using Twilio Phone Number: ${process.env.TWILIO_PHONE_NUMBER}`);
    } else {
      console.error("\u{1F4F1} No Twilio messaging service or phone number configured");
      return false;
    }
    const message = await client2.messages.create(messageOptions);
    console.log(`\u{1F4F1} SMS sent successfully to ${params.to}`);
    console.log(`\u{1F4F1} Twilio Message SID: ${message.sid}`);
    console.log(`\u{1F4F1} Message Status: ${message.status}`);
    return true;
  } catch (error) {
    console.error("SMS sending error:", error);
    if (error.code && error.moreInfo) {
      console.error(`\u{1F4F1} Twilio Error ${error.code}: ${error.message}`);
      console.error(`\u{1F4F1} More info: ${error.moreInfo}`);
    }
    return false;
  }
}
async function sendPasswordResetSMS(phone, resetToken, username) {
  const message = `MercadoBoom: Tu token de recuperaci\xF3n es: ${resetToken} para el usuario: ${username}. Expira en 24 horas. Si no solicitaste esto, ignora este mensaje.`;
  return sendSMS({
    to: phone,
    message
  });
}

// server/auth.ts
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) {
    return false;
  }
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  if (hashedBuf.length !== suppliedBuf.length) {
    return false;
  }
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
function generateResetToken() {
  return randomBytes(32).toString("hex");
}
function setupAuth(app2) {
  const sessionSettings = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore
  };
  app2.set("trust proxy", 1);
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return done(null, false);
      }
      if (user.isBlocked) {
        return done(null, false, { message: "Tu cuenta ha sido bloqueada. Contacta con el administrador." });
      }
      if (!await comparePasswords(password, user.password)) {
        return done(null, false);
      }
      return done(null, user);
    })
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });
  app2.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }
    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password)
    });
    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });
  app2.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        if (info && info.message) {
          return res.status(401).json({ error: info.message });
        }
        return res.status(401).json({ error: "Credenciales inv\xE1lidas" });
      }
      req.login(user, (err2) => {
        if (err2) {
          return next(err2);
        }
        res.status(200).json(user);
      });
    })(req, res, next);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
  app2.post("/api/password-reset/request", async (req, res) => {
    try {
      const result = passwordResetRequestSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: "Datos inv\xE1lidos",
          details: result.error.issues
        });
      }
      const { identifier, method } = result.data;
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
          return res.status(400).json({ error: "M\xE9todo de recuperaci\xF3n inv\xE1lido" });
      }
      if (!user) {
        const response2 = {
          message: `Token de recuperaci\xF3n enviado`,
          method,
          sentTo: method === "email" || method === "username" ? identifier : identifier,
          messagesSent: [],
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1e3).toISOString()
        };
        if (process.env.NODE_ENV === "development") {
          response2.note = "Usuario no encontrado - token no enviado (solo visible en desarrollo)";
        }
        return res.json(response2);
      }
      const resetToken = generateResetToken();
      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1e3);
      await storage.updateUserResetToken(user.username, resetToken, expiry);
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
          return res.status(400).json({ error: "El usuario no tiene n\xFAmero de tel\xE9fono registrado" });
        }
      }
      const response = {
        message: `Token de recuperaci\xF3n enviado`,
        method,
        sentTo: method === "email" || method === "username" ? user.email : user.phone,
        messagesSent,
        expiresAt: expiry.toISOString()
      };
      if (hasError) {
        console.error(`Failed to send password reset to ${method === "email" || method === "username" ? user.email : user.phone}`);
        return res.status(502).json({
          error: `No se pudo enviar el token de recuperaci\xF3n. Verifica que ${method === "email" ? "tu email est\xE9 configurado correctamente" : "tu tel\xE9fono pueda recibir SMS"}.`,
          details: "Error del proveedor de email/SMS"
        });
      }
      res.json(response);
    } catch (error) {
      console.error("Error generating reset token:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });
  app2.post("/api/password-reset/confirm", async (req, res) => {
    try {
      const result = passwordResetConfirmSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: "Datos inv\xE1lidos",
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
          return res.status(400).json({ error: "M\xE9todo de recuperaci\xF3n inv\xE1lido" });
      }
      if (!user) {
        return res.status(400).json({ error: "Token de recuperaci\xF3n inv\xE1lido o expirado" });
      }
      const hashedPassword = await hashPassword(newPassword);
      await storage.resetUserPassword(user.username, resetToken, hashedPassword);
      res.json({
        message: "Contrase\xF1a actualizada exitosamente",
        success: true
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      if (error instanceof Error && error.message.includes("Token de recuperaci\xF3n")) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Error interno del servidor" });
      }
    }
  });
}

// server/payment-config-storage.ts
init_schema();
import { eq as eq2 } from "drizzle-orm";
var PaymentConfigStorage = class {
  async getAllPaymentConfigs() {
    return await db.select().from(paymentConfig);
  }
  async getPaymentConfig(id) {
    const [config] = await db.select().from(paymentConfig).where(eq2(paymentConfig.id, id));
    return config || void 0;
  }
  async getPaymentConfigByKey(configKey) {
    const [config] = await db.select().from(paymentConfig).where(eq2(paymentConfig.configKey, configKey));
    return config || void 0;
  }
  async createPaymentConfig(insertPaymentConfig) {
    const [config] = await db.insert(paymentConfig).values(insertPaymentConfig).returning();
    return config;
  }
  async updatePaymentConfig(id, updatePaymentConfig) {
    const [config] = await db.update(paymentConfig).set({
      ...updatePaymentConfig,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq2(paymentConfig.id, id)).returning();
    return config || void 0;
  }
};
var paymentConfigStorage = new PaymentConfigStorage();

// server/verification-service.ts
init_schema();
import { eq as eq3 } from "drizzle-orm";
var VerificationService = class {
  // Generate 6-digit verification code
  generateCode() {
    return Math.floor(1e5 + Math.random() * 9e5).toString();
  }
  // Generate verification code and save to user
  async createVerificationCode(userId, action) {
    const code = this.generateCode();
    const expiryTime = new Date(Date.now() + 10 * 60 * 1e3);
    await db.update(users).set({
      verificationCode: code,
      verificationCodeExpiry: expiryTime
    }).where(eq3(users.id, userId));
    return code;
  }
  // Verify code and log the action
  async verifyCode(userId, code, action, ipAddress, userAgent) {
    const [user] = await db.select().from(users).where(eq3(users.id, userId));
    if (!user) {
      return { success: false, message: "Usuario no encontrado" };
    }
    if (!user.verificationCode || user.verificationCode !== code) {
      await db.insert(securityLogs).values({
        userId,
        action,
        method: user.twoFactorMethod || "email",
        code,
        verified: false,
        ipAddress,
        userAgent
      });
      return { success: false, message: "C\xF3digo de verificaci\xF3n incorrecto" };
    }
    if (!user.verificationCodeExpiry || /* @__PURE__ */ new Date() > user.verificationCodeExpiry) {
      return { success: false, message: "C\xF3digo de verificaci\xF3n expirado" };
    }
    await db.update(users).set({
      verificationCode: null,
      verificationCodeExpiry: null
    }).where(eq3(users.id, userId));
    await db.insert(securityLogs).values({
      userId,
      action,
      method: user.twoFactorMethod || "email",
      code,
      verified: true,
      ipAddress,
      userAgent,
      verifiedAt: /* @__PURE__ */ new Date()
    });
    return { success: true, message: "C\xF3digo verificado correctamente" };
  }
  // Send verification code via email (simulated)
  async sendEmailVerification(email, code, action) {
    try {
      console.log(`\u{1F4E7} [EMAIL VERIFICATION] To: ${email}`);
      console.log(`\u{1F510} C\xF3digo de seguridad para ${action}: ${code}`);
      console.log(`\u23F0 Este c\xF3digo expira en 10 minutos`);
      return true;
    } catch (error) {
      console.error("Error sending email verification:", error);
      return false;
    }
  }
  // Send verification code via SMS (simulated)
  async sendSMSVerification(phone, code, action) {
    try {
      console.log(`\u{1F4F1} [SMS VERIFICATION] To: ${phone}`);
      console.log(`\u{1F510} MercadoBoom - C\xF3digo de seguridad: ${code}`);
      console.log(`\u23F0 Este c\xF3digo expira en 10 minutos`);
      return true;
    } catch (error) {
      console.error("Error sending SMS verification:", error);
      return false;
    }
  }
  // Send verification code via WhatsApp (simulated)
  async sendWhatsAppVerification(phone, code, action) {
    try {
      console.log(`\u{1F4AC} [WHATSAPP VERIFICATION] To: ${phone}`);
      console.log(`\u{1F510} MercadoBoom - Tu c\xF3digo de seguridad es: ${code}`);
      console.log(`\u23F0 Este c\xF3digo es v\xE1lido por 10 minutos`);
      console.log(`\u{1F6E1}\uFE0F Acci\xF3n: ${action}`);
      return true;
    } catch (error) {
      console.error("Error sending WhatsApp verification:", error);
      return false;
    }
  }
  // Send verification code based on user's preferred method
  async sendVerificationCode(userId, action) {
    const [user] = await db.select().from(users).where(eq3(users.id, userId));
    if (!user) {
      return { success: false, message: "Usuario no encontrado" };
    }
    const code = await this.createVerificationCode(userId, action);
    const method = user.twoFactorMethod || "email";
    let emailSent = false;
    let smsSent = false;
    let whatsappSent = false;
    if (method === "email" || method === "email_sms" || method === "email_whatsapp" || method === "all") {
      emailSent = await this.sendEmailVerification(user.email, code, action);
    }
    if (method === "sms" || method === "email_sms" || method === "sms_whatsapp" || method === "all") {
      if (!user.phone) {
        return {
          success: false,
          message: "No hay n\xFAmero de tel\xE9fono registrado para verificaci\xF3n SMS"
        };
      }
      smsSent = await this.sendSMSVerification(user.phone, code, action);
    }
    if (method === "whatsapp" || method === "email_whatsapp" || method === "sms_whatsapp" || method === "all") {
      if (!user.phone) {
        return {
          success: false,
          message: "No hay n\xFAmero de tel\xE9fono registrado para verificaci\xF3n WhatsApp"
        };
      }
      whatsappSent = await this.sendWhatsAppVerification(user.phone, code, action);
    }
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
        message: `C\xF3digo de verificaci\xF3n enviado por ${methodText}`,
        method: methodText
      };
    } else {
      const failedText = failedChannels.join(" y ");
      return {
        success: false,
        message: `Error al enviar c\xF3digo por ${failedText}`
      };
    }
  }
  // Check if verification is required for a specific action
  async requiresVerification(userId, action) {
    const [user] = await db.select().from(users).where(eq3(users.id, userId));
    if (!user) {
      return false;
    }
    const highSecurityActions = ["admin_access", "large_order", "profile_change", "payment_update"];
    return user.twoFactorEnabled && highSecurityActions.includes(action);
  }
  // Update 2FA settings
  async updateTwoFactorSettings(userId, enabled, method) {
    try {
      const updateData = { twoFactorEnabled: enabled };
      if (method) {
        updateData.twoFactorMethod = method;
      }
      await db.update(users).set(updateData).where(eq3(users.id, userId));
      const statusMessage = enabled ? `Verificaci\xF3n en dos pasos activada con m\xE9todo: ${method || "email"}` : "Verificaci\xF3n en dos pasos desactivada";
      return { success: true, message: statusMessage };
    } catch (error) {
      console.error("Error updating 2FA settings:", error);
      return { success: false, message: "Error al actualizar configuraci\xF3n de seguridad" };
    }
  }
  // Verify contact method (for testing verification codes)
  async verifyContact(userId, type, code) {
    const verification = await this.verifyCode(userId, code, `verify_${type}`);
    if (verification.success) {
      const updateField = type === "email" ? "isEmailVerified" : "isPhoneVerified";
      await db.update(users).set({ [updateField]: true }).where(eq3(users.id, userId));
      return {
        success: true,
        message: `${type === "email" ? "Email" : "Tel\xE9fono"} verificado correctamente`
      };
    }
    return verification;
  }
};
var verificationService = new VerificationService();

// server/routes.ts
init_schema();

// server/payments.ts
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
var client = null;
var preferenceService = null;
var paymentService = null;
function initializeMercadoPago() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    console.warn("MercadoPago Access Token not found. Payment functionality will be limited.");
    return false;
  }
  try {
    client = new MercadoPagoConfig({
      accessToken,
      options: { timeout: 5e3, idempotencyKey: "abc" }
    });
    preferenceService = new Preference(client);
    paymentService = new Payment(client);
    console.log("MercadoPago initialized successfully");
    return true;
  } catch (error) {
    console.error("Failed to initialize MercadoPago:", error);
    return false;
  }
}
async function createPaymentPreference(product, user, quantity = 1, shippingAddress) {
  if (!preferenceService) {
    throw new Error("MercadoPago no est\xE1 configurado. Contacta al administrador.");
  }
  const totalAmount = parseFloat(product.price) * quantity;
  const orderNumber = `MB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const order = await storage.createOrder({
    userId: user.id,
    productId: product.id,
    quantity,
    totalAmount: totalAmount.toString(),
    status: "PENDIENTE",
    paymentStatus: "pending",
    shippingAddressId: shippingAddress?.id
  });
  const preferenceData = {
    items: [
      {
        id: product.id,
        title: product.name,
        description: product.description || "Producto electr\xF3nico de MercadoBoom",
        category_id: "electronics",
        quantity,
        currency_id: "MXN",
        unit_price: parseFloat(product.price),
        picture_url: product.imageUrl || void 0
      }
    ],
    payer: {
      name: user.fullName.split(" ")[0],
      surname: user.fullName.split(" ").slice(1).join(" ") || "",
      email: user.email,
      phone: user.phone ? {
        area_code: "+52",
        number: user.phone.replace(/\D/g, "")
      } : void 0,
      identification: {
        type: "RFC",
        number: "XAXX010101000"
        // Default RFC for Mexico
      },
      address: shippingAddress ? {
        street_name: shippingAddress.street,
        street_number: "S/N",
        zip_code: shippingAddress.postalCode,
        federal_unit: shippingAddress.state,
        city_name: shippingAddress.city,
        neighborhood: "Centro"
      } : void 0
    },
    back_urls: {
      success: `https://shop.mercadoboom.com/payment/success?order=${order.id}`,
      failure: `https://shop.mercadoboom.com/payment/failure?order=${order.id}`,
      pending: `https://shop.mercadoboom.com/payment/pending?order=${order.id}`
    },
    auto_return: "approved",
    payment_methods: {
      excluded_payment_methods: [],
      excluded_payment_types: [],
      installments: 12
    },
    notification_url: `https://shop.mercadoboom.com/api/payments/webhook`,
    statement_descriptor: "MERCADOBOOM",
    external_reference: order.id,
    expires: true,
    expiration_date_from: (/* @__PURE__ */ new Date()).toISOString(),
    expiration_date_to: new Date(Date.now() + 30 * 60 * 1e3).toISOString(),
    // 30 minutes
    metadata: {
      order_id: order.id,
      order_number: orderNumber,
      user_id: user.id,
      product_id: product.id,
      quantity: quantity.toString(),
      store: "MercadoBoom"
    }
  };
  try {
    const preference = await preferenceService.create({ body: preferenceData });
    if (preference.id) {
      await storage.updateOrderPaymentInfo(order.id, {
        preferenceId: preference.id
      });
    }
    return {
      preferenceId: preference.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point,
      orderId: order.id,
      orderNumber,
      amount: totalAmount
    };
  } catch (error) {
    console.error("Error creating MercadoPago preference:", error);
    throw new Error("Error al crear la preferencia de pago. Int\xE9ntalo de nuevo.");
  }
}
async function processPaymentWebhook(webhookData) {
  if (!paymentService) {
    console.error("MercadoPago not initialized for webhook processing");
    return false;
  }
  try {
    const paymentId = webhookData.data?.id;
    if (!paymentId || webhookData.type !== "payment") {
      console.log("Webhook ignored - not a payment notification");
      return false;
    }
    const payment = await paymentService.get({ id: paymentId });
    if (!payment || !payment.external_reference) {
      console.error("Payment not found or missing external reference");
      return false;
    }
    const orderId = payment.external_reference;
    const order = await storage.getOrder(orderId);
    if (!order) {
      console.error(`Order not found: ${orderId}`);
      return false;
    }
    let newStatus = order.status;
    let paymentStatus = "pending";
    switch (payment.status) {
      case "approved":
        newStatus = "PAGADO";
        paymentStatus = "approved";
        break;
      case "rejected":
        paymentStatus = "rejected";
        break;
      case "cancelled":
        paymentStatus = "cancelled";
        break;
      case "refunded":
        paymentStatus = "refunded";
        break;
      case "pending":
        paymentStatus = "pending";
        break;
      default:
        paymentStatus = "pending";
    }
    await storage.updateOrderPaymentInfo(orderId, {
      paymentId,
      paymentStatus,
      paymentMethod: payment.payment_method_id || void 0
    });
    if (newStatus !== order.status) {
      await storage.updateOrderStatus(orderId, newStatus);
    }
    console.log(`Payment processed for order ${orderId}: ${payment.status}`);
    return true;
  } catch (error) {
    console.error("Error processing payment webhook:", error);
    return false;
  }
}
function getMercadoPagoPublicKey() {
  return process.env.MERCADOPAGO_PUBLIC_KEY || "";
}
initializeMercadoPago();

// server/objectStorage.ts
import { Storage } from "@google-cloud/storage";
import { randomUUID } from "crypto";
var REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
var objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token"
      }
    },
    universe_domain: "googleapis.com"
  },
  projectId: ""
});
var ObjectNotFoundError = class _ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, _ObjectNotFoundError.prototype);
  }
};
var ObjectStorageService = class {
  constructor() {
  }
  // Gets the public object search paths.
  getPublicObjectSearchPaths() {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    const paths = Array.from(
      new Set(
        pathsStr.split(",").map((path3) => path3.trim()).filter((path3) => path3.length > 0)
      )
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths)."
      );
    }
    return paths;
  }
  // Gets the private object directory.
  getPrivateObjectDir() {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }
  // Search for a public object from the search paths.
  async searchPublicObject(filePath) {
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const fullPath = `${searchPath}/${filePath}`;
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      const [exists] = await file.exists();
      if (exists) {
        return file;
      }
    }
    return null;
  }
  // Downloads an object to the response.
  async downloadObject(file, res, cacheTtlSec = 3600) {
    try {
      const [metadata] = await file.getMetadata();
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": `public, max-age=${cacheTtlSec}`
      });
      const stream = file.createReadStream();
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });
      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }
  // Gets the upload URL for an object entity.
  async getObjectEntityUploadURL() {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    return signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900
    });
  }
  // Gets the object entity file from the object path.
  async getObjectEntityFile(objectPath) {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }
    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }
    const entityId = parts.slice(1).join("/");
    let entityDir = this.getPrivateObjectDir();
    if (!entityDir.endsWith("/")) {
      entityDir = `${entityDir}/`;
    }
    const objectEntityPath = `${entityDir}${entityId}`;
    const { bucketName, objectName } = parseObjectPath(objectEntityPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const objectFile = bucket.file(objectName);
    const [exists] = await objectFile.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    return objectFile;
  }
  normalizeObjectEntityPath(rawPath) {
    console.log("Normalizing path:", rawPath);
    if (!rawPath.startsWith("https://storage.googleapis.com/")) {
      console.log("Path doesn't start with googleapis, returning as-is");
      return rawPath;
    }
    const url = new URL(rawPath);
    const rawObjectPath = url.pathname;
    console.log("Extracted pathname:", rawObjectPath);
    const objectEntityDir = this.getPrivateObjectDir();
    console.log("Private object dir:", objectEntityDir);
    const pathParts = rawObjectPath.split("/").filter((p) => p);
    if (pathParts.length < 2) {
      console.log("Path parts too short:", pathParts);
      return rawObjectPath;
    }
    const objectPath = pathParts.slice(1).join("/");
    console.log("Object path:", objectPath);
    if (objectPath.startsWith(".private/")) {
      const entityId = objectPath.slice(".private/".length);
      const normalized = `/objects/${entityId}`;
      console.log("Normalized to:", normalized);
      return normalized;
    }
    console.log("Path doesn't start with .private/, returning:", rawObjectPath);
    return rawObjectPath;
  }
  // Tries to set the ACL policy for the object entity and return the normalized path.
  async trySetObjectEntityPath(rawPath) {
    return this.normalizeObjectEntityPath(rawPath);
  }
};
function parseObjectPath(path3) {
  if (!path3.startsWith("/")) {
    path3 = `/${path3}`;
  }
  const pathParts = path3.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }
  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");
  return {
    bucketName,
    objectName
  };
}
async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec
}) {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1e3).toISOString()
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request)
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, make sure you're running on Replit`
    );
  }
  const { signed_url: signedURL } = await response.json();
  return signedURL;
}

// server/routes.ts
async function registerRoutes(app2) {
  setupAuth(app2);
  app2.get("/api/categories", async (req, res) => {
    try {
      const categories2 = await storage.getAllCategories();
      res.json(categories2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });
  app2.get("/api/banners", async (req, res) => {
    try {
      const banners2 = await storage.getActiveBanners();
      res.json(banners2);
    } catch (error) {
      console.error("Error fetching banners:", error);
      res.status(500).json({ message: "Failed to fetch banners" });
    }
  });
  app2.get("/api/special-offers", async (req, res) => {
    try {
      const offers = await storage.getActiveSpecialOffers();
      res.json(offers);
    } catch (error) {
      console.error("Error fetching special offers:", error);
      res.status(500).json({ message: "Failed to fetch special offers" });
    }
  });
  app2.get("/api/products", async (req, res) => {
    try {
      const { featured, category } = req.query;
      let products2;
      if (featured === "true") {
        products2 = await storage.getFeaturedProducts();
      } else if (category) {
        products2 = await storage.getProductsByCategory(category);
      } else {
        products2 = await storage.getAllProducts();
      }
      res.json(products2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });
  app2.get("/api/products/:id", async (req, res) => {
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
  app2.post("/api/admin/products", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const result = insertProductSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid product data" });
      }
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
  app2.patch("/api/admin/products/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
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
  app2.delete("/api/admin/products/:id", async (req, res) => {
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
  app2.patch("/api/user/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    try {
      const { fullName, email, username, phone } = req.body;
      const profileData = { fullName, email, username, phone };
      const cleanedProfileData = Object.fromEntries(
        Object.entries(profileData).filter(([, value]) => value !== void 0)
      );
      const updatedUser = await storage.updateUserProfile(req.user.id, cleanedProfileData);
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
  app2.get("/api/addresses", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    try {
      const addresses2 = await storage.getUserAddresses(req.user.id);
      res.json(addresses2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch addresses" });
    }
  });
  app2.post("/api/addresses", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    try {
      const result = insertAddressSchema.safeParse({
        ...req.body,
        userId: req.user.id
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
  app2.patch("/api/addresses/:id", async (req, res) => {
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
  app2.delete("/api/addresses/:id", async (req, res) => {
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
  app2.post("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    try {
      const result = insertOrderSchema.safeParse({
        ...req.body,
        userId: req.user.id
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
  app2.get("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    try {
      const orders2 = await storage.getUserOrders(req.user.id);
      res.json(orders2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });
  app2.get("/api/orders/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order || order.userId !== req.user.id) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });
  app2.post("/api/security/send-code", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }
    try {
      const { action } = req.body;
      if (!action) {
        return res.status(400).json({ message: "Acci\xF3n requerida" });
      }
      const result = await verificationService.sendVerificationCode(req.user.id, action);
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
  app2.post("/api/security/verify-code", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }
    try {
      const { code, action } = req.body;
      if (!code || !action) {
        return res.status(400).json({ message: "C\xF3digo y acci\xF3n requeridos" });
      }
      const clientIP = req.ip || req.connection.remoteAddress;
      const userAgent = req.get("User-Agent");
      const result = await verificationService.verifyCode(
        req.user.id,
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
  app2.post("/api/security/update-2fa", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }
    try {
      const { enabled, method } = req.body;
      if (typeof enabled !== "boolean") {
        return res.status(400).json({ message: "Estado de activaci\xF3n requerido" });
      }
      const result = await verificationService.updateTwoFactorSettings(
        req.user.id,
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
  app2.post("/api/security/check-required", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }
    try {
      const { action } = req.body;
      if (!action) {
        return res.status(400).json({ message: "Acci\xF3n requerida" });
      }
      const required = await verificationService.requiresVerification(req.user.id, action);
      res.json({ required });
    } catch (error) {
      console.error("Error checking verification requirement:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  app2.get("/public-objects/:filePath(*)", async (req, res) => {
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
  app2.post("/api/objects/upload", async (req, res) => {
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
  app2.post("/api/objects/normalize", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }
    try {
      const { path: path3 } = req.body;
      console.log("Normalize request received for path:", path3);
      if (!path3) {
        return res.status(400).json({ error: "Path is required" });
      }
      const objectStorageService = new ObjectStorageService();
      const normalizedPath = await objectStorageService.trySetObjectEntityPath(path3);
      console.log("Normalized path:", normalizedPath);
      return res.json({ path: normalizedPath });
    } catch (error) {
      console.error("Error normalizing path:", error);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  });
  app2.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path
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
  app2.get("/api/banners", async (req, res) => {
    try {
      const banners2 = await storage.getActiveBanners();
      res.json(banners2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch banners" });
    }
  });
  app2.get("/api/admin/banners", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const banners2 = await storage.getAllBanners();
      res.json(banners2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch banners" });
    }
  });
  app2.post("/api/admin/banners", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const result = insertBannerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid banner data", details: result.error.issues });
      }
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
  app2.put("/api/admin/banners/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const result = updateBannerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid banner data", details: result.error.issues });
      }
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
  app2.delete("/api/admin/banners/:id", async (req, res) => {
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
  app2.get("/api/special-offers", async (req, res) => {
    try {
      const offers = await storage.getActiveSpecialOffers();
      res.json(offers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch special offers" });
    }
  });
  app2.get("/api/admin/special-offers", async (req, res) => {
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
  app2.post("/api/admin/special-offers", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const result = insertSpecialOfferSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid offer data", details: result.error.issues });
      }
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
  app2.put("/api/admin/special-offers/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const result = updateSpecialOfferSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid offer data", details: result.error.issues });
      }
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
  app2.delete("/api/admin/special-offers/:id", async (req, res) => {
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
  app2.get("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const users2 = await storage.getAllUsers();
      res.json(users2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });
  app2.put("/api/admin/users/:userId/password", async (req, res) => {
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
  app2.post("/api/admin/users/:userId/block", async (req, res) => {
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
  app2.post("/api/admin/users/:userId/unblock", async (req, res) => {
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
  app2.get("/api/admin/orders", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const orders2 = await storage.getAllOrders();
      res.json(orders2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });
  app2.patch("/api/admin/orders/:id/status", async (req, res) => {
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
  app2.get("/api/admin/stats", async (req, res) => {
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
  app2.post("/api/payments/create-direct-transfer", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }
      const validatedData = createDirectTransferOrderSchema.parse(req.body);
      const product = await storage.getProduct(validatedData.productId);
      if (!product) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }
      const shippingAddress = validatedData.shippingAddressId ? await storage.getAddress(validatedData.shippingAddressId) : void 0;
      const orderNumber = `MB-TF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const order = await storage.createOrder({
        userId: req.user.id,
        productId: product.id,
        quantity: validatedData.quantity,
        totalAmount: (parseFloat(validatedData.originalAmount) - parseFloat(validatedData.discountApplied) + 99).toString(),
        // Including shipping
        status: "PENDIENTE",
        paymentStatus: "pending",
        paymentType: "direct_transfer",
        originalAmount: validatedData.originalAmount,
        discountApplied: validatedData.discountApplied,
        shippingAddressId: shippingAddress?.id,
        orderNumber
      });
      res.json({
        success: true,
        order,
        bankDetails: {
          bankName: "BBVA M\xE9xico",
          clabe: "012180004799747847",
          accountHolder: "MercadoBoom SA de CV",
          reference: orderNumber,
          amount: order.totalAmount,
          instructions: [
            "Realiza la transferencia usando la CLABE interbancaria",
            "Usa como referencia el n\xFAmero de pedido: " + orderNumber,
            "Env\xEDa comprobante por WhatsApp: +52 55 1256 2704",
            "O por email: ventas@mercadoboom.com",
            "El pedido se procesa al confirmar el pago (24-48 hrs)"
          ]
        }
      });
    } catch (error) {
      console.error("Error creating direct transfer order:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Datos inv\xE1lidos", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Error interno del servidor" });
    }
  });
  app2.post("/api/payments/create-preference", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }
      const validatedData = createPaymentPreferenceSchema.parse(req.body);
      const product = await storage.getProduct(validatedData.productId);
      if (!product) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }
      const shippingAddress = validatedData.shippingAddressId ? await storage.getAddress(validatedData.shippingAddressId) : void 0;
      const paymentData = await createPaymentPreference(
        product,
        req.user,
        validatedData.quantity,
        shippingAddress
      );
      res.json(paymentData);
    } catch (error) {
      console.error("Error creating payment preference:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Datos inv\xE1lidos", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Error interno del servidor" });
    }
  });
  app2.post("/api/payments/webhook", async (req, res) => {
    try {
      console.log("MercadoPago webhook received:", req.body);
      const success = await processPaymentWebhook(req.body);
      if (success) {
        res.status(200).json({ status: "processed" });
      } else {
        res.status(400).json({ status: "ignored" });
      }
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(500).json({ error: "Error procesando webhook" });
    }
  });
  app2.get("/api/payments/config", async (req, res) => {
    try {
      const allPaymentConfigs = await paymentConfigStorage.getAllPaymentConfigs();
      const paymentConfigs = allPaymentConfigs.filter((config) => config.isActive);
      const activePaymentMethods = {
        mercadopago: false,
        bank_transfer: false,
        conekta: false
      };
      paymentConfigs.forEach((config) => {
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
        env: process.env.NODE_ENV || "development",
        activePaymentMethods
      });
    } catch (error) {
      console.error("Error fetching payment config:", error);
      res.json({
        publicKey: getMercadoPagoPublicKey(),
        env: process.env.NODE_ENV || "development",
        activePaymentMethods: {
          mercadopago: true,
          // fallback to true if config can't be read
          bank_transfer: true,
          conekta: false
        }
      });
    }
  });
  app2.get("/payment/success", async (req, res) => {
    const orderId = req.query.order;
    if (orderId) {
      await storage.updateOrderStatus(orderId, "PAGADO");
    }
    res.redirect(`/user-dashboard?payment=success&order=${orderId}`);
  });
  app2.get("/payment/failure", (req, res) => {
    const orderId = req.query.order;
    res.redirect(`/user-dashboard?payment=failure&order=${orderId}`);
  });
  app2.get("/payment/pending", (req, res) => {
    const orderId = req.query.order;
    res.redirect(`/user-dashboard?payment=pending&order=${orderId}`);
  });
  app2.post("/api/admin/verify-transfer", async (req, res) => {
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
        transferVerifiedAt: validatedData.verified ? /* @__PURE__ */ new Date() : null,
        transferVerifiedBy: req.user.id,
        transferNotes: validatedData.notes
      });
      if (validatedData.verified && updatedOrder) {
        await storage.updateOrderStatus(validatedData.orderId, "PAGADO");
      }
      res.json({ success: true, order: updatedOrder });
    } catch (error) {
      console.error("Error verifying transfer:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Datos inv\xE1lidos", details: error.errors });
      }
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });
  app2.post("/api/upload-receipt", async (req, res) => {
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
        paymentStatus: "pending_verification"
      });
      res.json({ success: true, order: updatedOrder });
    } catch (error) {
      console.error("Error uploading receipt:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Datos inv\xE1lidos", details: error.errors });
      }
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });
  app2.get("/api/admin/pending-transfers", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const orders2 = await storage.getAllOrders();
      const pendingTransfers = orders2.filter(
        (order) => order.paymentType === "direct_transfer" && ["pending", "pending_verification"].includes(order.paymentStatus || "")
      );
      res.json(pendingTransfers);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener transferencias pendientes" });
    }
  });
  app2.get("/api/admin/payment-config", async (req, res) => {
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
  app2.post("/api/admin/payment-config", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const validatedData = insertPaymentConfigSchema.parse(req.body);
      const config = await paymentConfigStorage.createPaymentConfig(validatedData);
      res.json({ success: true, config });
    } catch (error) {
      console.error("Error creating payment config:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Datos inv\xE1lidos", details: error.errors });
      }
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });
  app2.patch("/api/admin/payment-config/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const { id } = req.params;
      const validatedData = updatePaymentConfigSchema.parse({ ...req.body, id });
      const config = await paymentConfigStorage.updatePaymentConfig(id, validatedData);
      if (!config) {
        return res.status(404).json({ error: "Configuraci\xF3n no encontrada" });
      }
      res.json({ success: true, config });
    } catch (error) {
      console.error("Error updating payment config:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Datos inv\xE1lidos", details: error.errors });
      }
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });
  app2.post("/api/support/tickets", async (req, res) => {
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
        email: result.data.email || req.user?.email || "",
        name: result.data.name || req.user?.fullName || req.user?.username || "",
        // Convert empty string to null for optional foreign keys
        orderId: result.data.orderId && result.data.orderId.trim() !== "" ? result.data.orderId : null
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
  app2.get("/api/support/tickets", async (req, res) => {
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
  app2.get("/api/support/tickets/:id", async (req, res) => {
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
  app2.post("/api/support/tickets/:id/messages", async (req, res) => {
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
        senderEmail: req.user?.email || req.body.senderEmail
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
  app2.patch("/api/admin/support/tickets/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const result = updateTicketStatusSchema.safeParse({
        ...req.body,
        ticketId: req.params.id
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
  app2.get("/api/admin/support/stats", async (req, res) => {
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
  app2.get("/api/admin/transfer-discount-config", async (req, res) => {
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
  app2.put("/api/admin/transfer-discount-config", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const { insertTransferDiscountConfigSchema: insertTransferDiscountConfigSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const result = insertTransferDiscountConfigSchema2.safeParse({
        ...req.body,
        updatedBy: req.user.id
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
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
