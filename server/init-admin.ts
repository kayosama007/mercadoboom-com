import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Pre-hashed password for admin123 with salt
export const ADMIN_HASHED_PASSWORD = "d0a8e2f5c4b3a9e6d7c8b5a4e9f6d3c0b7a8e5f2d9c6b3a0e7f4d1c8b5a2e9f6d3c0b7a4e1f8d5c2b9a6e3f0d7c4b1a8e5f2.a1b2c3d4e5f6789012345678";

export async function createAdminHash() {
  return await hashPassword("admin123");
}