import { Router } from "express";
import httpStatus from "http-status";
import { isAdmin } from "../../middleware/is_admin";
import { isAuth } from "../../middleware/is_auth";
import { isOrgAdmin } from "../../middleware/is_org_admin";
import { attachFileUrl, imageUpload } from "../../middleware/upload.middleware";
import validateRequest from "../../middleware/validate_request.middleware";
import catchAsync from "../../utils/catch_async.utils";
import sendResponse from "../../utils/send_response.utils";
import { IResponseStatus } from "../auth/auth.enum";
import { organizationService } from "./organization.service";
import { organizationValidation } from "./organization.validation";

const router = Router();

// Org Admin creates their (one and only) organization. Logo is optional
// here - send multipart/form-data with a "logo" file to set it now, or
// skip it and add it later via PATCH /my.
router.post(
  "/",
  isAuth,
  isOrgAdmin,
  imageUpload.single("logo"),
  attachFileUrl,
  validateRequest(organizationValidation.createOrganizationValidationSchema),
  catchAsync(async (req, res) => {
    const data = req.body;

    if (req.file) {
      data.logo = req.file.url;
    }

    const organization = await organizationService.createOrganization(
      req.user?.id as string,
      req.user?.role,
      data,
    );

    sendResponse(res, {
      success: IResponseStatus.SUCCESS,
      statusCode: httpStatus.CREATED,
      message: "Organization created successfully",
      data: organization,
    });
  }),
);

// Platform-wide listing stays Admin-only - an org admin only ever needs
// their own organization (see GET /my below).
router.get(
  "/",
  isAuth,
  isAdmin,
  catchAsync(async (req, res) => {
    const { meta, result } = await organizationService.getAllOrganizations(
      req.query,
    );

    sendResponse(res, {
      success: IResponseStatus.SUCCESS,
      statusCode: httpStatus.OK,
      message: "Organizations fetched successfully",
      meta: meta as unknown as Record<string, unknown>,
      data: result,
    });
  }),
);

router.get(
  "/my",
  isAuth,
  catchAsync(async (req, res) => {
    const userId = req.user?.id as string;
    const organization = await organizationService.getMyOrganization(userId);

    sendResponse(res, {
      success: IResponseStatus.SUCCESS,
      statusCode: httpStatus.OK,
      message: "Organization info fetched successfully",
      data: organization,
    });
  }),
);

// Admin-only: a specific tenant org by id (platform support/oversight).
// An org admin never needs this - they always use /my.
router.get(
  "/:id",
  isAuth,
  isAdmin,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const organization = await organizationService.getOrganizationById(id);

    sendResponse(res, {
      success: IResponseStatus.SUCCESS,
      statusCode: httpStatus.OK,
      message: "Organization info fetched successfully",
      data: organization,
    });
  }),
);

// Org admin updates their own organization - no id needed, resolved
// from the token.
router.patch(
  "/my",
  isAuth,
  isOrgAdmin,
  imageUpload.single("logo"),
  attachFileUrl,
  validateRequest(organizationValidation.updateOrganizationValidationSchema),
  catchAsync(async (req, res) => {
    const userId = req.user?.id as string;
    const data = req.body;

    if (req.file) {
      data.logo = req.file.url;
    }

    const organization = await organizationService.updateMyOrganization(
      userId,
      data,
    );

    sendResponse(res, {
      success: IResponseStatus.SUCCESS,
      statusCode: httpStatus.OK,
      message: "Organization updated successfully",
      data: organization,
    });
  }),
);

// Admin-only: edit any tenant org by id (support/override use case).
router.patch(
  "/:id",
  isAuth,
  isAdmin,
  imageUpload.single("logo"),
  attachFileUrl,
  validateRequest(organizationValidation.updateOrganizationValidationSchema),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const data = req.body;

    if (req.file) {
      data.logo = req.file.url;
    }

    const organization = await organizationService.updateOrganization(
      id,
      data,
      req.user?.id as string,
      req.user?.role,
    );

    sendResponse(res, {
      success: IResponseStatus.SUCCESS,
      statusCode: httpStatus.OK,
      message: "Organization updated successfully",
      data: organization,
    });
  }),
);

// Org admin deletes their own organization - no id needed.
router.delete(
  "/my",
  isAuth,
  isOrgAdmin,
  catchAsync(async (req, res) => {
    const userId = req.user?.id as string;
    await organizationService.deleteMyOrganization(userId);

    sendResponse(res, {
      success: IResponseStatus.SUCCESS,
      statusCode: httpStatus.OK,
      message: "Organization deleted successfully",
      data: null,
    });
  }),
);

// Admin-only: delete any tenant org by id.
router.delete(
  "/:id",
  isAuth,
  isAdmin,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    await organizationService.deleteOrganization(
      id,
      req.user?.id as string,
      req.user?.role,
    );

    sendResponse(res, {
      success: IResponseStatus.SUCCESS,
      statusCode: httpStatus.OK,
      message: "Organization deleted successfully",
      data: null,
    });
  }),
);

export const organizationRoute = router;
