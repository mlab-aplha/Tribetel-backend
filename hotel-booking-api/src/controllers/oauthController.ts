import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import { generateToken, generateRefreshToken } from "../utils/tokenUtils";

export const googleCallback = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user!;

    await user.update({ last_login: new Date() });

    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?token=${token}&refreshToken=${refreshToken}`
    );
  }
);

export const facebookCallback = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user!;

    await user.update({ last_login: new Date() });

    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?token=${token}&refreshToken=${refreshToken}`
    );
  }
);
