import Stripe from "stripe";
import { StripePaymentIntentMetadata } from "../types";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

export const createPaymentIntent = async (
  amount: number,
  currency: string = "usd",
  metadata: StripePaymentIntentMetadata
): Promise<Stripe.PaymentIntent> => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return paymentIntent;
  } catch (error) {
    console.error("Stripe payment intent error:", error);
    throw new Error("Failed to create payment intent");
  }
};

export const confirmPayment = async (
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error("Stripe confirm payment error:", error);
    throw new Error("Failed to confirm payment");
  }
};

export const createRefund = async (
  chargeId: string,
  amount?: number
): Promise<Stripe.Refund> => {
  try {
    const refundData: Stripe.RefundCreateParams = { charge: chargeId };

    if (amount) {
      refundData.amount = Math.round(amount * 100);
    }

    const refund = await stripe.refunds.create(refundData);
    return refund;
  } catch (error) {
    console.error("Stripe refund error:", error);
    throw new Error("Failed to create refund");
  }
};

export const verifyWebhookSignature = (
  payload: string | Buffer,
  signature: string
): Stripe.Event | null => {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    return event;
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return null;
  }
};
