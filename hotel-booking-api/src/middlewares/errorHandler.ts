import { Request, Response, NextFunction } from "express";

interface CustomError extends Error {
  statusCode?: number;
  errors?: any[];
}

const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  console.error(err);

  if (err.name === "CastError") {
    const message = "Resource not found";
    error = { ...error, statusCode: 404, message };
  }

  if (err.name === "SequelizeUniqueConstraintError") {
    const message = "Duplicate field value entered";
    error = { ...error, statusCode: 400, message };
  }

  if (err.name === "SequelizeValidationError") {
    const message = "Validation error";
    error = { ...error, statusCode: 400, message };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
export default errorHandler;
