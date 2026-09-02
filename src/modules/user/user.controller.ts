import { Router } from "express";
import httpStatus from "http-status";
import { isAdmin } from "../../middleware/is_admin";
import { isAuth } from "../../middleware/is_auth";
import validateRequest from "../../middleware/validate_request.middleware";
import catchAsync from "../../utils/catch_async.utils";
import sendResponse from "../../utils/send_response.utils";
import { IResponseStatus } from "../auth/auth.enum";
import { userService } from "./user.service";
import { userValidation } from "./user.validation";

const router = Router();

router.post(
  "/register",
  validateRequest(userValidation.baseUserValidationSchema),
  catchAsync(async (req, res) => {
    const userData = req.body;

    const user = await userService.registerUser(userData);

    const clientType = req.headers["x-client-type"];

    if (clientType === "web") {
      res.cookie("verifyToken", user.verifyToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        domain: ".digantarx.com",
        maxAge: 1 * 24 * 60 * 60 * 1000,
      });
    }

    sendResponse(res, {
      success: IResponseStatus.SUCCESS,
      statusCode: httpStatus.CREATED,
      message: "User registered successfully",
      data: user,
    });
  }),
);

router.get(
  "/users",
  isAuth,
  isAdmin,
  catchAsync(async (req, res) => {
    const { meta, result } = await userService.getAllUsers(req.query);

    sendResponse(res, {
      success: IResponseStatus.SUCCESS,
      statusCode: httpStatus.OK,
      meta,
      data: result,
    });
  }),
);

router.patch(
  "/migrate/:id",
  isAuth,
  isAdmin,
  validateRequest(userValidation.migrateRoleValidationSchema),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    const user = await userService.migrateUserRoles(id, role);

    sendResponse(res, {
      success: IResponseStatus.SUCCESS,
      statusCode: httpStatus.OK,
      message: "User role updated successfully",
      data: user,
    });
  }),
);

router.get(
  "/:id",
  isAuth,
  isAdmin,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const user = await userService.getUserById(id);

    sendResponse(res, {
      success: IResponseStatus.SUCCESS,
      statusCode: httpStatus.OK,
      data: user,
    });
  }),
);

export const userRoute = router;
