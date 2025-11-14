import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import { User } from "../models";
import { sendTokenResponse } from "../utils/tokenUtils";

interface RegisterBody {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
}

export const register = asyncHandler(
  async (req: Request<{}, {}, RegisterBody>, res: Response): Promise<void> => {
    const { email, password, first_name, last_name, phone_number } = req.body;

    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "User already exists",
      });
      return;
    }

    const user = await User.create({
      email,
      password,
      first_name,
      last_name,
      phone_number,
    });

    sendTokenResponse(user, 201, res);
  }
);
