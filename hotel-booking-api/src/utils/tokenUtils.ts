import jwt from "jsonwebtoken";
import { Response } from "express";
import { User } from "../models";
import { JwtPayload, TokenResponse } from "../types";

export const generateToken = (
  id: string,
  expiresIn: string = process.env.JWT_EXPIRE || "7d"
): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn,
  });
};

export const generateRefreshToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || "30d",
  });
};

export const verifyRefreshToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as JwtPayload;
  } catch (error) {
    return null;
  }
};

export const sendTokenResponse = (
  user: User,
  statusCode: number,
  res: Response
): void => {
  const token = generateToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  res.status(statusCode).json({
    success: true,
    token,
    refreshToken,
    user,
  });
};
