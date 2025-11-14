import { Request, Response, NextFunction } from "express";
import {
  validationResult,
  ValidationError as ExpressValidationError,
} from "express-validator";
import { ValidationError } from "../types";

export const validate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors: ValidationError[] = errors
      .array()
      .map((err: ExpressValidationError) => ({
        field: err.type === "field" ? err.path : "unknown",
        message: err.msg,
      }));

    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: formattedErrors,
    });
    return;
  }

  next();
};
