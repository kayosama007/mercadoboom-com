import { db } from "./db";
import { paymentConfig } from "@shared/schema";
import type { PaymentConfig, InsertPaymentConfig } from "@shared/schema";
import { eq } from "drizzle-orm";

export class PaymentConfigStorage {
  async getAllPaymentConfigs(): Promise<PaymentConfig[]> {
    return await db.select().from(paymentConfig);
  }

  async getPaymentConfig(id: string): Promise<PaymentConfig | undefined> {
    const [config] = await db
      .select()
      .from(paymentConfig)
      .where(eq(paymentConfig.id, id));
    return config || undefined;
  }

  async getPaymentConfigByKey(configKey: string): Promise<PaymentConfig | undefined> {
    const [config] = await db
      .select()
      .from(paymentConfig)
      .where(eq(paymentConfig.configKey, configKey));
    return config || undefined;
  }

  async createPaymentConfig(insertPaymentConfig: InsertPaymentConfig): Promise<PaymentConfig> {
    const [config] = await db
      .insert(paymentConfig)
      .values(insertPaymentConfig)
      .returning();
    return config;
  }

  async updatePaymentConfig(id: string, updatePaymentConfig: Partial<PaymentConfig>): Promise<PaymentConfig | undefined> {
    const [config] = await db
      .update(paymentConfig)
      .set({ 
        ...updatePaymentConfig, 
        updatedAt: new Date() 
      })
      .where(eq(paymentConfig.id, id))
      .returning();
    return config || undefined;
  }
}

export const paymentConfigStorage = new PaymentConfigStorage();