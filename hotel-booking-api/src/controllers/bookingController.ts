import { Request, Response } from "express";
import { Op } from "sequelize";
import asyncHandler from "../utils/asyncHandler";
import { Booking, Room, Hotel, Payment, User } from "../models";
import {
  calculateNights,
  calculateTotalPrice,
  getPagination,
  formatPaginationResponse,
} from "../utils/helpers";
import { sendEmail, emailTemplates } from "../utils/emailService";
import * as stripeService from "../services/stripeService";
import {
  CreateBookingRequest,
  UpdateBookingStatusRequest,
  CancelBookingRequest,
  BookingQuery,
} from "../types";

export const createBooking = asyncHandler(
  async (
    req: Request<{}, {}, CreateBookingRequest>,
    res: Response
  ): Promise<void> => {
    const {
      room_id,
      check_in_date,
      check_out_date,
      number_of_guests,
      number_of_rooms = 1,
      special_requests,
      guest_name,
      guest_email,
      guest_phone,
    } = req.body;

    const room = await Room.findByPk(room_id, {
      include: [{ model: Hotel, as: "hotel" }],
    });

    if (!room) {
      res.status(404).json({
        success: false,
        message: "Room not found",
      });
      return;
    }

    if (!room.is_available) {
      res.status(400).json({
        success: false,
        message: "Room is not available for booking",
      });
      return;
    }

    if (number_of_guests > room.capacity * number_of_rooms) {
      res.status(400).json({
        success: false,
        message: `Room capacity exceeded. Maximum capacity is ${room.capacity} guests per room`,
      });
      return;
    }

    const overlappingBookings = await Booking.findAll({
      where: {
        room_id,
        status: { [Op.notIn]: ["cancelled"] },
        [Op.or]: [
          {
            check_in_date: { [Op.between]: [check_in_date, check_out_date] },
          },
          {
            check_out_date: { [Op.between]: [check_in_date, check_out_date] },
          },
          {
            [Op.and]: [
              { check_in_date: { [Op.lte]: check_in_date } },
              { check_out_date: { [Op.gte]: check_out_date } },
            ],
          },
        ],
      },
    });

    const bookedRooms = overlappingBookings.reduce(
      (sum, booking) => sum + booking.number_of_rooms,
      0
    );

    const availableRooms = room.total_rooms - bookedRooms;

    if (availableRooms < number_of_rooms) {
      res.status(400).json({
        success: false,
        message: `Only ${availableRooms} room(s) available for selected dates`,
      });
      return;
    }

    const nights = calculateNights(check_in_date, check_out_date);
    const totalPrice = calculateTotalPrice(
      parseFloat(room.price_per_night.toString()),
      nights,
      number_of_rooms
    );

    const booking = await Booking.create({
      user_id: req.user!.id,
      room_id,
      check_in_date,
      check_out_date,
      number_of_guests,
      number_of_rooms,
      total_price: totalPrice,
      special_requests,
      guest_name,
      guest_email,
      guest_phone,
      status: "pending",
    });

    const roomWithHotel = room as Room & { hotel: Hotel };

    const paymentIntent = await stripeService.createPaymentIntent(
      totalPrice,
      "usd",
      {
        booking_id: booking.id,
        user_id: req.user!.id,
        hotel_name: roomWithHotel.hotel.name,
      }
    );

    await Payment.create({
      booking_id: booking.id,
      amount: totalPrice,
      currency: "usd",
      payment_method: "stripe",
      payment_status: "pending",
      stripe_payment_intent_id: paymentIntent.id,
    });

    const completeBooking = await Booking.findByPk(booking.id, {
      include: [
        {
          model: Room,
          as: "room",
          include: [{ model: Hotel, as: "hotel" }],
        },
        {
          model: Payment,
          as: "payment",
        },
      ],
    });

    res.status(201).json({
      success: true,
      data: completeBooking,
      clientSecret: paymentIntent.client_secret,
    });
  }
);

export const getMyBookings = asyncHandler(
  async (
    req: Request<{}, {}, {}, BookingQuery>,
    res: Response
  ): Promise<void> => {
    const { page = "1", limit = "10", status } = req.query;

    const where: any = { user_id: req.user!.id };

    if (status) {
      where.status = status;
    }

    const { limit: limitNum, offset } = getPagination(
      parseInt(page),
      parseInt(limit)
    );

    const { count, rows } = await Booking.findAndCountAll({
      where,
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
                  model: require("../models").HotelImage,
                  as: "images",
                  where: { is_primary: true },
                  required: false,
                  limit: 1,
                },
              ],
            },
          ],
        },
        {
          model: Payment,
          as: "payment",
        },
      ],
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

export const getBooking = asyncHandler(
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        {
          model: Room,
          as: "room",
          include: [{ model: Hotel, as: "hotel" }],
        },
        {
          model: User,
          as: "user",
          attributes: [
            "id",
            "first_name",
            "last_name",
            "email",
            "phone_number",
          ],
        },
        {
          model: Payment,
          as: "payment",
        },
      ],
    });

    if (!booking) {
      res.status(404).json({
        success: false,
        message: "Booking not found",
      });
      return;
    }

    if (booking.user_id !== req.user!.id && req.user!.role !== "admin") {
      res.status(403).json({
        success: false,
        message: "Not authorized to view this booking",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  }
);

export const updateBookingStatus = asyncHandler(
  async (
    req: Request<{ id: string }, {}, UpdateBookingStatusRequest>,
    res: Response
  ): Promise<void> => {
    const { status } = req.body;

    const validStatuses: Array<
      "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled"
    > = ["pending", "confirmed", "checked_in", "checked_out", "cancelled"];

    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
      return;
    }

    const booking = await Booking.findByPk(req.params.id, {
      include: [
        {
          model: Room,
          as: "room",
          include: [{ model: Hotel, as: "hotel" }],
        },
        {
          model: User,
          as: "user",
        },
      ],
    });

    if (!booking) {
      res.status(404).json({
        success: false,
        message: "Booking not found",
      });
      return;
    }

    await booking.update({ status });

    const bookingWithRelations = booking as Booking & {
      user: User;
      room: Room & { hotel: Hotel };
    };

    if (status === "confirmed") {
      await sendEmail({
        to: bookingWithRelations.user.email,
        subject: "Booking Confirmed",
        html: emailTemplates.bookingConfirmation(
          bookingWithRelations.user.first_name,
          {
            id: booking.id,
            hotelName: bookingWithRelations.room.hotel.name,
            checkIn: booking.check_in_date,
            checkOut: booking.check_out_date,
            totalPrice: parseFloat(booking.total_price.toString()),
          }
        ),
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  }
);

export const cancelBooking = asyncHandler(
  async (
    req: Request<{ id: string }, {}, CancelBookingRequest>,
    res: Response
  ): Promise<void> => {
    const { cancellation_reason } = req.body;

    const booking = await Booking.findByPk(req.params.id, {
      include: [
        {
          model: Payment,
          as: "payment",
        },
        {
          model: Room,
          as: "room",
          include: [{ model: Hotel, as: "hotel" }],
        },
      ],
    });

    if (!booking) {
      res.status(404).json({
        success: false,
        message: "Booking not found",
      });
      return;
    }

    if (booking.user_id !== req.user!.id && req.user!.role !== "admin") {
      res.status(403).json({
        success: false,
        message: "Not authorized to cancel this booking",
      });
      return;
    }

    if (booking.status === "cancelled") {
      res.status(400).json({
        success: false,
        message: "Booking is already cancelled",
      });
      return;
    }

    if (booking.status === "checked_out") {
      res.status(400).json({
        success: false,
        message: "Cannot cancel completed booking",
      });
      return;
    }

    const checkInDate = new Date(booking.check_in_date);
    const now = new Date();
    const hoursUntilCheckIn =
      (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    let refundAmount = 0;

    if (hoursUntilCheckIn > 24) {
      refundAmount = parseFloat(booking.total_price.toString());
    } else if (hoursUntilCheckIn > 0) {
      refundAmount = parseFloat(booking.total_price.toString()) * 0.5;
    }

    const bookingWithPayment = booking as Booking & { payment?: Payment };

    if (
      bookingWithPayment.payment &&
      bookingWithPayment.payment.payment_status === "completed" &&
      refundAmount > 0
    ) {
      try {
        const refund = await stripeService.createRefund(
          bookingWithPayment.payment.stripe_charge_id!,
          refundAmount
        );

        await bookingWithPayment.payment.update({
          payment_status: "refunded",
          refund_amount: refundAmount,
          refund_reason: cancellation_reason,
          refunded_at: new Date(),
        });
      } catch (error) {
        console.error("Refund error:", error);
      }
    }

    await booking.update({
      status: "cancelled",
      cancellation_reason,
      cancelled_at: new Date(),
    });

    await sendEmail({
      to: booking.guest_email,
      subject: "Booking Cancelled",
      html: emailTemplates.bookingCancellation(booking.guest_name, booking.id),
    });

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      data: {
        booking,
        refund_amount: refundAmount,
      },
    });
  }
);

export const getAllBookings = asyncHandler(
  async (
    req: Request<{}, {}, {}, BookingQuery>,
    res: Response
  ): Promise<void> => {
    const {
      page = "1",
      limit = "10",
      status,
      hotel_id,
      date_from,
      date_to,
    } = req.query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (date_from && date_to) {
      where.check_in_date = {
        [Op.between]: [date_from, date_to],
      };
    }

    const include: any[] = [
      {
        model: Room,
        as: "room",
        include: [
          {
            model: Hotel,
            as: "hotel",
            ...(hotel_id && { where: { id: hotel_id } }),
          },
        ],
      },
      {
        model: User,
        as: "user",
        attributes: ["id", "first_name", "last_name", "email"],
      },
      {
        model: Payment,
        as: "payment",
      },
    ];

    const { limit: limitNum, offset } = getPagination(
      parseInt(page),
      parseInt(limit)
    );

    const { count, rows } = await Booking.findAndCountAll({
      where,
      include,
      limit: limitNum,
      offset,
      order: [["created_at", "DESC"]],
      distinct: true,
    });

    res.status(200).json({
      success: true,
      ...formatPaginationResponse(rows, parseInt(page), parseInt(limit), count),
    });
  }
);
