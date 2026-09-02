import { Prisma } from "@prisma/client";
import httpStatus from "http-status";
import { TErrorMessage, TGenericErrorResponse } from "../interface/error";

// Handles Prisma.PrismaClientKnownRequestError (thrown by @prisma/client on
// constraint violations etc). Mirrors the role that handle_cast_error /
// handle_duplicate_key_error / handle_validation_error played for Mongoose.
const handlePrismaKnownRequestError = (
  err: Prisma.PrismaClientKnownRequestError
): TGenericErrorResponse => {
  switch (err.code) {
    case "P2002": {
      // Unique constraint failed
      const target = (err.meta?.target as string[] | undefined)?.join(", ");
      const errorMessages: TErrorMessage = [
        {
          path: target || "",
          message: `${target || "Field"} already exists`,
        },
      ];
      return {
        statusCode: httpStatus.BAD_REQUEST,
        message: "Duplicate key error",
        errorMessages,
      };
    }

    case "P2025": {
      // Record not found (e.g. update/delete on missing row, or missing relation)
      const errorMessages: TErrorMessage = [
        {
          path: "",
          message: (err.meta?.cause as string) || "Record not found",
        },
      ];
      return {
        statusCode: httpStatus.NOT_FOUND,
        message: "Not found",
        errorMessages,
      };
    }

    case "P2003": {
      // Foreign key constraint failed
      const field = err.meta?.field_name as string | undefined;
      const errorMessages: TErrorMessage = [
        {
          path: field || "",
          message: `Invalid reference${field ? ` for ${field}` : ""}`,
        },
      ];
      return {
        statusCode: httpStatus.BAD_REQUEST,
        message: "Invalid reference",
        errorMessages,
      };
    }

    default: {
      const errorMessages: TErrorMessage = [
        {
          path: "",
          message: err.message,
        },
      ];
      return {
        statusCode: httpStatus.BAD_REQUEST,
        message: "Database error",
        errorMessages,
      };
    }
  }
};

// Handles Prisma.PrismaClientValidationError (malformed query args reaching
// the Prisma Client - equivalent role to Mongoose's ValidationError, though
// with Zod validating req.body upstream this should rarely fire in practice).
const handlePrismaValidationError = (
  err: Prisma.PrismaClientValidationError
): TGenericErrorResponse => {
  const errorMessages: TErrorMessage = [
    {
      path: "",
      message: "Invalid data passed to the database query",
    },
  ];
  return {
    statusCode: httpStatus.BAD_REQUEST,
    message: "Validation error",
    errorMessages,
  };
};

export { handlePrismaKnownRequestError, handlePrismaValidationError };
