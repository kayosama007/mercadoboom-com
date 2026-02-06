import { db } from "./db";
import { paymentConfig } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function initializePaymentConfigurations() {
  console.log("Initializing default payment configurations...");

  // Default configurations
  const defaultConfigs = [
    {
      configKey: "mercadopago",
      displayName: "MercadoPago",
      isActive: true,
      config: JSON.stringify({
        publicKey: process.env.MERCADOPAGO_PUBLIC_KEY || "TEST-xxx",
        accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || "TEST-xxx",
        webhookUrl: "/api/payments/webhook"
      })
    },
    {
      configKey: "bank_transfer",
      displayName: "Transferencia Bancaria BBVA",
      isActive: true,
      config: JSON.stringify({
        bankName: "BBVA México",
        clabe: "012180004799747847",
        accountHolder: "MercadoBoom SA de CV",
        discountPercent: "3.50",
        instructions: [
          "Realiza la transferencia usando la CLABE interbancaria",
          "Usa como referencia el número de pedido",
          "Envía comprobante por WhatsApp: +52 55 1256 2704",
          "O por email: ventas@mercadoboom.com",
          "El pedido se procesa al confirmar el pago (24-48 hrs)"
        ]
      })
    },
    {
      configKey: "conekta",
      displayName: "Conekta (No Configurado)",
      isActive: false,
      config: JSON.stringify({
        publicKey: "",
        privateKey: "",
        webhookUrl: "/api/payments/conekta-webhook",
        note: "Configurar cuando se requiera usar Conekta"
      })
    }
  ];

  // Insert or update configurations
  for (const configData of defaultConfigs) {
    try {
      // Check if config already exists
      const existingConfig = await db
        .select()
        .from(paymentConfig)
        .where(eq(paymentConfig.configKey, configData.configKey))
        .limit(1);

      if (existingConfig.length === 0) {
        // Insert new config
        await db.insert(paymentConfig).values(configData);
        console.log(`✓ Created ${configData.displayName} configuration`);
      } else {
        console.log(`→ ${configData.displayName} configuration already exists`);
      }
    } catch (error) {
      console.error(`Error initializing ${configData.displayName}:`, error);
    }
  }

  console.log("Payment configurations initialization completed.");
}

// Initialize on startup
initializePaymentConfigurations().catch(console.error);