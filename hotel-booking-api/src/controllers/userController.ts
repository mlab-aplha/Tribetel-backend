import { Request, Response } from "express";
import { Op } from "sequelize";
import asyncHandler from "../utils/asyncHandler";
import { User, Booking, Review, Room, Hotel, HotelImage } from "../models";
import { getPagination, formatPaginationResponse } from "../utils/helpers";
import * as cloudinaryService from "../services/cloudinaryService";
import { UpdateProfileRequest, UserSearchQuery } from "../types";

export const getProfile = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = await User.findByPk(req.user!.id, {
      attributes: { exclude: ["password"] },
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  }
);

export const updateProfile = asyncHandler(
  async (
    req: Request<{}, {}, UpdateProfileRequest>,
    res: Response
  ): Promise<void> => {
    const fieldsToUpdate: UpdateProfileRequest = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      phone_number: req.body.phone_number,
    };

    Object.keys(fieldsToUpdate).forEach(
      (key) =>
        fieldsToUpdate[key as keyof UpdateProfileRequest] === undefined &&
        delete fieldsToUpdate[key as keyof UpdateProfileRequest]
    );

    const user = await User.findByPk(req.user!.id);
    await user!.update(fieldsToUpdate);

    res.status(200).json({
      success: true,
      data: user,
    });
  }
);

export const uploadProfilePicture = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "Please upload an image",
      });
      return;
    }

    const user = await User.findByPk(req.user!.id);

    if (user!.profile_picture && user!.profile_picture.includes("cloudinary")) {
      const urlParts = user!.profile_picture.split("/");
      const publicIdWithExt = urlParts[urlParts.length - 1];
      const publicId = `hotel-booking/profiles/${publicIdWithExt.split(".")[0]}`;

      try {
        await cloudinaryService.deleteImage(publicId);
      } catch (error) {
        console.error("Error deleting old profile picture:", error);
      }
    }

    const uploadResult = await cloudinaryService.uploadImage(
      req.file.buffer,
      "profiles"
    );

    await user!.update({ profile_picture: uploadResult.url });

    res.status(200).json({
      success: true,
      data: {
        profile_picture: uploadResult.url,
      },
    });
  }
);

export const getDashboard = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;

    const totalBookings = await Booking.count({
      where: { user_id: userId },
    });

    const upcomingBookings = await Booking.count({
      where: {
        user_id: userId,
        status: "confirmed",
        check_in_date: {
          [Op.gte]: new Date(),
        },
      },
    });

    const completedBookings = await Booking.count({
      where: {
        user_id: userId,
        status: "checked_out",
      },
    });

    const totalReviews = await Review.count({
      where: { user_id: userId },
    });

    const recentBookings = await Booking.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Room,
          as: "room",
          include: [
            {
              model: Hotel,
              as: "hotel",
              include: [
                {
                  model: HotelImage,
                  as: "images",
                  where: { is_primary: true },
                  required: false,
                  limit: 1,
                },
              ],
            },
          ],
        },
      ],
      limit: 5,
      order: [["created_at", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          total_bookings: totalBookings,
          upcoming_bookings: upcomingBookings,
          completed_bookings: completedBookings,
          total_reviews: totalReviews,
        },
        recent_bookings: recentBookings,
      },
    });
  }
);

export const getUsers = asyncHandler(
  async (
    req: Request<{}, {}, {}, UserSearchQuery>,
    res: Response
  ): Promise<void> => {
    const { page = "1", limit = "10", role, search } = req.query;

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where[Op.or] = [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { limit: limitNum, offset } = getPagination(
      parseInt(page),
      parseInt(limit)
    );

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ["password"] },
      limit: limitNum,
      offset,
      order: [["created_at", "DESC"]],
    });

    res.status(200).json({
      success: true,
      ...formatPaginationResponse(rows, parseInt(page), parseInt(limit), count),
    });
  }
);

export const getUser = asyncHandler(
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  }
);

export const updateUser = asyncHandler(
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    const fieldsToUpdate: any = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
      phone_number: req.body.phone_number,
      role: req.body.role,
      is_active: req.body.is_active,
    };

    Object.keys(fieldsToUpdate).forEach(
      (key) => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    await user.update(fieldsToUpdate);

    res.status(200).json({
      success: true,
      data: user,
    });
  }
);

export const deleteUser = asyncHandler(
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    if (user.id === req.user!.id) {
      res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
      return;
    }

    await user.destroy();

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  }
);
