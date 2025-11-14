import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import { Payment, Booking } from "../models";
import * as stripeService from "../services/stripeService";
import { ConfirmPaymentRequest } from "../types";

export const confirmPayment = asyncHandler(
  async (
    req: Request<{}, {}, ConfirmPaymentRequest>,
    res: Response
  ): Promise<void> => {
    const { payment_intent_id } = req.body;

    if (!payment_intent_id) {
      res.status(400).json({
        success: false,
        message: "Payment intent ID is required",
      });
      return;
    }

    const payment = await Payment.findOne({
      where: { stripe_payment_intent_id: payment_intent_id },
      include: [{ model: Booking, as: "booking" }],
    });

    if (!payment) {
      res.status(404).json({
        success: false,
        message: "Payment not found",
      });
      return;
    }

    const paymentIntent = await stripeService.confirmPayment(payment_intent_id);

    const paymentWithBooking = payment as Payment & { booking: Booking };

    if (paymentIntent.status === "succeeded") {
      await payment.update({
        payment_status: "completed",
        stripe_charge_id: paymentIntent.charges.data[0].id,
        payment_method: paymentIntent.payment_method_types[0],
        transaction_date: new Date(),
      });

      await paymentWithBooking.booking.update({ status: "confirmed" });

      res.status(200).json({
        success: true,
        message: "Payment confirmed successfully",
        data: payment,
      });
    } else {
      await payment.update({
        payment_status: "failed",
      });

      res.status(400).json({
        success: false,
        message: "Payment failed",
        data: { status: paymentIntent.status },
      });
    }
  }
);

export const getPayment = asyncHandler(
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const payment = await Payment.findByPk(req.params.id, {
      include: [
        {
          model: Booking,
          as: "booking",
          include: [
            {
              model: require("../models").Room,
              as: "room",
              include: [{ model: require("../models").Hotel, as: "hotel" }],
            },
          ],
        },
      ],
    });

    if (!payment) {
      res.status(404).json({
        success: false,
        message: "Payment not found",
      });
      return;
    }

    const paymentWithBooking = payment as Payment & { booking: Booking };

    if (
      paymentWithBooking.booking.user_id !== req.user!.id &&
      req.user!.role !== "admin"
    ) {
      res.status(403).json({
        success: false,
        message: "Not authorized to view this payment",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  }
);

export const stripeWebhook = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const signature = req.headers["stripe-signature"] as string;

    const event = stripeService.verifyWebhookSignature(req.body, signature);

    if (!event) {
      res.status(400).json({
        success: false,
        message: "Webhook signature verification failed",
      });
      return;
    }

    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;

        const payment = await Payment.findOne({
          where: { stripe_payment_intent_id: paymentIntent.id },
          include: [{ model: Booking, as: "booking" }],
        });

        if (payment) {
          await payment.update({
            payment_status: "completed",
            stripe_charge_id: paymentIntent.charges.data[0].id,
            transaction_date: new Date(),
          });

          const paymentWithBooking = payment as Payment & { booking: Booking };
          await paymentWithBooking.booking.update({ status: "confirmed" });
        }
        break;

      case "payment_intent.payment_failed":
        const failedIntent = event.data.object;

        const failedPayment = await Payment.findOne({
          where: { stripe_payment_intent_id: failedIntent.id },
        });

        if (failedPayment) {
          await failedPayment.update({ payment_status: "failed" });
        }
        break;

      case "charge.refunded":
        const refund = event.data.object;

        const refundedPayment = await Payment.findOne({
          where: { stripe_charge_id: refund.id },
        });

        if (refundedPayment) {
          await refundedPayment.update({
            payment_status: "refunded",
            refund_amount: refund.amount_refunded / 100,
            refunded_at: new Date(),
          });
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  }
);
