import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
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
  twoFactorMethod: text("two_factor_method"), // "email", "sms", "whatsapp", "email_sms", "email_whatsapp", "sms_whatsapp", "all"
  verificationCode: text("verification_code"),
  verificationCodeExpiry: timestamp("verification_code_expiry"),
  isPhoneVerified: boolean("is_phone_verified").default(false),
  isEmailVerified: boolean("is_email_verified").default(false),
  // User blocking fields
  isBlocked: boolean("is_blocked").default(false),
  blockReason: text("block_reason"),
  blockedAt: timestamp("blocked_at"),
  blockedBy: varchar("blocked_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Security verification logs
export const securityLogs = pgTable("security_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  action: text("action").notNull(), // "login", "order", "profile_change", "admin_access"
  method: text("method").notNull(), // "sms", "email"
  code: text("code").notNull(),
  verified: boolean("verified").default(false),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
  verifiedAt: timestamp("verified_at"),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  emoji: text("emoji"),
  isActive: boolean("is_active").default(true),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  categoryId: varchar("category_id").references(() => categories.id),
  imageUrl: text("image_url"),
  images: text("images").array(), // Array of additional product images
  stock: integer("stock").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0),
  promotionType: text("promotion_type"), // "BOOM", "OFERTA", "RELAMPAGO", "NUEVO"
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  isAffiliate: boolean("is_affiliate").default(false),
  affiliateUrl: text("affiliate_url"), // URL externa para productos afiliados
  affiliateStore: text("affiliate_store"), // Nombre de la tienda afiliada (ej: "Amazon", "MercadoLibre")
  // Shipping settings
  shippingMethod: text("shipping_method").default("Envío Estándar"),
  deliveryTime: text("delivery_time").default("3-5 días hábiles"),
  freeShipping: boolean("free_shipping").default(false),
  freeShippingMinAmount: decimal("free_shipping_min_amount", { precision: 10, scale: 2 }).default("999"),
  // Transfer discount settings
  allowTransferDiscount: boolean("allow_transfer_discount").default(true),
  transferDiscountPercent: decimal("transfer_discount_percent", { precision: 5, scale: 2 }).default("3.50"),
  // Import product settings
  isImported: boolean("is_imported").default(false),
  importDeliveryDays: integer("import_delivery_days").default(15),
  importDescription: text("import_description").default("Producto de importación"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const addresses = pgTable("addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  street: text("street").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postalCode: text("postal_code").notNull(),
  country: text("country").default("México"),
  isDefault: boolean("is_default").default(false),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  productId: varchar("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").default(1),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("PENDIENTE"), // PENDIENTE, PAGADO, EN_PREPARACION, RECOGIDO, ENVIADO, EN_RUTA, ENTREGADO
  paymentStatus: text("payment_status").default("pending"), // pending, approved, rejected, cancelled, verified
  paymentId: text("payment_id"), // MercadoPago payment ID
  preferenceId: text("preference_id"), // MercadoPago preference ID
  paymentMethod: text("payment_method"), // credit_card, debit_card, bank_transfer, direct_transfer, etc.
  paymentType: text("payment_type").default("mercadopago"), // mercadopago, direct_transfer
  discountApplied: decimal("discount_applied", { precision: 10, scale: 2 }).default("0"),
  originalAmount: decimal("original_amount", { precision: 10, scale: 2 }),
  // Transfer verification fields
  transferReceiptUrl: text("transfer_receipt_url"), // URL of uploaded receipt
  transferVerifiedAt: timestamp("transfer_verified_at"),
  transferVerifiedBy: varchar("transfer_verified_by").references(() => users.id),
  transferNotes: text("transfer_notes"), // Admin notes about the transfer
  shippingAddressId: varchar("shipping_address_id").references(() => addresses.id),
  trackingNumber: text("tracking_number"),
  courierService: text("courier_service"), // DHL, FedEx, Estafeta, etc.
  estimatedDelivery: timestamp("estimated_delivery"),
  actualDelivery: timestamp("actual_delivery"),
  statusHistory: jsonb("status_history").default([]), // Array of status changes with timestamps
  orderNumber: text("order_number").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  fullName: true,
  phone: true,
});

export const insertSecurityLogSchema = createInsertSchema(securityLogs).omit({
  id: true,
  createdAt: true,
  verifiedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
}).extend({
  images: z.array(z.string()).optional().default([]),
  allowTransferDiscount: z.boolean().default(true),
  transferDiscountPercent: z.string().default("3.50"),
  isImported: z.boolean().default(false),
  importDeliveryDays: z.number().default(15),
  importDescription: z.string().default("Producto de importación"),
});

export const insertAddressSchema = createInsertSchema(addresses).omit({
  id: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  orderNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["PENDIENTE", "PAGADO", "EN_PREPARACION", "RECOGIDO", "ENVIADO", "EN_RUTA", "ENTREGADO"]),
});

export const verifyTransferSchema = z.object({
  orderId: z.string().min(1, "ID del pedido requerido"),
  verified: z.boolean(),
  notes: z.string().optional(),
});

export const uploadReceiptSchema = z.object({
  orderId: z.string().min(1, "ID del pedido requerido"),
  receiptUrl: z.string().url("URL del comprobante inválida"),
});

// Payment configuration schemas
export const paymentConfig = pgTable("payment_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  configKey: text("config_key").notNull().unique(), // mercadopago, bank_transfer, conekta
  isActive: boolean("is_active").default(true),
  displayName: text("display_name").notNull(),
  config: text("config").notNull(), // Store configuration as JSON string
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type PaymentConfig = typeof paymentConfig.$inferSelect;
export type InsertPaymentConfig = typeof paymentConfig.$inferInsert;

export const insertPaymentConfigSchema = createInsertSchema(paymentConfig, {
  config: z.string().min(1, "Configuración requerida"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updatePaymentConfigSchema = z.object({
  id: z.string(),
  isActive: z.boolean().optional(),
  displayName: z.string().optional(),
  config: z.string().optional(),
});

export const createPaymentPreferenceSchema = z.object({
  productId: z.string().min(1, "El producto es requerido"),
  quantity: z.number().min(1, "La cantidad debe ser mayor a 0"),
  shippingAddressId: z.string().optional(),
  paymentType: z.enum(["mercadopago", "direct_transfer"]).default("mercadopago"),
});

// Schema for direct transfer order creation
export const createDirectTransferOrderSchema = z.object({
  productId: z.string().min(1, "El producto es requerido"),
  quantity: z.number().min(1, "La cantidad debe ser mayor a 0"),
  shippingAddressId: z.string().optional(),
  originalAmount: z.string().min(1, "El monto original es requerido"),
  discountApplied: z.string().min(1, "El descuento aplicado es requerido"),
});

export const paymentWebhookSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    id: z.string(),
  }),
});

export const resetPasswordSchema = z.object({
  username: z.string().min(1, "El nombre de usuario es requerido"),
  newPassword: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  resetToken: z.string().min(1, "El token de recuperación es requerido"),
});

export const generateResetTokenSchema = z.object({
  username: z.string().min(1, "El nombre de usuario es requerido"),
});

export const supportTickets = pgTable("support_tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketNumber: text("ticket_number").notNull().unique(),
  userId: varchar("user_id").references(() => users.id),
  email: text("email").notNull(), // Para usuarios no registrados
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // "PEDIDO", "PAGO", "TECNICO", "DEVOLUCION", "OTRO"
  priority: text("priority").notNull().default("MEDIO"), // "BAJO", "MEDIO", "ALTO", "URGENTE"
  status: text("status").notNull().default("ABIERTO"), // "ABIERTO", "EN_PROCESO", "ESPERANDO_CLIENTE", "RESUELTO", "CERRADO"
  orderId: varchar("order_id").references(() => orders.id), // Opcional, si está relacionado con un pedido
  attachments: jsonb("attachments").default([]), // Array de URLs de archivos adjuntos
  assignedTo: varchar("assigned_to").references(() => users.id), // Admin asignado
  adminNotes: text("admin_notes"), // Notas internas del admin
  resolution: text("resolution"), // Descripción de la resolución
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const ticketMessages = pgTable("ticket_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").references(() => supportTickets.id, { onDelete: "cascade" }).notNull(),
  senderId: varchar("sender_id").references(() => users.id),
  senderType: text("sender_type").notNull(), // "CLIENTE", "ADMIN"
  senderName: text("sender_name").notNull(),
  senderEmail: text("sender_email").notNull(),
  message: text("message").notNull(),
  attachments: jsonb("attachments").default([]),
  isInternal: boolean("is_internal").default(false), // Solo visible para admins
  createdAt: timestamp("created_at").defaultNow(),
});


export const insertSupportTicketSchema = createInsertSchema(supportTickets, {
  subject: z.string().min(1, "El asunto es requerido"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  email: z.string().email("Email inválido").optional(),
  name: z.string().min(1, "El nombre es requerido").optional(),
  category: z.enum(["PEDIDO", "PAGO", "TECNICO", "DEVOLUCION", "OTRO"]),
  priority: z.enum(["BAJO", "MEDIO", "ALTO", "URGENTE"]).optional(),
}).omit({
  id: true,
  ticketNumber: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
});

export const insertTicketMessageSchema = createInsertSchema(ticketMessages, {
  message: z.string().min(1, "El mensaje es requerido"),
  senderName: z.string().min(1, "El nombre es requerido"),
  senderEmail: z.string().email("Email inválido"),
  senderType: z.enum(["CLIENTE", "ADMIN"]),
}).omit({
  id: true,
  createdAt: true,
});

export const updateTicketStatusSchema = z.object({
  ticketId: z.string().min(1, "ID del ticket requerido"),
  status: z.enum(["ABIERTO", "EN_PROCESO", "ESPERANDO_CLIENTE", "RESUELTO", "CERRADO"]),
  assignedTo: z.string().optional(),
  adminNotes: z.string().optional(),
  resolution: z.string().optional(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Address = typeof addresses.$inferSelect;
export type InsertAddress = z.infer<typeof insertAddressSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderWithDetails = Order & {
  product: Product;
  shippingAddress?: Address;
  user: Pick<User, 'id' | 'username' | 'email' | 'fullName'>;
};

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type TicketMessage = typeof ticketMessages.$inferSelect;
export type InsertTicketMessage = z.infer<typeof insertTicketMessageSchema>;

// Transfer discount configuration table
export const transferDiscountConfig = pgTable("transfer_discount_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).notNull().default("3.50"),
  discountText: text("discount_text").notNull().default("por evitar comisiones"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id)
});

export type TransferDiscountConfig = typeof transferDiscountConfig.$inferSelect;
export const insertTransferDiscountConfigSchema = createInsertSchema(transferDiscountConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertTransferDiscountConfig = z.infer<typeof insertTransferDiscountConfigSchema>;

// Banner management tables
export const banners = pgTable("banners", {
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
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const specialOffers = pgTable("special_offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 200 }).notNull(),
  description: varchar("description", { length: 500 }),
  discountPercentage: integer("discount_percentage"),
  originalPrice: varchar("original_price", { length: 50 }),
  offerPrice: varchar("offer_price", { length: 50 }),
  imageUrl: varchar("image_url", { length: 500 }),
  productId: varchar("product_id"),
  offerType: varchar("offer_type", { length: 50 }).default("BOOM"), // BOOM, OFERTA, RELAMPAGO, ESPECIAL
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Zod schemas for banner management
export const insertBannerSchema = createInsertSchema(banners).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSpecialOfferSchema = createInsertSchema(specialOffers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateBannerSchema = insertBannerSchema.partial();
export const updateSpecialOfferSchema = insertSpecialOfferSchema.partial();

export type Banner = typeof banners.$inferSelect;
export type InsertBanner = z.infer<typeof insertBannerSchema>;
export type UpdateBanner = z.infer<typeof updateBannerSchema>;

export type SpecialOffer = typeof specialOffers.$inferSelect;
export type InsertSpecialOffer = z.infer<typeof insertSpecialOfferSchema>;
export type UpdateSpecialOffer = z.infer<typeof updateSpecialOfferSchema>;

// Password recovery schemas
export const passwordResetRequestSchema = z.object({
  identifier: z.string().min(1, "Campo requerido"),
  method: z.enum(["username", "email", "phone"], {
    errorMap: () => ({ message: "Método de recuperación inválido" })
  }),
});

export const passwordResetConfirmSchema = z.object({
  identifier: z.string().min(1, "Campo requerido"),
  resetToken: z.string().min(1, "Token de recuperación requerido"),
  newPassword: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  method: z.enum(["username", "email", "phone"], {
    errorMap: () => ({ message: "Método de recuperación inválido" })
  }),
});

export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetConfirm = z.infer<typeof passwordResetConfirmSchema>;
