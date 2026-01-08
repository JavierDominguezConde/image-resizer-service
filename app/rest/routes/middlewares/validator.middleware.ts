import type { RequestHandler } from "express";
import { validate } from "../../../core/validator/schema.validator.ts";

export const validateMiddleware = (field: 'body' | 'params', schema: string) => {
  return ((req, _res, next) => {
    try {
      req[field] = validate(req[field], schema);
      next();
    } catch (err) {
      next(err);
    }
  }) as RequestHandler;
};
