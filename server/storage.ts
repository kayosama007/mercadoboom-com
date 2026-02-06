import { randomUUID } from "crypto";
import session from "express-session";
import createMemoryStore from "memorystore";
import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "./db";
import {
  type User,
  type InsertUser,
  type Category,
  type InsertCategory,
  type Product,
  type InsertProduct,
  type Address,
  type InsertAddress,
  type Order,
  type InsertOrder,
  type OrderWithDetails,
  type SupportTicket,
  type InsertSupportTicket,
  type TicketMessage,
  type InsertTicketMessage,
  type Banner,
  type InsertBanner,
  type UpdateBanner,
  type SpecialOffer,
  type InsertSpecialOffer,
  type UpdateSpecialOffer,
  transferDiscountConfig,
  type TransferDiscountConfig,
  type InsertTransferDiscountConfig,
  users,
  categories,
  products,
  addresses,
  orders,
  supportTickets,
  ticketMessages,
  banners,
  specialOffers,
} from "@shared/schema";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserResetToken(username: string, resetToken: string, expiry: Date): Promise<User | undefined>;
  resetUserPassword(username: string, resetToken: string, newHashedPassword: string): Promise<User>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<boolean>;
  updateUserProfile(id: string, profile: Partial<Pick<User, 'fullName' | 'email' | 'username' | 'phone'>>): Promise<User | undefined>;
  blockUser(userId: string, reason: string, blockedBy: string): Promise<boolean>;
  unblockUser(userId: string): Promise<boolean>;

  // Category management
  getAllCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Product management
  getAllProducts(): Promise<Product[]>;
  getFeaturedProducts(): Promise<Product[]>;
  getProductsByCategory(categoryId: string): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;

  // Address management
  getUserAddresses(userId: string): Promise<Address[]>;
  createAddress(address: InsertAddress): Promise<Address>;
  updateAddress(id: string, address: Partial<InsertAddress>): Promise<Address | undefined>;
  deleteAddress(id: string): Promise<boolean>;
  getAddress(id: string): Promise<Address | undefined>;

  // Order management
  createOrder(order: InsertOrder): Promise<Order>;
  getUserOrders(userId: string): Promise<OrderWithDetails[]>;
  getAllOrders(): Promise<OrderWithDetails[]>;
  getOrder(id: string): Promise<OrderWithDetails | undefined>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  updateOrderPaymentInfo(id: string, paymentInfo: Partial<Pick<Order, 'paymentId' | 'preferenceId' | 'paymentStatus' | 'paymentMethod'>>): Promise<Order | undefined>;

  // Admin stats
  getAdminStats(): Promise<{
    activeUsers: number;
    totalSales: string;
    totalOrders: number;
    conversionRate: string;
  }>;

  // Support ticket management
  createSupportTicket(ticket: InsertSupportTicket & { ticketNumber: string }): Promise<SupportTicket>;
  getAllSupportTickets(): Promise<SupportTicket[]>;
  getUserSupportTickets(userId: string): Promise<SupportTicket[]>;
  getSupportTicket(id: string): Promise<SupportTicket | undefined>;
  updateSupportTicket(data: { ticketId: string; status?: string; assignedTo?: string; adminNotes?: string; resolution?: string }): Promise<SupportTicket | undefined>;
  createTicketMessage(message: InsertTicketMessage): Promise<TicketMessage>;
  getTicketMessages(ticketId: string): Promise<TicketMessage[]>;
  getSupportTicketStats(): Promise<{
    totalTickets: number;
    openTickets: number;
    inProgressTickets: number;
    resolvedTickets: number;
    avgResponseTime: string;
  }>;

  sessionStore: session.Store;

  // Banner management
  getAllBanners(): Promise<Banner[]>;
  getActiveBanners(): Promise<Banner[]>;
  getBanner(id: string): Promise<Banner | undefined>;
  createBanner(banner: InsertBanner): Promise<Banner>;
  updateBanner(id: string, banner: UpdateBanner): Promise<Banner | undefined>;
  deleteBanner(id: string): Promise<boolean>;

  // Special offers management
  getAllSpecialOffers(): Promise<SpecialOffer[]>;
  getActiveSpecialOffers(): Promise<SpecialOffer[]>;
  getSpecialOffer(id: string): Promise<SpecialOffer | undefined>;
  createSpecialOffer(offer: InsertSpecialOffer): Promise<SpecialOffer>;
  updateSpecialOffer(id: string, offer: UpdateSpecialOffer): Promise<SpecialOffer | undefined>;
  deleteSpecialOffer(id: string): Promise<boolean>;

  // Transfer discount configuration
  getTransferDiscountConfig(): Promise<TransferDiscountConfig | undefined>;
  updateTransferDiscountConfig(config: InsertTransferDiscountConfig): Promise<TransferDiscountConfig>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private categories: Map<string, Category> = new Map();
  private products: Map<string, Product> = new Map();
  private addresses: Map<string, Address> = new Map();
  private orders: Map<string, Order> = new Map();
  private supportTickets: Map<string, SupportTicket> = new Map();
  private ticketMessages: Map<string, TicketMessage[]> = new Map();
  private banners: Map<string, Banner> = new Map();
  private specialOffers: Map<string, SpecialOffer> = new Map();
  private transferDiscountConfig: TransferDiscountConfig | undefined;
  public sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    this.initializeData();
  }

  private fixProductData() {
    // Fix all products to have required fields
    this.products.forEach((product, id) => {
      const updatedProduct: Product = {
        ...product,
        allowTransferDiscount: product.allowTransferDiscount ?? true,
        transferDiscountPercent: product.transferDiscountPercent ?? "3.5",
        isImported: product.isImported ?? false,
        importDeliveryDays: product.importDeliveryDays ?? 15,
        importDescription: product.importDescription ?? "",
        shippingMethod: product.shippingMethod ?? null,
        deliveryTime: product.deliveryTime ?? null,
        freeShipping: product.freeShipping ?? null,
        freeShippingMinAmount: product.freeShippingMinAmount ?? null,
      };
      this.products.set(id, updatedProduct);
    });
  }

  private async initializeData() {
    // Initialize admin user with properly hashed password
    const adminId = randomUUID();
    const adminUser: User = {
      id: adminId,
      username: "admin",
      email: "ventas@mercadoboom.com",
      password: "4793bbf5cecad2d304f6e1274977ac0088b758c5847b094e5a826a23c9dc3dcd3b415ecc34942acb0d05df26cb456c5784eb97c56450656eb351f4cfc6b7e040.d2e8b9b2e1be66eee1469803c4ff4362",
      fullName: "Administrador MercadoBoom",
      phone: "+52 55 1234 5678",
      isAdmin: true,
      resetToken: null,
      resetTokenExpiry: null,
      twoFactorEnabled: false,
      twoFactorMethod: null,
      verificationCode: null,
      verificationCodeExpiry: null,
      createdAt: new Date(),
    };
    this.users.set(adminId, adminUser);

    // Initialize categories
    const categories: InsertCategory[] = [
      { name: "Smartphones", emoji: "📱", isActive: true },
      { name: "Laptops", emoji: "💻", isActive: true },
      { name: "Audio", emoji: "🎧", isActive: true },
      { name: "Cámaras", emoji: "📷", isActive: true },
      { name: "Gaming", emoji: "🎮", isActive: true },
    ];

    categories.forEach((cat) => {
      const id = randomUUID();
      const category: Category = {
        ...cat,
        id,
        emoji: cat.emoji ?? null,
        isActive: cat.isActive ?? null,
      };
      this.categories.set(id, category);
    });

    // Get category IDs for products
    const smartphonesCat = Array.from(this.categories.values()).find(c => c.name === "Smartphones")!;
    const laptopsCat = Array.from(this.categories.values()).find(c => c.name === "Laptops")!;
    const audioCat = Array.from(this.categories.values()).find(c => c.name === "Audio")!;
    const camerasCat = Array.from(this.categories.values()).find(c => c.name === "Cámaras")!;

    // Initialize featured products
    const products: InsertProduct[] = [
      // Smartphones
      {
        name: "iPhone 15 Pro Max 256GB",
        description: "El último iPhone con chip A17 Pro, cámara de 48MP y pantalla Super Retina XDR",
        price: "24999",
        originalPrice: "29999",
        categoryId: smartphonesCat.id,
        imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        stock: 45,
        rating: "5.0",
        reviewCount: 128,
        promotionType: "BOOM",
        isActive: true,
        isFeatured: true,
        allowTransferDiscount: true,
        transferDiscountPercent: "3.5",
        isImported: false,
        importDeliveryDays: 15,
        importDescription: "",
      },
      {
        name: "Samsung Galaxy S24 Ultra",
        description: "Smartphone con S Pen, cámara de 200MP y pantalla Dynamic AMOLED 2X",
        price: "22999",
        originalPrice: "26999",
        categoryId: smartphonesCat.id,
        imageUrl: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        stock: 32,
        rating: "4.8",
        reviewCount: 95,
        promotionType: "OFERTA",
        isActive: true,
        isFeatured: true,
      },
      {
        name: "Google Pixel 8 Pro",
        description: "Smartphone con IA avanzada, Magic Eraser y cámara Night Sight",
        price: "18999",
        originalPrice: "21999",
        categoryId: smartphonesCat.id,
        imageUrl: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        stock: 28,
        rating: "4.7",
        reviewCount: 73,
        promotionType: "NUEVO",
        isActive: true,
        isFeatured: false,
      },
      
      // Laptops
      {
        name: "MacBook Pro M3 16\"",
        description: "Laptop profesional con chip M3 Pro, 18GB RAM y pantalla Liquid Retina XDR",
        price: "58999",
        originalPrice: "64999",
        categoryId: laptopsCat.id,
        imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        stock: 15,
        rating: "5.0",
        reviewCount: 67,
        promotionType: "BOOM",
        isActive: true,
        isFeatured: true,
      },
      {
        name: "Gaming Laptop ASUS ROG RTX 4080",
        description: "Laptop gaming con RTX 4080, Intel i9-13900HX y pantalla 240Hz",
        price: "45999",
        originalPrice: "55999",
        categoryId: laptopsCat.id,
        imageUrl: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        stock: 12,
        rating: "4.8",
        reviewCount: 89,
        promotionType: "RELAMPAGO",
        isActive: true,
        isFeatured: true,
      },
      {
        name: "Dell XPS 13 Plus",
        description: "Ultrabook premium con Intel i7-13700H, 16GB RAM y pantalla 4K OLED",
        price: "32999",
        originalPrice: "37999",
        categoryId: laptopsCat.id,
        imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        stock: 20,
        rating: "4.6",
        reviewCount: 54,
        promotionType: "OFERTA",
        isActive: true,
        isFeatured: false,
      },
      
      // Audio
      {
        name: "Sony WH-1000XM5",
        description: "Audífonos premium con cancelación de ruido líder en la industria",
        price: "7299",
        originalPrice: "8999",
        categoryId: audioCat.id,
        imageUrl: "https://images.unsplash.com/photo-1484704849700-f032a568e944?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        stock: 67,
        rating: "5.0",
        reviewCount: 256,
        promotionType: "BOOM",
        isActive: true,
        isFeatured: true,
      },
      {
        name: "AirPods Pro 2",
        description: "Audífonos inalámbricos con cancelación activa de ruido y audio espacial",
        price: "5499",
        originalPrice: "6299",
        categoryId: audioCat.id,
        imageUrl: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        stock: 85,
        rating: "4.8",
        reviewCount: 189,
        promotionType: "RELAMPAGO",
        isActive: true,
        isFeatured: true,
      },
      {
        name: "Bose QuietComfort Ultra",
        description: "Audífonos con la mejor cancelación de ruido y sonido inmersivo",
        price: "8999",
        originalPrice: "10499",
        categoryId: audioCat.id,
        imageUrl: "https://images.unsplash.com/photo-1583394838336-acd977736f90?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        stock: 43,
        rating: "4.9",
        reviewCount: 134,
        promotionType: "NUEVO",
        isActive: true,
        isFeatured: false,
      },
      
      // Cámaras
      {
        name: "Canon EOS R6 Mark II",
        description: "Cámara mirrorless profesional con sensor de 24.2MP y video 4K",
        price: "52999",
        originalPrice: "58999",
        categoryId: camerasCat.id,
        imageUrl: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        stock: 23,
        rating: "5.0",
        reviewCount: 45,
        promotionType: "OFERTA",
        isActive: true,
        isFeatured: true,
      },
      {
        name: "Sony Alpha A7 IV",
        description: "Cámara híbrida con sensor de 33MP, video 4K 60p y estabilización de 5 ejes",
        price: "48999",
        originalPrice: "54999",
        categoryId: camerasCat.id,
        imageUrl: "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        stock: 18,
        rating: "4.8",
        reviewCount: 62,
        promotionType: "BOOM",
        isActive: true,
        isFeatured: true,
      },
      {
        name: "Fujifilm X-T5",
        description: "Cámara retro con sensor APS-C de 40.2MP y diales físicos clásicos",
        price: "35999",
        originalPrice: "39999",
        categoryId: camerasCat.id,
        imageUrl: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        stock: 31,
        rating: "4.7",
        reviewCount: 38,
        promotionType: "NUEVO",
        isActive: true,
        isFeatured: false,
      },

      // Gaming
      {
        name: "PlayStation 5 Pro",
        description: "Consola de nueva generación con GPU mejorada y ray tracing avanzado",
        price: "13999",
        originalPrice: "15999",
        categoryId: Array.from(this.categories.values()).find(c => c.name === "Gaming")?.id || "",
        imageUrl: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        stock: 8,
        rating: "5.0",
        reviewCount: 156,
        promotionType: "BOOM",
        isActive: true,
        isFeatured: true,
      },
      {
        name: "Nintendo Switch OLED",
        description: "Consola híbrida con pantalla OLED de 7\" y modo portátil/sobremesa",
        price: "7999",
        originalPrice: "8999",
        categoryId: Array.from(this.categories.values()).find(c => c.name === "Gaming")?.id || "",
        imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        stock: 42,
        rating: "4.8",
        reviewCount: 243,
        promotionType: "RELAMPAGO",
        isActive: true,
        isFeatured: true,
      },

      // Productos agotados
      {
        name: "iPad Pro M4 11\"",
        description: "Tablet profesional con chip M4 y pantalla OLED Ultra Retina XDR",
        price: "21999",
        originalPrice: "24999",
        categoryId: laptopsCat.id,
        imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        stock: 0, // AGOTADO
        rating: "5.0",
        reviewCount: 87,
        promotionType: "BOOM",
        isActive: true,
        isFeatured: false,
      },

      // Productos afiliados externos
      {
        name: "Samsung Galaxy Watch 6",
        description: "Smartwatch con monitoreo de salud avanzado y GPS - Disponible en tienda afiliada",
        price: "6999",
        originalPrice: "7999",
        categoryId: Array.from(this.categories.values()).find(c => c.name === "Audio")?.id || "",
        imageUrl: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        stock: 0, // No manejamos inventario para productos afiliados
        rating: "4.7",
        reviewCount: 156,
        promotionType: null,
        isActive: true,
        isFeatured: false,
        isAffiliate: true,
        affiliateUrl: "https://www.mercadolibre.com.mx/samsung-galaxy-watch-6",
        affiliateStore: "MercadoLibre",
      },
      {
        name: "Apple Watch Series 9",
        description: "Smartwatch más avanzado de Apple con detección de accidentes - En tienda externa",
        price: "9999",
        originalPrice: "11999",
        categoryId: Array.from(this.categories.values()).find(c => c.name === "Audio")?.id || "",
        imageUrl: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        stock: 0,
        rating: "4.9",
        reviewCount: 234,
        promotionType: null,
        isActive: true,
        isFeatured: false,
        isAffiliate: true,
        affiliateUrl: "https://www.amazon.com.mx/Apple-Watch-Series-9",
        affiliateStore: "Amazon",
      }
    ];

    products.forEach((prod) => {
      const id = randomUUID();
      const product: Product = {
        ...prod,
        id,
        createdAt: new Date(),
        isActive: prod.isActive ?? null,
        description: prod.description ?? null,
        originalPrice: prod.originalPrice ?? null,
        categoryId: prod.categoryId ?? null,
        imageUrl: prod.imageUrl ?? null,
        stock: prod.stock ?? null,
        rating: prod.rating ?? null,
        reviewCount: prod.reviewCount ?? null,
        promotionType: prod.promotionType ?? null,
        isFeatured: prod.isFeatured ?? null,
        isAffiliate: prod.isAffiliate ?? null,
        affiliateUrl: prod.affiliateUrl ?? null,
        affiliateStore: prod.affiliateStore ?? null,
        // Transfer discount fields
        allowTransferDiscount: prod.allowTransferDiscount ?? true,
        transferDiscountPercent: prod.transferDiscountPercent ?? "3.5",
        // Import product fields
        isImported: prod.isImported ?? false,
        importDeliveryDays: prod.importDeliveryDays ?? 15,
        importDescription: prod.importDescription ?? "",
        // Additional fields that may be missing
        shippingMethod: prod.shippingMethod ?? null,
        deliveryTime: prod.deliveryTime ?? null,
        freeShipping: prod.freeShipping ?? null,
        freeShippingMinAmount: prod.freeShippingMinAmount ?? null,
      };
      this.products.set(id, product);
    });

    // Initialize sample banners
    const sampleBanners: InsertBanner[] = [
      {
        title: "¡MEGA BOOM SALE!",
        subtitle: "Descuentos hasta del 40% en productos seleccionados",
        imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400",
        backgroundColor: "#ff4444",
        textColor: "#ffffff",
        buttonText: "Ver Ofertas",
        buttonLink: "/ofertas",
        isActive: true,
        displayOrder: 1,
      },
      {
        title: "BLACK FRIDAY ANTICIPADO",
        subtitle: "¡Los mejores precios del año llegan antes!",
        imageUrl: "https://images.unsplash.com/photo-1583394838336-acd977736f90?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400",
        backgroundColor: "#000000",
        textColor: "#ffffff",
        buttonText: "Comprar Ahora",
        buttonLink: "/explorar",
        isActive: true,
        displayOrder: 2,
      },
      {
        title: "SMARTPHONES DE ÚLTIMA GENERACIÓN",
        subtitle: "iPhone 15, Samsung Galaxy S24, y más con envío gratis",
        imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400",
        backgroundColor: "#2563eb",
        textColor: "#ffffff",
        buttonText: "Explorar",
        buttonLink: "/explorar",
        isActive: true,
        displayOrder: 3,
      },
    ];

    sampleBanners.forEach((banner) => {
      const id = randomUUID();
      const newBanner: Banner = {
        ...banner,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.banners.set(id, newBanner);
    });

    // Initialize sample special offers
    const sampleOffers: InsertSpecialOffer[] = [
      {
        title: "iPhone 15 Pro Max - BOOM DEAL",
        description: "El smartphone más avanzado de Apple con precio especial por tiempo limitado",
        offerType: "BOOM",
        originalPrice: 28999,
        offerPrice: 24999,
        discountPercentage: 15,
        imageUrl: "https://images.unsplash.com/photo-1695654389597-0b3a6deb8bf8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        isActive: true,
        displayOrder: 1,
        productId: Array.from(this.products.values()).find(p => p.name.includes("iPhone 15 Pro Max"))?.id,
      },
      {
        title: "MacBook Pro M3 - OFERTA ESPECIAL",
        description: "Laptop profesional con chip M3 para creativos y desarrolladores",
        offerType: "OFERTA",
        originalPrice: 45999,
        offerPrice: 39999,
        discountPercentage: 13,
        imageUrl: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        isActive: true,
        displayOrder: 2,
        productId: Array.from(this.products.values()).find(p => p.name.includes("MacBook Pro"))?.id,
      },
      {
        title: "AirPods Pro 2 - RELÁMPAGO ⚡",
        description: "Audífonos premium con cancelación de ruido - oferta flash",
        offerType: "RELAMPAGO",
        originalPrice: 6299,
        offerPrice: 5499,
        discountPercentage: 12,
        imageUrl: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        isActive: true,
        displayOrder: 3,
        productId: Array.from(this.products.values()).find(p => p.name.includes("AirPods Pro"))?.id,
      },
      {
        title: "PlayStation 5 Pro - NUEVO",
        description: "La consola más potente de Sony ya disponible en MercadoBoom",
        offerType: "NUEVO",
        originalPrice: 15999,
        offerPrice: 13999,
        discountPercentage: 12,
        imageUrl: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        isActive: true,
        displayOrder: 4,
        productId: Array.from(this.products.values()).find(p => p.name.includes("PlayStation 5"))?.id,
      },
    ];

    sampleOffers.forEach((offer) => {
      const id = randomUUID();
      const newOffer: SpecialOffer = {
        ...offer,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.specialOffers.set(id, newOffer);
    });

    // Initialize transfer discount configuration
    this.transferDiscountConfig = {
      id: randomUUID(),
      discountPercentage: "3.50",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: adminId,
    };

    // Fix product data to ensure all required fields are present
    this.fixProductData();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Case-insensitive username search
    return Array.from(this.users.values()).find(
      user => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.phone === phone);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      phone: insertUser.phone ?? null,
      isAdmin: false,
      resetToken: null,
      resetTokenExpiry: null,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUserResetToken(username: string, resetToken: string, expiry: Date): Promise<User | undefined> {
    const user = await this.getUserByUsername(username);
    if (!user) {
      return undefined;
    }

    const updatedUser: User = {
      ...user,
      resetToken,
      resetTokenExpiry: expiry,
    };

    this.users.set(user.id, updatedUser);
    return updatedUser;
  }

  async resetUserPassword(username: string, resetToken: string, newHashedPassword: string): Promise<User> {
    const user = await this.getUserByUsername(username);
    if (!user || user.resetToken !== resetToken || !user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
      throw new Error("Token de recuperación inválido o expirado");
    }

    const updatedUser: User = {
      ...user,
      password: newHashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    };

    this.users.set(user.id, updatedUser);
    return updatedUser;
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) {
      return false;
    }

    const updatedUser: User = {
      ...user,
      password: hashedPassword,
    };

    this.users.set(user.id, updatedUser);
    return true;
  }

  async updateUserProfile(id: string, profile: Partial<Pick<User, 'fullName' | 'email' | 'username' | 'phone'>>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) {
      return undefined;
    }

    // Check if username or email already exists (if they're being changed)
    if (profile.username && profile.username !== user.username) {
      const existingUserByUsername = await this.getUserByUsername(profile.username);
      if (existingUserByUsername) {
        throw new Error("Username already exists");
      }
    }

    if (profile.email && profile.email !== user.email) {
      const existingUserByEmail = await this.getUserByEmail(profile.email);
      if (existingUserByEmail) {
        throw new Error("Email already exists");
      }
    }

    const updatedUser: User = {
      ...user,
      ...profile,
    };

    this.users.set(user.id, updatedUser);
    return updatedUser;
  }

  async blockUser(userId: string, reason: string, blockedBy: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) {
      return false;
    }

    const updatedUser: User = {
      ...user,
      isBlocked: true,
      blockReason: reason,
      blockedAt: new Date(),
      blockedBy: blockedBy,
    };

    this.users.set(user.id, updatedUser);
    return true;
  }

  async unblockUser(userId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) {
      return false;
    }

    const updatedUser: User = {
      ...user,
      isBlocked: false,
      blockReason: null,
      blockedAt: null,
      blockedBy: null,
    };

    this.users.set(user.id, updatedUser);
    return true;
  }

  // Category methods
  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values()).filter(cat => cat.isActive);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const newCategory: Category = {
      ...category,
      id,
      emoji: category.emoji ?? null,
      isActive: category.isActive ?? null,
    };
    this.categories.set(id, newCategory);
    return newCategory;
  }

  // Product methods
  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(product => product.isActive);
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(product => product.isFeatured && product.isActive);
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(product => 
      product.categoryId === categoryId && product.isActive
    );
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const newProduct: Product = {
      ...product,
      id,
      createdAt: new Date(),
      description: product.description ?? null,
      originalPrice: product.originalPrice ?? null,
      categoryId: product.categoryId ?? null,
      imageUrl: product.imageUrl ?? null,
      stock: product.stock ?? null,
      rating: product.rating ?? null,
      reviewCount: product.reviewCount ?? null,
      promotionType: product.promotionType ?? null,
      isActive: product.isActive ?? null,
      isFeatured: product.isFeatured ?? null,
      isAffiliate: product.isAffiliate ?? null,
      affiliateUrl: product.affiliateUrl ?? null,
      affiliateStore: product.affiliateStore ?? null,
    };
    this.products.set(id, newProduct);
    return newProduct;
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;

    const updatedProduct = { ...product, ...updates };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.products.delete(id);
  }

  // Address methods
  async getUserAddresses(userId: string): Promise<Address[]> {
    return Array.from(this.addresses.values()).filter(addr => addr.userId === userId);
  }

  async createAddress(address: InsertAddress): Promise<Address> {
    const id = randomUUID();
    const newAddress: Address = {
      ...address,
      id,
      country: address.country ?? null,
      isDefault: address.isDefault ?? null,
    };
    this.addresses.set(id, newAddress);
    return newAddress;
  }

  async updateAddress(id: string, updates: Partial<InsertAddress>): Promise<Address | undefined> {
    const address = this.addresses.get(id);
    if (!address) return undefined;

    const updatedAddress = { ...address, ...updates };
    this.addresses.set(id, updatedAddress);
    return updatedAddress;
  }

  async deleteAddress(id: string): Promise<boolean> {
    return this.addresses.delete(id);
  }

  async getAddress(id: string): Promise<Address | undefined> {
    return this.addresses.get(id);
  }

  // Order methods
  async createOrder(order: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const orderNumber = order.orderNumber || `BB-2024-${String(this.orders.size + 1).padStart(3, '0')}`;
    
    const newOrder: Order = {
      ...order,
      id,
      orderNumber,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: order.status ?? "PAGADO",
      quantity: order.quantity ?? null,
      shippingAddressId: order.shippingAddressId ?? null,
      trackingNumber: order.trackingNumber ?? null,
    };
    this.orders.set(id, newOrder);
    return newOrder;
  }

  async getUserOrders(userId: string): Promise<OrderWithDetails[]> {
    const userOrders = Array.from(this.orders.values()).filter(order => order.userId === userId);
    
    return Promise.all(userOrders.map(async order => {
      const product = await this.getProduct(order.productId);
      const shippingAddress = order.shippingAddressId ? await this.getAddress(order.shippingAddressId) : undefined;
      const user = await this.getUser(order.userId);
      
      return {
        ...order,
        product: product!,
        shippingAddress,
        user: {
          id: user!.id,
          username: user!.username,
          email: user!.email,
          fullName: user!.fullName,
        },
      };
    }));
  }

  async getAllOrders(): Promise<OrderWithDetails[]> {
    const allOrders = Array.from(this.orders.values());
    
    return Promise.all(allOrders.map(async order => {
      const product = await this.getProduct(order.productId);
      const shippingAddress = order.shippingAddressId ? await this.getAddress(order.shippingAddressId) : undefined;
      const user = await this.getUser(order.userId);
      
      return {
        ...order,
        product: product!,
        shippingAddress,
        user: {
          id: user!.id,
          username: user!.username,
          email: user!.email,
          fullName: user!.fullName,
        },
      };
    }));
  }

  async getOrder(id: string): Promise<OrderWithDetails | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    const product = await this.getProduct(order.productId);
    const shippingAddress = order.shippingAddressId ? await this.getAddress(order.shippingAddressId) : undefined;
    const user = await this.getUser(order.userId);
    
    if (!product || !user) return undefined;

    return {
      ...order,
      product,
      shippingAddress,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
      },
    };
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    const updatedOrder = { ...order, status, updatedAt: new Date() };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async updateOrderPaymentInfo(id: string, paymentInfo: Partial<Pick<Order, 'paymentId' | 'preferenceId' | 'paymentStatus' | 'paymentMethod'>>): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    const updatedOrder: Order = {
      ...order,
      ...paymentInfo,
      updatedAt: new Date(),
    };

    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async getAdminStats(): Promise<{
    activeUsers: number;
    totalSales: string;
    totalOrders: number;
    conversionRate: string;
  }> {
    const activeUsers = this.users.size;
    const totalOrders = this.orders.size;
    
    const totalSales = Array.from(this.orders.values())
      .reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);

    return {
      activeUsers,
      totalSales: `$${(totalSales / 1000000).toFixed(1)}M`,
      totalOrders,
      conversionRate: "4.2%",
    };
  }

  // Support ticket methods
  async createSupportTicket(ticket: InsertSupportTicket & { ticketNumber: string }): Promise<SupportTicket> {
    const id = randomUUID();
    const newTicket: SupportTicket = {
      ...ticket,
      id,
      priority: ticket.priority || "MEDIO",
      status: "ABIERTO",
      createdAt: new Date(),
      updatedAt: new Date(),
      resolvedAt: null,
      attachments: [],
      assignedTo: null,
      adminNotes: null,
      resolution: null,
      orderId: ticket.orderId || null,
    };
    this.supportTickets.set(id, newTicket);
    this.ticketMessages.set(id, []); // Initialize empty messages array
    return newTicket;
  }

  async getAllSupportTickets(): Promise<SupportTicket[]> {
    return Array.from(this.supportTickets.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getUserSupportTickets(userId: string): Promise<SupportTicket[]> {
    return Array.from(this.supportTickets.values())
      .filter(ticket => ticket.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getSupportTicket(id: string): Promise<SupportTicket | undefined> {
    return this.supportTickets.get(id);
  }

  async updateSupportTicket(data: { ticketId: string; status?: string; assignedTo?: string; adminNotes?: string; resolution?: string }): Promise<SupportTicket | undefined> {
    const ticket = this.supportTickets.get(data.ticketId);
    if (!ticket) return undefined;

    const updatedTicket: SupportTicket = {
      ...ticket,
      ...(data.status && { status: data.status }),
      ...(data.assignedTo && { assignedTo: data.assignedTo }),
      ...(data.adminNotes && { adminNotes: data.adminNotes }),
      ...(data.resolution && { resolution: data.resolution }),
      updatedAt: new Date(),
      ...(data.status === "RESUELTO" || data.status === "CERRADO" ? { resolvedAt: new Date() } : {})
    };

    this.supportTickets.set(data.ticketId, updatedTicket);
    return updatedTicket;
  }

  async createTicketMessage(message: InsertTicketMessage): Promise<TicketMessage> {
    const id = randomUUID();
    const newMessage: TicketMessage = {
      ...message,
      id,
      createdAt: new Date(),
      attachments: [],
      isInternal: message.isInternal || false,
    };

    const messages = this.ticketMessages.get(message.ticketId) || [];
    messages.push(newMessage);
    this.ticketMessages.set(message.ticketId, messages);

    return newMessage;
  }

  async getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
    return this.ticketMessages.get(ticketId) || [];
  }

  async getSupportTicketStats(): Promise<{
    totalTickets: number;
    openTickets: number;
    inProgressTickets: number;
    resolvedTickets: number;
    avgResponseTime: string;
  }> {
    const tickets = Array.from(this.supportTickets.values());
    const openTickets = tickets.filter(t => t.status === "ABIERTO").length;
    const inProgressTickets = tickets.filter(t => t.status === "EN_PROCESO").length;
    const resolvedTickets = tickets.filter(t => t.status === "RESUELTO" || t.status === "CERRADO").length;

    return {
      totalTickets: tickets.length,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      avgResponseTime: "2.5 horas",
    };
  }

  // Banner management methods
  async getAllBanners(): Promise<Banner[]> {
    return Array.from(this.banners.values()).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  async getActiveBanners(): Promise<Banner[]> {
    return Array.from(this.banners.values())
      .filter(banner => banner.isActive)
      .filter(banner => {
        const now = new Date();
        const startValid = !banner.startDate || new Date(banner.startDate) <= now;
        const endValid = !banner.endDate || new Date(banner.endDate) >= now;
        return startValid && endValid;
      })
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  async getBanner(id: string): Promise<Banner | undefined> {
    return this.banners.get(id);
  }

  async createBanner(banner: InsertBanner): Promise<Banner> {
    const id = randomUUID();
    const newBanner: Banner = {
      ...banner,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.banners.set(id, newBanner);
    return newBanner;
  }

  async updateBanner(id: string, banner: UpdateBanner): Promise<Banner | undefined> {
    const existing = this.banners.get(id);
    if (!existing) return undefined;

    const updated: Banner = {
      ...existing,
      ...banner,
      updatedAt: new Date(),
    };
    this.banners.set(id, updated);
    return updated;
  }

  async deleteBanner(id: string): Promise<boolean> {
    return this.banners.delete(id);
  }

  // Special offers management methods
  async getAllSpecialOffers(): Promise<SpecialOffer[]> {
    return Array.from(this.specialOffers.values()).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  async getActiveSpecialOffers(): Promise<SpecialOffer[]> {
    return Array.from(this.specialOffers.values())
      .filter(offer => offer.isActive)
      .filter(offer => {
        const now = new Date();
        const startValid = !offer.startDate || new Date(offer.startDate) <= now;
        const endValid = !offer.endDate || new Date(offer.endDate) >= now;
        return startValid && endValid;
      })
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  async getSpecialOffer(id: string): Promise<SpecialOffer | undefined> {
    return this.specialOffers.get(id);
  }

  async createSpecialOffer(offer: InsertSpecialOffer): Promise<SpecialOffer> {
    const id = randomUUID();
    const newOffer: SpecialOffer = {
      ...offer,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.specialOffers.set(id, newOffer);
    return newOffer;
  }

  async updateSpecialOffer(id: string, offer: UpdateSpecialOffer): Promise<SpecialOffer | undefined> {
    const existing = this.specialOffers.get(id);
    if (!existing) return undefined;

    const updated: SpecialOffer = {
      ...existing,
      ...offer,
      updatedAt: new Date(),
    };
    this.specialOffers.set(id, updated);
    return updated;
  }

  async deleteSpecialOffer(id: string): Promise<boolean> {
    return this.specialOffers.delete(id);
  }

  // Transfer discount configuration methods
  async getTransferDiscountConfig(): Promise<TransferDiscountConfig | undefined> {
    return this.transferDiscountConfig;
  }

  async updateTransferDiscountConfig(config: InsertTransferDiscountConfig): Promise<TransferDiscountConfig> {
    const updated: TransferDiscountConfig = {
      id: this.transferDiscountConfig?.id || randomUUID(),
      ...config,
      createdAt: this.transferDiscountConfig?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.transferDiscountConfig = updated;
    return updated;
  }
}

// PostgreSQL-based storage implementation
export class DbStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    this.initializeData();
  }

  private async initializeData() {
    // Check if admin user exists, if not create it
    const existingAdmin = await db.select().from(users).where(eq(users.username, "admin")).limit(1);
    
    if (existingAdmin.length === 0) {
      await db.insert(users).values({
        username: "admin",
        email: "ventas@mercadoboom.com",
        password: "4793bbf5cecad2d304f6e1274977ac0088b758c5847b094e5a826a23c9dc3dcd3b415ecc34942acb0d05df26cb456c5784eb97c56450656eb351f4cfc6b7e040.d2e8b9b2e1be66eee1469803c4ff4362",
        fullName: "Administrador MercadoBoom",
        phone: "+52 55 1234 5678",
        isAdmin: true,
      });
    }

    // Initialize categories if they don't exist
    const existingCategories = await db.select().from(categories).limit(1);
    if (existingCategories.length === 0) {
      const categoriesToInsert = [
        { name: "Smartphones", emoji: "📱", isActive: true },
        { name: "Laptops", emoji: "💻", isActive: true },
        { name: "Audio", emoji: "🎧", isActive: true },
        { name: "Cámaras", emoji: "📷", isActive: true },
        { name: "Gaming", emoji: "🎮", isActive: true },
      ];
      
      for (const cat of categoriesToInsert) {
        await db.insert(categories).values(cat);
      }
    }

    // Initialize sample products if they don't exist
    const existingProducts = await db.select().from(products).limit(1);
    if (existingProducts.length === 0) {
      const smartphonesCat = await db.select().from(categories).where(eq(categories.name, "Smartphones")).limit(1);
      if (smartphonesCat.length > 0) {
        await db.insert(products).values({
          name: "iPhone 15 Pro Max 256GB",
          description: "El iPhone más avanzado con chip A17 Pro y cámaras profesionales",
          price: "32999.00",
          originalPrice: "35999.00",
          categoryId: smartphonesCat[0].id,
          imageUrl: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500",
          stock: 15,
          rating: "4.8",
          reviewCount: 127,
          promotionType: "BOOM",
          isActive: true,
          isFeatured: true,
        });
      }
    }

    // Initialize transfer discount config if it doesn't exist
    const existingConfig = await db.select().from(transferDiscountConfig).limit(1);
    if (existingConfig.length === 0) {
      await db.insert(transferDiscountConfig).values({
        discountPercentage: "3.50",
        discountText: "por evitar comisiones",
        isActive: true,
      });
    }
  }

  // User management
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Case-insensitive username search
    const result = await db.select().from(users).where(
      sql`LOWER(${users.username}) = LOWER(${username})`
    ).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserResetToken(username: string, resetToken: string, expiry: Date): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ resetToken, resetTokenExpiry: expiry })
      .where(eq(users.username, username))
      .returning();
    return result[0];
  }

  async resetUserPassword(username: string, resetToken: string, newHashedPassword: string): Promise<User> {
    const user = await this.getUserByUsername(username);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }
    if (user.resetToken !== resetToken) {
      throw new Error("Token de recuperación inválido");
    }
    if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      throw new Error("Token de recuperación expirado");
    }

    const result = await db.update(users)
      .set({ 
        password: newHashedPassword, 
        resetToken: null, 
        resetTokenExpiry: null 
      })
      .where(eq(users.username, username))
      .returning();
    return result[0];
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<boolean> {
    const result = await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId))
      .returning();
    return result.length > 0;
  }

  async updateUserProfile(id: string, profile: Partial<Pick<User, 'fullName' | 'email' | 'username' | 'phone'>>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(profile)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async blockUser(userId: string, reason: string, blockedBy: string): Promise<boolean> {
    const result = await db.update(users)
      .set({ 
        isBlocked: true, 
        blockReason: reason,
        blockedAt: new Date(),
        blockedBy: blockedBy
      })
      .where(eq(users.id, userId))
      .returning();
    return result.length > 0;
  }

  async unblockUser(userId: string): Promise<boolean> {
    const result = await db.update(users)
      .set({ 
        isBlocked: false, 
        blockReason: null,
        blockedAt: null,
        blockedBy: null
      })
      .where(eq(users.id, userId))
      .returning();
    return result.length > 0;
  }

  // Category management
  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.isActive, true));
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values(category).returning();
    return result[0];
  }

  // Product management
  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isActive, true));
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return await db.select().from(products)
      .where(and(eq(products.isActive, true), eq(products.isFeatured, true)));
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    return await db.select().from(products)
      .where(and(eq(products.isActive, true), eq(products.categoryId, categoryId)));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return result[0];
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const result = await db.insert(products).values(product).returning();
    return result[0];
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const result = await db.update(products)
      .set(product)
      .where(eq(products.id, id))
      .returning();
    return result[0];
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db.update(products)
      .set({ isActive: false })
      .where(eq(products.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Address management
  async getUserAddresses(userId: string): Promise<Address[]> {
    return await db.select().from(addresses).where(eq(addresses.userId, userId));
  }

  async createAddress(address: InsertAddress): Promise<Address> {
    const result = await db.insert(addresses).values(address).returning();
    return result[0];
  }

  async updateAddress(id: string, address: Partial<InsertAddress>): Promise<Address | undefined> {
    const result = await db.update(addresses)
      .set(address)
      .where(eq(addresses.id, id))
      .returning();
    return result[0];
  }

  async deleteAddress(id: string): Promise<boolean> {
    const result = await db.delete(addresses).where(eq(addresses.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getAddress(id: string): Promise<Address | undefined> {
    const result = await db.select().from(addresses).where(eq(addresses.id, id)).limit(1);
    return result[0];
  }

  // Simplified implementations for remaining methods...
  async createOrder(order: InsertOrder): Promise<Order> {
    const orderNumber = `BB-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const result = await db.insert(orders).values({
      ...order,
      orderNumber,
      status: "PENDIENTE",
      statusHistory: [],
    }).returning();
    return result[0];
  }

  async getUserOrders(userId: string): Promise<OrderWithDetails[]> {
    // Simplified - returns orders without joins for now
    const userOrders = await db.select().from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
    
    // For now, return without full details - this can be enhanced later
    return userOrders.map(order => ({ 
      ...order,
      product: { id: '', name: 'Product', description: '', price: '0', categoryId: null, stock: 0, rating: '0', reviewCount: 0, isActive: true, isFeatured: false, isAffiliate: false, affiliateUrl: null, affiliateStore: null, shippingMethod: 'Envío Estándar', deliveryTime: '3-5 días hábiles', freeShipping: false, freeShippingMinAmount: '999', allowTransferDiscount: true, transferDiscountPercent: '3.50', createdAt: new Date(), imageUrl: null, originalPrice: null, promotionType: null },
      user: { id: userId, username: '', email: '', fullName: '' }
    })) as OrderWithDetails[];
  }

  async getAllOrders(): Promise<OrderWithDetails[]> {
    const allOrders = await db
      .select({
        order: orders,
        product: products,
        user: users,
        address: addresses,
      })
      .from(orders)
      .leftJoin(products, eq(orders.productId, products.id))
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(addresses, eq(orders.shippingAddressId, addresses.id))
      .orderBy(desc(orders.createdAt));

    return allOrders.map(row => ({
      ...row.order,
      product: row.product!,
      shippingAddress: row.address || undefined,
      user: {
        id: row.user!.id,
        username: row.user!.username,
        email: row.user!.email,
        fullName: row.user!.fullName,
      }
    }));
  }

  async getOrder(id: string): Promise<OrderWithDetails | undefined> {
    const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!result[0]) return undefined;
    
    return { 
      ...result[0],
      product: { id: '', name: 'Product', description: '', price: '0', categoryId: null, stock: 0, rating: '0', reviewCount: 0, isActive: true, isFeatured: false, isAffiliate: false, affiliateUrl: null, affiliateStore: null, shippingMethod: 'Envío Estándar', deliveryTime: '3-5 días hábiles', freeShipping: false, freeShippingMinAmount: '999', allowTransferDiscount: true, transferDiscountPercent: '3.50', createdAt: new Date(), imageUrl: null, originalPrice: null, promotionType: null },
      user: { id: '', username: '', email: '', fullName: '' }
    } as OrderWithDetails;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const result = await db.update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return result[0];
  }

  async updateOrderPaymentInfo(id: string, paymentInfo: Partial<Pick<Order, 'paymentId' | 'preferenceId' | 'paymentStatus' | 'paymentMethod'>>): Promise<Order | undefined> {
    const result = await db.update(orders)
      .set(paymentInfo)
      .where(eq(orders.id, id))
      .returning();
    return result[0];
  }

  // For now, implement remaining methods with basic functionality
  async getAdminStats(): Promise<{ activeUsers: number; totalSales: string; totalOrders: number; pendingOrders: number }> {
    const userCount = await db.select().from(users);
    const orderCount = await db.select().from(orders);
    
    return {
      activeUsers: userCount.length,
      totalSales: "$0.0M",
      totalOrders: orderCount.length,
      pendingOrders: orderCount.filter(o => o.status === "PENDIENTE").length
    };
  }

  // Stub implementations for other methods - these can be implemented as needed
  async getOrderStats(): Promise<any> { return {}; }
  async getRecentOrders(limit: number = 10): Promise<OrderWithDetails[]> { return []; }
  async uploadTransferReceipt(orderId: string, receiptUrl: string): Promise<Order | undefined> { return undefined; }
  async verifyTransfer(orderId: string, verified: boolean, notes?: string, adminId?: string): Promise<Order | undefined> { return undefined; }
  async createPaymentConfig(config: any): Promise<any> { return {}; }
  async updatePaymentConfig(id: string, config: any): Promise<any> { return {}; }
  async getAllPaymentConfigs(): Promise<any[]> { return []; }
  async getActivePaymentConfigs(): Promise<any[]> { return []; }
  async createSupportTicket(ticket: InsertSupportTicket & { ticketNumber: string }): Promise<SupportTicket> {
    const result = await db.insert(supportTickets).values({
      ...ticket,
      status: "ABIERTO",
    }).returning();
    return result[0];
  }
  async getUserSupportTickets(userId: string): Promise<SupportTicket[]> {
    return await db.select().from(supportTickets)
      .where(eq(supportTickets.userId, userId))
      .orderBy(desc(supportTickets.createdAt));
  }
  async getAllSupportTickets(): Promise<SupportTicket[]> {
    return await db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt));
  }
  async updateTicketStatus(ticketId: string, status: string, assignedTo?: string, adminNotes?: string, resolution?: string): Promise<SupportTicket | undefined> {
    const updateData: any = { status };
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (adminNotes) updateData.adminNotes = adminNotes;
    if (resolution) updateData.resolution = resolution;
    if (status === "RESUELTO" || status === "CERRADO") updateData.resolvedAt = new Date();
    
    const result = await db.update(supportTickets)
      .set(updateData)
      .where(eq(supportTickets.id, ticketId))
      .returning();
    return result[0];
  }
  async getSupportTicket(id: string): Promise<SupportTicket | undefined> {
    const result = await db.select().from(supportTickets)
      .where(eq(supportTickets.id, id))
      .limit(1);
    return result[0];
  }
  async updateSupportTicket(data: { ticketId: string; status?: string; assignedTo?: string; adminNotes?: string; resolution?: string }): Promise<SupportTicket | undefined> {
    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.assignedTo) updateData.assignedTo = data.assignedTo;
    if (data.adminNotes) updateData.adminNotes = data.adminNotes;
    if (data.resolution) updateData.resolution = data.resolution;
    if (data.status === "RESUELTO" || data.status === "CERRADO") {
      updateData.resolvedAt = new Date();
    }
    
    const result = await db.update(supportTickets)
      .set(updateData)
      .where(eq(supportTickets.id, data.ticketId))
      .returning();
    return result[0];
  }
  async getSupportTicketStats(): Promise<any> { return {}; }
  async createTicketMessage(message: InsertTicketMessage): Promise<TicketMessage> {
    const result = await db.insert(ticketMessages).values(message).returning();
    return result[0];
  }
  async getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
    return await db.select().from(ticketMessages)
      .where(eq(ticketMessages.ticketId, ticketId))
      .orderBy(ticketMessages.createdAt);
  }
  async createBanner(banner: InsertBanner): Promise<Banner> {
    const result = await db.insert(banners).values(banner).returning();
    return result[0];
  }
  async getAllBanners(): Promise<Banner[]> {
    return await db.select().from(banners).orderBy(desc(banners.displayOrder));
  }
  async getActiveBanners(): Promise<Banner[]> {
    return await db.select().from(banners)
      .where(eq(banners.isActive, true))
      .orderBy(desc(banners.displayOrder));
  }
  async updateBanner(id: string, banner: UpdateBanner): Promise<Banner | undefined> {
    const result = await db.update(banners)
      .set(banner)
      .where(eq(banners.id, id))
      .returning();
    return result[0];
  }
  async deleteBanner(id: string): Promise<boolean> {
    const result = await db.delete(banners).where(eq(banners.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
  async createSpecialOffer(offer: InsertSpecialOffer): Promise<SpecialOffer> {
    const result = await db.insert(specialOffers).values(offer).returning();
    return result[0];
  }
  async getAllSpecialOffers(): Promise<SpecialOffer[]> {
    return await db.select().from(specialOffers).orderBy(desc(specialOffers.displayOrder));
  }
  async getActiveSpecialOffers(): Promise<SpecialOffer[]> {
    return await db.select().from(specialOffers)
      .where(eq(specialOffers.isActive, true))
      .orderBy(desc(specialOffers.displayOrder));
  }
  async updateSpecialOffer(id: string, offer: UpdateSpecialOffer): Promise<SpecialOffer | undefined> {
    const result = await db.update(specialOffers)
      .set(offer)
      .where(eq(specialOffers.id, id))
      .returning();
    return result[0];
  }
  async deleteSpecialOffer(id: string): Promise<boolean> {
    const result = await db.delete(specialOffers).where(eq(specialOffers.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
  async getTransferDiscountConfig(): Promise<TransferDiscountConfig> {
    const result = await db.select().from(transferDiscountConfig)
      .where(eq(transferDiscountConfig.isActive, true))
      .limit(1);
    
    if (result.length === 0) {
      // Create default config if none exists
      const defaultConfig = await db.insert(transferDiscountConfig).values({
        discountPercentage: "3.50",
        discountText: "por evitar comisiones",
        isActive: true,
      }).returning();
      return defaultConfig[0];
    }
    
    return result[0];
  }
  async updateTransferDiscountConfig(config: InsertTransferDiscountConfig & { updatedBy?: string }): Promise<TransferDiscountConfig> {
    const { updatedBy, ...configData } = config;
    const result = await db.update(transferDiscountConfig)
      .set({
        ...configData,
        updatedBy: updatedBy || null,
        updatedAt: new Date(),
      })
      .where(eq(transferDiscountConfig.isActive, true))
      .returning();
    return result[0];
  }
}

export const storage = new DbStorage();
