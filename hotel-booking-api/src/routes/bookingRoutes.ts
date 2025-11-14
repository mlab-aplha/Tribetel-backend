import express from "express";
import {
  createBooking,
  getMyBookings,
  getBooking,
  updateBookingStatus,
  cancelBooking,
  getAllBookings,
} from "../controllers/bookingController";
import { protect, authorize } from "../middlewares/auth";
import { validate } from "../middlewares/validation";
import { createBookingValidator } from "../validators/bookingValidator";
import { paymentLimiter } from "../middlewares/rateLimiter";

const router = express.Router();

router.post(
  "/",
  protect,
  paymentLimiter,
  createBookingValidator,
  validate,
  createBooking
);
router.get("/my-bookings", protect, getMyBookings);
router.get("/:id", protect, getBooking);
router.put("/:id/cancel", protect, cancelBooking);

router.get("/", protect, authorize("admin"), getAllBookings);
router.put("/:id/status", protect, authorize("admin"), updateBookingStatus);

export default router;
