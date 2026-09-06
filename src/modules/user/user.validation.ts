import { z } from "zod";
import { Role } from "./user.enum";

// Base validation schema for common fields
const baseUserValidationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  role: z.nativeEnum(Role).optional(),
  avatar: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const verifyOtpValidationSchema = z.object({
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only digits"),
});

const forgotPasswordValidationSchema = z.object({
  email: z.string().email("Invalid email format"),
});

const resetPasswordValidationSchema = z.object({
  email: z.string().email("Invalid email format"),
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

const migrateRoleValidationSchema = z.object({
  role: z.nativeEnum(Role, {
    errorMap: () => ({ message: "Invalid role value" }),
  }),
});

const updateUserInfoValidationSchema = z.object({
  name: z.string().min(1, "Name Must be at least 1 character").optional(),
  avatar: z.string().optional(),
});

export const userValidation = {
  baseUserValidationSchema,
  verifyOtpValidationSchema,
  forgotPasswordValidationSchema,
  resetPasswordValidationSchema,
  migrateRoleValidationSchema,
  updateUserInfoValidationSchema,
};
