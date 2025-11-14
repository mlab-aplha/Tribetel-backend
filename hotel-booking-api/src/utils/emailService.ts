import nodemailer, { Transporter } from "nodemailer";
import { EmailOptions, BookingEmailData } from "../types";

const transporter: Transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  const mailOptions = {
    from: `Hotel Booking <${process.env.EMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Email send error:", error);
    throw new Error("Email could not be sent");
  }
};

export const emailTemplates = {
  welcome: (name: string): string => `
    <h1>Welcome to Hotel Booking, ${name}!</h1>
    <p>Thank you for registering. We're excited to help you find your perfect stay.</p>
    <p>Start exploring amazing hotels and book your next adventure!</p>
  `,

  verification: (name: string, verificationUrl: string): string => `
    <h1>Verify Your Email, ${name}</h1>
    <p>Please click the link below to verify your email address:</p>
    <a href="${verificationUrl}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
    <p>This link expires in 24 hours.</p>
    <p>If you didn't create an account, please ignore this email.</p>
  `,

  resetPassword: (name: string, resetUrl: string): string => `
    <h1>Password Reset Request, ${name}</h1>
    <p>You requested to reset your password. Click the link below:</p>
    <a href="${resetUrl}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
    <p>This link expires in 1 hour.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `,

  bookingConfirmation: (name: string, booking: BookingEmailData): string => `
    <h1>Booking Confirmed!</h1>
    <p>Hi ${name},</p>
    <p>Your booking has been confirmed. Here are the details:</p>
    <ul>
      <li><strong>Booking ID:</strong> ${booking.id}</li>
      <li><strong>Hotel:</strong> ${booking.hotelName}</li>
      <li><strong>Check-in:</strong> ${booking.checkIn}</li>
      <li><strong>Check-out:</strong> ${booking.checkOut}</li>
      <li><strong>Total Price:</strong> $${booking.totalPrice}</li>
    </ul>
    <p>We look forward to hosting you!</p>
  `,

  bookingCancellation: (name: string, bookingId: string): string => `
    <h1>Booking Cancelled</h1>
    <p>Hi ${name},</p>
    <p>Your booking (ID: ${bookingId}) has been cancelled successfully.</p>
    <p>If you have any questions, please contact our support team.</p>
  `,
};
