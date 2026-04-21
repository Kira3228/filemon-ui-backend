import { NextFunction, Request, RequestHandler, Response } from "express";

export type RouteHandler = (req: Request,
  res: Response,
  next: NextFunction) => unknown | Promise<unknown>;

export const asyncHandler = <T extends RouteHandler>(fn: T): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      Promise.resolve(fn(req, res, next)).catch(next);
    } catch (error) {
      next(error);
    }
  };
};
