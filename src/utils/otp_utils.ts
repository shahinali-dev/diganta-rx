import crypto from "crypto";
import { OTP_CONFIG } from "../modules/user/user.enum";

export class OTPUtils {
  // Generate cryptographically secure OTP
  static generateSecureOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  // Hash OTP before storing
  static hashOTP(otp: string): string {
    return crypto.createHash("sha256").update(otp).digest("hex");
  }

  // Timing-safe OTP comparison with hashing
  static verifyOTPSafely(storedHashedOtp: string, inputOtp: string): boolean {
    if (!storedHashedOtp || !inputOtp) return false;

    try {
      const inputHash = this.hashOTP(inputOtp);
      const storedBuffer = Buffer.from(storedHashedOtp);
      const inputBuffer = Buffer.from(inputHash);

      if (storedBuffer.length !== inputBuffer.length) return false;

      return crypto.timingSafeEqual(storedBuffer, inputBuffer);
    } catch (error) {
      return false;
    }
  }

  // Calculate remaining attempts
  static getRemainingAttempts(currentAttempts: number): number {
    return Math.max(0, OTP_CONFIG.MAX_ATTEMPTS - currentAttempts);
  }

  // Check if user is blocked
  static isUserBlocked(blockedUntil?: Date | null): boolean {
    if (!blockedUntil) return false;
    return new Date() < blockedUntil;
  }

  // Check if OTP is expired
  static isOTPExpired(expiryDate?: Date | null): boolean {
    if (!expiryDate) return true;
    return new Date() > expiryDate;
  }

  // Check if can resend OTP (cooldown check)
  static canResendOTP(lastSentAt?: Date | null): {
    canResend: boolean;
    waitTime?: number;
  } {
    if (!lastSentAt) return { canResend: true };

    const timeSinceLastOtp = Date.now() - lastSentAt.getTime();

    if (timeSinceLastOtp < OTP_CONFIG.RESEND_COOLDOWN) {
      const waitTime = Math.ceil(
        (OTP_CONFIG.RESEND_COOLDOWN - timeSinceLastOtp) / 1000,
      );
      return { canResend: false, waitTime };
    }

    return { canResend: true };
  }
}
