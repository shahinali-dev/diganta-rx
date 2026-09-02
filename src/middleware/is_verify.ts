/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import jwt from "jsonwebtoken";
import config from "../config";
import { AppError } from "../errors/app_error";
import { IJWTPayload } from "../modules/auth/auth.interface";

export const isVerify = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let verifyToken = req.cookies?.verifyToken;

  if (!verifyToken && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith("Bearer ")) {
      verifyToken = authHeader.split(" ")[1];
    }
  }

  if (!verifyToken) {
    return next(
      new AppError(httpStatus.UNAUTHORIZED, "Verification token is missing"),
    );
  }

  try {
    const decoded = jwt.verify(
      verifyToken,
      config.JWT_VERIFY_SECRET,
    ) as unknown as IJWTPayload;

    (req as any).user = decoded;
    next();
  } catch (err) {
    return next(
      new AppError(
        httpStatus.UNAUTHORIZED,
        "Invalid or expired verification token",
      ),
    );
  }
};
