import httpStatus from "http-status";
import config from "../../config";
import { AppError } from "../../errors/app_error";
import prisma from "../../lib/prisma";
import createToken from "../../utils/create_token";
import { OTPUtils } from "../../utils/otp_utils";
import passwordUtils from "../../utils/password_utils";
import { EmailService } from "../email/email.service";
import { OTP_CONFIG, Provider } from "../user/user.enum";
import { ISignIn } from "../user/user.interface";
import { userService } from "../user/user.service";

export class AuthService {
  async signIn(payload: ISignIn) {
    const existingUser = await userService.isExist(payload.email);

    if (!existingUser) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid email or password");
    }

    if (existingUser.provider !== Provider.LOCAL && !existingUser.password) {
      const providerName =
        existingUser.provider === Provider.GOOGLE
          ? Provider.GOOGLE
          : Provider.FACEBOOK;

      throw new AppError(
        httpStatus.BAD_REQUEST,
        `This account uses ${providerName} sign-in. Please continue with ${providerName}.`,
      );
    }

    const isMatch = await passwordUtils.compare(
      payload.password as string,
      existingUser.password as string,
    );

    if (!isMatch) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid email or password");
    }

    // Unverified user - notun OTP pathiye dao
    if (!existingUser.isVerified) {
      const otp = OTPUtils.generateSecureOTP();
      const hashedOTP = OTPUtils.hashOTP(otp);

      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          otp: hashedOTP,
          otpExpiry: new Date(Date.now() + OTP_CONFIG.EXPIRY_DURATION),
          otpAttempts: 0,
          lastOtpSentAt: new Date(),
        },
      });

      const verifyToken = createToken(
        { id: existingUser.id, email: existingUser.email },
        config.JWT_VERIFY_SECRET,
        config.JWT_VERIFY_EXPIRE_IN,
      );

      await EmailService.sendOTPEmail(
        existingUser.email,
        existingUser.name,
        otp,
        true,
      );

      return {
        requiresVerification: true as const,
        verifyToken,
      };
    }

    const { password, ...rest } = existingUser;

    const jwtPayload = {
      id: rest.id,
      email: rest.email,
      role: rest.role,
      organizationId: rest.organizationId,
    };

    const accessToken = createToken(
      jwtPayload,
      config.JWT_ACCESS_SECRET,
      config.JWT_ACCESS_EXPIRE_IN,
    );

    const refreshToken = createToken(
      jwtPayload,
      config.JWT_REFRESH_SECRET,
      config.JWT_REFRESH_EXPIRE_IN,
    );

    return {
      requiresVerification: false as const,
      user: rest,
      accessToken,
      refreshToken,
    };
  }

  async getAuthUser(id: string) {
    return await userService.getUserById(id);
  }

  async verifyOTP(userId: string, email: string, inputOtp: string) {
    const user = await userService.getUserForOtpVerification(userId);

    if (!user) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Invalid verification request",
      );
    }

    if (user.email !== email) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Invalid verification request",
      );
    }

    // Already verified hole status leak na kore generic success
    if (user.isVerified) {
      return {
        message: "Verification successful",
        data: {
          email: user.email,
          isVerified: true,
        },
      };
    }

    // Blocked kina check
    if (OTPUtils.isUserBlocked(user.otpBlockedUntil)) {
      const remainingTime = Math.ceil(
        (user.otpBlockedUntil!.getTime() - Date.now()) / 60000,
      );
      throw new AppError(
        httpStatus.FORBIDDEN,
        `Too many failed attempts. Try again after ${remainingTime} minutes`,
      );
    }

    if (!user.otp) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "No OTP found. Please request a new one",
      );
    }

    if (OTPUtils.isOTPExpired(user.otpExpiry)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "OTP has expired. Please request a new one",
      );
    }

    const isValid = OTPUtils.verifyOTPSafely(user.otp, inputOtp);

    if (!isValid) {
      const newAttempts = (user.otpAttempts || 0) + 1;

      if (newAttempts >= OTP_CONFIG.MAX_ATTEMPTS) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            otpAttempts: newAttempts,
            otpBlockedUntil: new Date(Date.now() + OTP_CONFIG.BLOCK_DURATION),
            otp: null,
            otpExpiry: null,
          },
        });

        throw new AppError(
          httpStatus.FORBIDDEN,
          "Too many failed attempts. Account blocked for 30 minutes",
        );
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { otpAttempts: newAttempts },
      });

      const remainingAttempts = OTPUtils.getRemainingAttempts(newAttempts);
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Invalid OTP. ${remainingAttempts} attempt${
          remainingAttempts !== 1 ? "s" : ""
        } remaining`,
      );
    }

    // OTP thik - verify kore sob OTP data clear
    const verifiedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        otp: null,
        otpExpiry: null,
        otpAttempts: 0,
        otpBlockedUntil: null,
      },
    });

    return {
      message: "Email verified successfully",
      data: {
        email: verifiedUser.email,
        isVerified: verifiedUser.isVerified,
      },
    };
  }

  async resendOTP(userId: string, email: string) {
    const user = await userService.getUserForOtpVerification(userId);

    if (!user) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid request");
    }

    if (user.email !== email) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Invalid request");
    }

    // Verification status leak na kore generic success
    if (user.isVerified) {
      return {
        message: "OTP sent successfully",
        data: { email: user.email },
      };
    }

    // Blocked kina check
    if (OTPUtils.isUserBlocked(user.otpBlockedUntil)) {
      const remainingTime = Math.ceil(
        (user.otpBlockedUntil!.getTime() - Date.now()) / 60000,
      );
      throw new AppError(
        httpStatus.FORBIDDEN,
        `Account temporarily blocked. Try again after ${remainingTime} minutes`,
      );
    }

    // Cooldown check
    const { canResend, waitTime } = OTPUtils.canResendOTP(user.lastOtpSentAt);
    if (!canResend) {
      throw new AppError(
        httpStatus.TOO_MANY_REQUESTS,
        `Please wait ${waitTime} seconds before requesting another OTP`,
      );
    }

    const otp = OTPUtils.generateSecureOTP();
    const hashedOTP = OTPUtils.hashOTP(otp);
    const otpExpiry = new Date(Date.now() + OTP_CONFIG.EXPIRY_DURATION);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp: hashedOTP,
        otpExpiry,
        otpAttempts: 0,
        lastOtpSentAt: new Date(),
      },
    });

    await EmailService.sendOTPEmail(user.email, user.name, otp, true);

    return {
      message: "OTP sent successfully",
      data: { email: user.email },
    };
  }

  // Forgot Password - OTP email e pathao
  async forgotPassword(email: string) {
    const user = await userService.isExist(email);

    if (!user) {
      // User enumeration protect - generic message
      return {
        message: "If an account with this email exists, an OTP will be sent",
        data: { email },
      };
    }

    if (OTPUtils.isUserBlocked(user.passwordResetBlockedUntil)) {
      const remainingTime = Math.ceil(
        (user.passwordResetBlockedUntil!.getTime() - Date.now()) / 60000,
      );
      throw new AppError(
        httpStatus.FORBIDDEN,
        `Account temporarily blocked. Try again after ${remainingTime} minutes`,
      );
    }

    const { canResend, waitTime } = OTPUtils.canResendOTP(
      user.lastPasswordResetOtpSentAt,
    );
    if (!canResend) {
      throw new AppError(
        httpStatus.TOO_MANY_REQUESTS,
        `Please wait ${waitTime} seconds before requesting another OTP`,
      );
    }

    const otp = OTPUtils.generateSecureOTP();
    const hashedOTP = OTPUtils.hashOTP(otp);
    const otpExpiry = new Date(Date.now() + OTP_CONFIG.EXPIRY_DURATION);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetOtp: hashedOTP,
        passwordResetOtpExpiry: otpExpiry,
        passwordResetAttempts: 0,
        lastPasswordResetOtpSentAt: new Date(),
      },
    });

    await EmailService.sendPasswordResetOTPEmail(user.email, user.name, otp);

    return {
      message: "If an account with this email exists, an OTP will be sent",
      data: { email },
    };
  }

  // Reset Password - OTP verify kore password update
  async resetPassword(email: string, otp: string, newPassword: string) {
    const user = await userService.isExist(email);
    if (!user) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid reset request");
    }

    const userWithOTP = await userService.getUserForPasswordReset(user.id);
    if (!userWithOTP) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid reset request");
    }

    if (OTPUtils.isUserBlocked(userWithOTP.passwordResetBlockedUntil)) {
      const remainingTime = Math.ceil(
        (userWithOTP.passwordResetBlockedUntil!.getTime() - Date.now()) / 60000,
      );
      throw new AppError(
        httpStatus.FORBIDDEN,
        `Too many failed attempts. Try again after ${remainingTime} minutes`,
      );
    }

    if (!userWithOTP.passwordResetOtp) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "No OTP found. Please request a new one",
      );
    }

    if (OTPUtils.isOTPExpired(userWithOTP.passwordResetOtpExpiry)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "OTP has expired. Please request a new one",
      );
    }

    const isValid = OTPUtils.verifyOTPSafely(userWithOTP.passwordResetOtp, otp);

    if (!isValid) {
      const newAttempts = (userWithOTP.passwordResetAttempts || 0) + 1;

      if (newAttempts >= OTP_CONFIG.MAX_ATTEMPTS) {
        await prisma.user.update({
          where: { id: userWithOTP.id },
          data: {
            passwordResetAttempts: newAttempts,
            passwordResetBlockedUntil: new Date(
              Date.now() + OTP_CONFIG.BLOCK_DURATION,
            ),
            passwordResetOtp: null,
            passwordResetOtpExpiry: null,
          },
        });

        throw new AppError(
          httpStatus.FORBIDDEN,
          "Too many failed attempts. Account blocked for 30 minutes",
        );
      }

      await prisma.user.update({
        where: { id: userWithOTP.id },
        data: { passwordResetAttempts: newAttempts },
      });

      const remainingAttempts = OTPUtils.getRemainingAttempts(newAttempts);
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Invalid OTP. ${remainingAttempts} attempt${
          remainingAttempts !== 1 ? "s" : ""
        } remaining`,
      );
    }

    // OTP thik - password hash kore update, OTP data clear
    const hashedPassword = await passwordUtils.hash(newPassword);

    const updatedUser = await prisma.user.update({
      where: { id: userWithOTP.id },
      data: {
        password: hashedPassword,
        passwordResetOtp: null,
        passwordResetOtpExpiry: null,
        passwordResetAttempts: 0,
        passwordResetBlockedUntil: null,
      },
    });

    return {
      message: "Password reset successfully",
      data: { email: updatedUser.email },
    };
  }
}

export const authService = new AuthService();
