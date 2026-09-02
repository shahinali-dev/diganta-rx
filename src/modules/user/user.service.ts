import httpStatus from "http-status";
import config from "../../config";
import { AppError } from "../../errors/app_error";
import prisma from "../../lib/prisma";
import createToken from "../../utils/create_token";
import { OTPUtils } from "../../utils/otp_utils";
import passwordUtils from "../../utils/password_utils";
import { EmailService } from "../email/email.service";
import { OTP_CONFIG } from "./user.enum";
import { IUser } from "./user.interface";

export const userSelectWithoutPassword = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatar: true,
  isVerified: true,
  provider: true,
  createdAt: true,
  updatedAt: true,
};

export class UserService {
  // Returns the full row (including password hash) - only for internal
  // use such as sign-in credential checks. Never send this to a client.
  async isExist(email: string) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    return existingUser;
  }

  async registerUser(userData: IUser) {
    const { password, ...user } = userData;

    if (!password) {
      throw new AppError(httpStatus.BAD_REQUEST, "Password is required");
    }

    const existingUser = await this.isExist(user.email);

    if (existingUser) {
      // Unverified user hole re-registration allow, notun OTP generate kore
      if (!existingUser.isVerified) {
        const otp = OTPUtils.generateSecureOTP();
        const hashedOTP = OTPUtils.hashOTP(otp);
        const otpExpiry = new Date(Date.now() + OTP_CONFIG.EXPIRY_DURATION);
        const hashedPassword = await passwordUtils.hash(password);

        const updatedUser = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            otp: hashedOTP,
            otpExpiry,
            otpAttempts: 0,
            lastOtpSentAt: new Date(),
            password: hashedPassword,
          },
          select: userSelectWithoutPassword,
        });

        const jwtPayload = {
          id: updatedUser.id,
          email: updatedUser.email,
        };

        const verifyToken = createToken(
          jwtPayload,
          config.JWT_VERIFY_SECRET,
          config.JWT_VERIFY_EXPIRE_IN,
        );

        await EmailService.sendOTPEmail(
          updatedUser.email,
          updatedUser.name,
          otp,
          true,
        );

        return {
          user: updatedUser,
          verifyToken,
        };
      }

      // Verified user already exists - user enumeration protect korar jonno generic message
      throw new AppError(
        httpStatus.CONFLICT,
        "An account with this email already exists. Please login instead.",
      );
    }

    const hashedPassword = await passwordUtils.hash(password);

    const otp = OTPUtils.generateSecureOTP();
    const hashedOTP = OTPUtils.hashOTP(otp);
    const otpExpiry = new Date(Date.now() + OTP_CONFIG.EXPIRY_DURATION);

    const newUser = await prisma.user.create({
      data: {
        ...user,
        password: hashedPassword,
        otp: hashedOTP,
        otpExpiry,
        isVerified: false,
        otpAttempts: 0,
        lastOtpSentAt: new Date(),
      },
      select: userSelectWithoutPassword,
    });

    const jwtPayload = {
      id: newUser.id,
      email: newUser.email,
    };

    const verifyToken = createToken(
      jwtPayload,
      config.JWT_VERIFY_SECRET,
      config.JWT_VERIFY_EXPIRE_IN,
    );

    await EmailService.sendOTPEmail(newUser.email, newUser.name, otp, false);

    return {
      user: newUser,
      verifyToken,
    };
  }

  async getAllUsers(query: Record<string, unknown>) {
    const userQuery = new QueryBuilder(prisma.user, query)
      .search(["name", "email"])
      .filter()
      .sort()
      .paginate()
      .select(userSelectWithoutPassword);

    const result = await userQuery.execute();
    const meta = await userQuery.countTotal();

    return { meta, result };
  }

  async migrateUserRoles(id: string, role: Role) {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: userSelectWithoutPassword,
    });

    return updatedUser;
  }

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: userSelectWithoutPassword,
    });

    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
    }

    return user;
  }

  async getUserForOtpVerification(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        isVerified: true,
        otp: true,
        otpExpiry: true,
        otpAttempts: true,
        otpBlockedUntil: true,
        lastOtpSentAt: true,
      },
    });
  }

  async getUserForPasswordReset(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        passwordResetOtp: true,
        passwordResetOtpExpiry: true,
        passwordResetAttempts: true,
        passwordResetBlockedUntil: true,
        lastPasswordResetOtpSentAt: true,
      },
    });
  }
}

export const userService = new UserService();
