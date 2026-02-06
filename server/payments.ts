import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { storage } from "./storage";
import type { Product, User, Address } from "@shared/schema";

// Initialize MercadoPago - will use environment variables
let client: MercadoPagoConfig | null = null;
let preferenceService: Preference | null = null;
let paymentService: Payment | null = null;

export function initializeMercadoPago() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.warn("MercadoPago Access Token not found. Payment functionality will be limited.");
    return false;
  }

  try {
    client = new MercadoPagoConfig({ 
      accessToken: accessToken,
      options: { timeout: 5000, idempotencyKey: 'abc' }
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

export async function createPaymentPreference(
  product: Product, 
  user: User, 
  quantity: number = 1,
  shippingAddress?: Address
) {
  if (!preferenceService) {
    throw new Error("MercadoPago no está configurado. Contacta al administrador.");
  }

  const totalAmount = parseFloat(product.price) * quantity;
  const orderNumber = `MB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // Create order first
  const order = await storage.createOrder({
    userId: user.id,
    productId: product.id,
    quantity,
    totalAmount: totalAmount.toString(),
    status: "PENDIENTE",
    paymentStatus: "pending",
    shippingAddressId: shippingAddress?.id,
  });

  // MercadoPago preference configuration
  const preferenceData = {
    items: [
      {
        id: product.id,
        title: product.name,
        description: product.description || "Producto electrónico de MercadoBoom",
        category_id: "electronics",
        quantity: quantity,
        currency_id: "MXN",
        unit_price: parseFloat(product.price),
        picture_url: product.imageUrl || undefined,
      }
    ],
    payer: {
      name: user.fullName.split(' ')[0],
      surname: user.fullName.split(' ').slice(1).join(' ') || '',
      email: user.email,
      phone: user.phone ? {
        area_code: "+52",
        number: user.phone.replace(/\D/g, '')
      } : undefined,
      identification: {
        type: "RFC",
        number: "XAXX010101000" // Default RFC for Mexico
      },
      address: shippingAddress ? {
        street_name: shippingAddress.street,
        street_number: "S/N",
        zip_code: shippingAddress.postalCode,
        federal_unit: shippingAddress.state,
        city_name: shippingAddress.city,
        neighborhood: "Centro"
      } : undefined
    },
    back_urls: {
      success: `https://shop.mercadoboom.com/payment/success?order=${order.id}`,
      failure: `https://shop.mercadoboom.com/payment/failure?order=${order.id}`,
      pending: `https://shop.mercadoboom.com/payment/pending?order=${order.id}`,
    },
    auto_return: "approved" as const,
    payment_methods: {
      excluded_payment_methods: [],
      excluded_payment_types: [],
      installments: 12,
    },
    notification_url: `https://shop.mercadoboom.com/api/payments/webhook`,
    statement_descriptor: "MERCADOBOOM",
    external_reference: order.id,
    expires: true,
    expiration_date_from: new Date().toISOString(),
    expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
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
      // Update order with preference ID
      await storage.updateOrderPaymentInfo(order.id, {
        preferenceId: preference.id,
      });
    }

    return {
      preferenceId: preference.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point,
      orderId: order.id,
      orderNumber: orderNumber,
      amount: totalAmount
    };
  } catch (error) {
    console.error("Error creating MercadoPago preference:", error);
    throw new Error("Error al crear la preferencia de pago. Inténtalo de nuevo.");
  }
}

export async function processPaymentWebhook(webhookData: any) {
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

    // Get payment information from MercadoPago
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

    // Update order based on payment status
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
      paymentId: paymentId,
      paymentStatus,
      paymentMethod: payment.payment_method_id || undefined,
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

export function getMercadoPagoPublicKey(): string {
  return process.env.MERCADOPAGO_PUBLIC_KEY || "";
}

// Initialize on module load
initializeMercadoPago();