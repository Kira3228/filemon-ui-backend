import { NextFunction, Request, Response } from "express";
import { HttpErrorResponseBody, toHttpErrorResponse } from "../errors/http-errors";

export const errorHandler = (err: unknown, _req: Request, res: Response<HttpErrorResponseBody>, _next: NextFunction) => {
  const payload = toHttpErrorResponse(err);

  if (payload.status >= 500) {
    console.error("Unhandled request error:", err);
  }

  return res.status(payload.status).json(payload);
};
