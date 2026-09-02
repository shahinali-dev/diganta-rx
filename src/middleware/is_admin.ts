import { Role } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../errors/app_error";

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  if (user && user.role === Role.ADMIN) {
    return next();
  }
  throw new AppError(
    httpStatus.FORBIDDEN,
    "You are not authorized to access this route"
  );
};
