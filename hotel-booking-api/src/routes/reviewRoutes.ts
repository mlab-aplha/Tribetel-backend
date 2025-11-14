import express from "express";
import {
  createReview,
  getHotelReviews,
  getReview,
  updateReview,
  deleteReview,
} from "../controllers/reviewController";
import { protect } from "../middlewares/auth";
import { validate } from "../middlewares/validation";
import { createReviewValidator } from "../validators/reviewValidator";

const router = express.Router();

router.post("/", protect, createReviewValidator, validate, createReview);
router.get("/hotel/:hotelId", getHotelReviews);
router.get("/:id", getReview);
router.put("/:id", protect, updateReview);
router.delete("/:id", protect, deleteReview);

export default router;
