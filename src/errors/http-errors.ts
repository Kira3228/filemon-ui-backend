import { ApiErrorResponse } from "../contracts/api-contracts";

export type HttpErrorResponseBody = ApiErrorResponse;

export class HttpError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = "Resource not found") {
    super(404, message, "NOT_FOUND");
  }
}

export class ValidationError extends HttpError {
  constructor(message = "Validation failed", details?: unknown) {
    super(400, message, "VALIDATION_ERROR", details);
  }
}

export const toHttpErrorResponse = (error: unknown): HttpErrorResponseBody => {
  if (error instanceof HttpError) {
    return {
      status: error.status,
      code: error.code || (error.status >= 500 ? "INTERNAL_ERROR" : "REQUEST_FAILED"),
      message: error.message,
      details: error.details,
    };
  }

  return {
    status: 500,
    code: "INTERNAL_ERROR",
    message: "Internal server error",
  };
};
