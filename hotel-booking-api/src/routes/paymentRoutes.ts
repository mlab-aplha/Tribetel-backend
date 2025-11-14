import express from "express";
import {
  confirmPayment,
  getPayment,
  stripeWebhook,
} from "../controllers/paymentController";
import { protect } from "../middlewares/auth";

const router = express.Router();

router.post("/confirm", protect, confirmPayment);
router.get("/:id", protect, getPayment);

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

export default router;
