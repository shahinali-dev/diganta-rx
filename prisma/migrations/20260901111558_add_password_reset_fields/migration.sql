-- AlterTable
ALTER TABLE "users" ADD COLUMN     "lastPasswordResetOtpSentAt" TIMESTAMP(3),
ADD COLUMN     "passwordResetAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "passwordResetBlockedUntil" TIMESTAMP(3),
ADD COLUMN     "passwordResetOtp" TEXT,
ADD COLUMN     "passwordResetOtpExpiry" TIMESTAMP(3),
ALTER COLUMN "password" DROP NOT NULL;
