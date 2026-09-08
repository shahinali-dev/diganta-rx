/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import jwt from "jsonwebtoken";
import config from "../config";
import { AppError } from "../errors/app_error";
import { IJWTPayload } from "../modules/auth/auth.interface";

export const isAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let accessToken = req.cookies?.accessToken;

  if (!accessToken && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith("Bearer ")) {
      accessToken = authHeader.split(" ")[1];
    }
  }

  if (!accessToken) {
    return next(
      new AppError(httpStatus.UNAUTHORIZED, "Authentication token is missing"),
    );
  }

  try {
    const decoded = jwt.verify(
      accessToken,
      config.JWT_ACCESS_SECRET,
    ) as IJWTPayload;

    (req as any).user = decoded;

    next();
  } catch (err) {
    return next(
      new AppError(httpStatus.UNAUTHORIZED, "Invalid or expired token"),
    );
  }
};
