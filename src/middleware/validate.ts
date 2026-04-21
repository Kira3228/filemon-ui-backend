import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { ContextRunner } from "express-validator/src/chain";
import { ValidationError } from "../errors/http-errors";

export function validate(rules: ContextRunner[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(rules.map((rule) => rule.run(req)));
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return next(new ValidationError("Validation failed", {
      errors: errors.array().map((error) => ({
        field: error.param,
        message: error.msg,
        value: error.value,
        location: error.location,
      })),
    }));
  };
}
