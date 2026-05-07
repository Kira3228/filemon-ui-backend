import { Request, Response } from "express";
import { HttpErrorResponseBody, toHttpErrorResponse } from "../errors/http-errors";
import { ApiErrorResponse } from "../contracts/api-contracts";

export const errorHandler = (err: unknown, _req: Request, res: Response<HttpErrorResponseBody>,): Response<ApiErrorResponse, Record<string, unknown>> => {
  const payload = toHttpErrorResponse(err);

  if (payload.status >= 500) {
    console.error("Unhandled request error:", err);
  }

  return res.status(payload.status).json(payload);
};
