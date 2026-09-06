import { Response } from "express";
import { IResponseStatus } from "../modules/auth/auth.enum";

type TSendResponse<T> = {
  success: IResponseStatus;
  statusCode: number;
  message: string;
  meta?: Record<string, unknown>;
  data: T;
};

const sendResponse = <T>(res: Response, data: TSendResponse<T>) => {
  return res.status(data.statusCode).json({
    success: data.success,
    statusCode: data.statusCode,
    message: data.message,
    meta: data.meta,
    data: data.data,
  });
};

export default sendResponse;
