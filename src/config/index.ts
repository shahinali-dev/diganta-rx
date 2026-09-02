import dotenv from "dotenv";
dotenv.config();

import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  SALT_ROUNDS: z.coerce.number().default(10),
  JWT_ACCESS_SECRET: z.string().min(1, "JWT_ACCESS_SECRET is required"),
  JWT_ACCESS_EXPIRE_IN: z.string().min(1, "JWT_ACCESS_EXPIRE_IN is required"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
  JWT_REFRESH_EXPIRE_IN: z.string().min(1, "JWT_REFRESH_EXPIRE_IN is required"),
  CORS_ORIGIN: z.string().min(1, "CORS_ORIGIN is required"),
  APP_EMAIL: z.string().email("APP_EMAIL must be a valid email"),
  APP_PASSWORD: z.string().min(1, "APP_PASSWORD is required"),
  JWT_VERIFY_SECRET: z.string().min(1, "JWT_VERIFY_SECRET is required"),
  JWT_VERIFY_EXPIRE_IN: z.string().min(1, "JWT_VERIFY_EXPIRE_IN is required"),
  VERIFY_COOKIE_EXPIRES_MS: z.coerce.number().default(86400000), // 1 day
  REFRESH_COOKIE_EXPIRES_MS: z.coerce.number().default(604800000), // 7 days
  ACCESS_COOKIE_EXPIRES_MS: z.coerce.number().default(86400000), // 1 day
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    JSON.stringify(parsed.error.format(), null, 2),
  );
  process.exit(1);
}

export default parsed.data;
