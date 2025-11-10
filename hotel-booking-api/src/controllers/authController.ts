import { Request, Response } from "express";
import crypto from "crypto";
import { Op } from "sequelize";
import asyncHandler from "../utils/asyncHandler";
import { User } from "../models";
import { generateRandomToken } from "../utils/helpers";
import { sendTokenResponse } from "../utils/tokenUtils";
import { sendEmail, emailTemplates } from "../utils/emailService";
import {
  RegisterRequest,
  LoginRequest,
  UpdatePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from "../types";

export const register = asyncHandler(
  async (
    req: Request<{}, {}, RegisterRequest>,
    res: Response
  ): Promise<void> => {
    const { email, password, first_name, last_name, phone_number } = req.body;

    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
      return;
    }

    const verificationToken = generateRandomToken();

    const user = await User.create({
      email,
      password,
      first_name,
      last_name,
      phone_number,
      verification_token: crypto
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex"),
    });

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: "Email Verification",
        html: emailTemplates.verification(user.first_name, verificationUrl),
      });
    } catch (error) {
      console.error("Email send error:", error);
    }

    sendTokenResponse(user, 201, res);
  }
);

export const login = asyncHandler(
  async (req: Request<{}, {}, LoginRequest>, res: Response): Promise<void> => {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }

    if (!user.is_active) {
      res.status(401).json({
        success: false,
        message: "Account has been deactivated. Please contact support.",
      });
      return;
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }

    await user.update({ last_login: new Date() });

    sendTokenResponse(user, 200, res);
  }
);

export const getMe = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    res.status(200).json({
      success: true,
      data: req.user,
    });
  }
);

export const updateDetails = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const fieldsToUpdate: Partial<{
      first_name: string;
      last_name: string;
      phone_number: string;
    }> = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      phone_number: req.body.phone_number,
    };

    Object.keys(fieldsToUpdate).forEach(
      (key) =>
        fieldsToUpdate[key as keyof typeof fieldsToUpdate] === undefined &&
        delete fieldsToUpdate[key as keyof typeof fieldsToUpdate]
    );

    const user = await User.findByPk(req.user!.id);
    await user!.update(fieldsToUpdate);

    res.status(200).json({
      success: true,
      data: user,
    });
  }
);

export const updatePassword = asyncHandler(
  async (
    req: Request<{}, {}, UpdatePasswordRequest>,
    res: Response
  ): Promise<void> => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: "Please provide current and new password",
      });
      return;
    }

    const user = await User.findByPk(req.user!.id);

    const isPasswordValid = await user!.comparePassword(currentPassword);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
      return;
    }

    user!.password = newPassword;
    await user!.save();

    sendTokenResponse(user!, 200, res);
  }
);

export const forgotPassword = asyncHandler(
  async (
    req: Request<{}, {}, ForgotPasswordRequest>,
    res: Response
  ): Promise<void> => {
    const user = await User.findOne({ where: { email: req.body.email } });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "No user found with that email",
      });
      return;
    }

    const resetToken = generateRandomToken();

    user.reset_password_token = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.reset_password_expire = new Date(Date.now() + 60 * 60 * 1000);

    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: "Password Reset Request",
        html: emailTemplates.resetPassword(user.first_name, resetUrl),
      });

      res.status(200).json({
        success: true,
        message: "Password reset email sent",
      });
    } catch (error) {
      console.error("Email send error:", error);
      user.reset_password_token = null;
      user.reset_password_expire = null;
      await user.save();

      res.status(500).json({
        success: false,
        message: "Email could not be sent",
      });
    }
  }
);

export const resetPassword = asyncHandler(
  async (
    req: Request<{ resettoken: string }, {}, ResetPasswordRequest>,
    res: Response
  ): Promise<void> => {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.resettoken)
      .digest("hex");

    const user = await User.findOne({
      where: {
        reset_password_token: resetPasswordToken,
        reset_password_expire: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
      return;
    }

    user.password = req.body.password;
    user.reset_password_token = null;
    user.reset_password_expire = null;
    await user.save();

    sendTokenResponse(user, 200, res);
  }
);

export const verifyEmail = asyncHandler(
  async (req: Request<{ token: string }>, res: Response): Promise<void> => {
    const verificationToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      where: { verification_token: verificationToken },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Invalid verification token",
      });
      return;
    }

    user.email_verified = true;
    user.verification_token = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  }
);

export const logout = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  }
);
