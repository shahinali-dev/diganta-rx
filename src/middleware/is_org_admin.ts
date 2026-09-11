import { Role } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../errors/app_error";

// Gate for Org Admin (and platform Admin) only routes. An ORG_ADMIN has
// full control over their own organization — managing members, roles/
// permissions, and any org-scoped resource. Platform ADMIN always passes
// through too, since it has system-wide oversight.
//
// NOTE: this only checks the *role*. It does not know which organization
// a specific resource belongs to, so per-resource ownership (an ORG_ADMIN
// can only touch *their own* organization, not someone else's) is
// enforced separately in the service layer, e.g. see
// `assertOrganizationOwnership` in organization.service.ts.
export const isOrgAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const user = req.user;

  if (user && (user.role === Role.ORG_ADMIN || user.role === Role.ADMIN)) {
    return next();
  }

  throw new AppError(
    httpStatus.FORBIDDEN,
    "You are not authorized to access this route",
  );
};
