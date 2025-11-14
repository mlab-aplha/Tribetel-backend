import { Request, Response } from "express";
import { Op } from "sequelize";
import asyncHandler from "../utils/asyncHandler";
import { Review, Hotel, User, Booking, Room } from "../models";
import { getPagination, formatPaginationResponse } from "../utils/helpers";
import {
  CreateReviewRequest,
  UpdateReviewRequest,
  ReviewQuery,
} from "../types";

export const createReview = asyncHandler(
  async (
    req: Request<{}, {}, CreateReviewRequest>,
    res: Response
  ): Promise<void> => {
    const {
      hotel_id,
      rating,
      title,
      comment,
      cleanliness_rating,
      service_rating,
      location_rating,
      value_rating,
    } = req.body;

    const hotel = await Hotel.findByPk(hotel_id);

    if (!hotel) {
      res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
      return;
    }

    const booking = await Booking.findOne({
      where: {
        user_id: req.user!.id,
        status: "checked_out",
      },
      include: [
        {
          model: Room,
          as: "room",
          where: { hotel_id },
        },
      ],
    });

    if (!booking) {
      res.status(400).json({
        success: false,
        message: "You can only review hotels you have stayed at",
      });
      return;
    }

    const existingReview = await Review.findOne({
      where: {
        user_id: req.user!.id,
        hotel_id,
      },
    });

    if (existingReview) {
      res.status(400).json({
        success: false,
        message: "You have already reviewed this hotel",
      });
      return;
    }

    const review = await Review.create({
      user_id: req.user!.id,
      hotel_id,
      rating,
      title,
      comment,
      cleanliness_rating,
      service_rating,
      location_rating,
      value_rating,
      is_verified: true,
    });

    await updateHotelRating(hotel_id);

    const completeReview = await Review.findByPk(review.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "first_name", "last_name", "profile_picture"],
        },
      ],
    });

    res.status(201).json({
      success: true,
      data: completeReview,
    });
  }
);

export const getHotelReviews = asyncHandler(
  async (
    req: Request<{ hotelId: string }, {}, {}, ReviewQuery>,
    res: Response
  ): Promise<void> => {
    const { hotelId } = req.params;
    const { page = "1", limit = "10", sort = "recent" } = req.query;

    const { limit: limitNum, offset } = getPagination(
      parseInt(page),
      parseInt(limit)
    );

    let order: any;
    switch (sort) {
      case "highest":
        order = [["rating", "DESC"]];
        break;
      case "lowest":
        order = [["rating", "ASC"]];
        break;
      case "recent":
      default:
        order = [["created_at", "DESC"]];
        break;
    }

    const { count, rows } = await Review.findAndCountAll({
      where: { hotel_id: hotelId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "first_name", "last_name", "profile_picture"],
        },
      ],
      limit: limitNum,
      offset,
      order,
    });

    res.status(200).json({
      success: true,
      ...formatPaginationResponse(rows, parseInt(page), parseInt(limit), count),
    });
  }
);

export const getReview = asyncHandler(
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const review = await Review.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "first_name", "last_name", "profile_picture"],
        },
        {
          model: Hotel,
          as: "hotel",
          attributes: ["id", "name", "city", "country"],
        },
      ],
    });

    if (!review) {
      res.status(404).json({
        success: false,
        message: "Review not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: review,
    });
  }
);

export const updateReview = asyncHandler(
  async (
    req: Request<{ id: string }, {}, UpdateReviewRequest>,
    res: Response
  ): Promise<void> => {
    let review = await Review.findByPk(req.params.id);

    if (!review) {
      res.status(404).json({
        success: false,
        message: "Review not found",
      });
      return;
    }

    if (review.user_id !== req.user!.id) {
      res.status(403).json({
        success: false,
        message: "Not authorized to update this review",
      });
      return;
    }

    review = await review.update(req.body);

    await updateHotelRating(review.hotel_id);

    res.status(200).json({
      success: true,
      data: review,
    });
  }
);

export const deleteReview = asyncHandler(
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const review = await Review.findByPk(req.params.id);

    if (!review) {
      res.status(404).json({
        success: false,
        message: "Review not found",
      });
      return;
    }

    if (review.user_id !== req.user!.id && req.user!.role !== "admin") {
      res.status(403).json({
        success: false,
        message: "Not authorized to delete this review",
      });
      return;
    }

    const hotelId = review.hotel_id;
    await review.destroy();

    await updateHotelRating(hotelId);

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  }
);

async function updateHotelRating(hotelId: string): Promise<void> {
  const reviews = await Review.findAll({
    where: { hotel_id: hotelId },
    attributes: ["rating"],
  });

  if (reviews.length === 0) {
    await Hotel.update(
      { average_rating: 0, total_reviews: 0 },
      { where: { id: hotelId } }
    );
    return;
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = (totalRating / reviews.length).toFixed(2);

  await Hotel.update(
    {
      average_rating: parseFloat(averageRating),
      total_reviews: reviews.length,
    },
    { where: { id: hotelId } }
  );
}
