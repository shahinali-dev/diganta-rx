// Role is defined once, in prisma/schema.prisma, and Prisma generates this
// enum on `npx prisma generate`. Re-exported here so other modules can keep
// importing "Role" from the module folder, same as the Mongoose version did.
export { Provider, Role } from "@prisma/client";
export enum OTP_CONFIG {
  MAX_ATTEMPTS = 5,
  BLOCK_DURATION = 15 * 60 * 1000,
  EXPIRY_DURATION = 10 * 60 * 1000,
  RESEND_COOLDOWN = 60 * 1000,
  OTP_LENGTH = 6,
}
