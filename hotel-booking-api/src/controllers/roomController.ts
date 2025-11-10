import { Request, Response } from "express";
import { Op } from "sequelize";
import asyncHandler from "../utils/asyncHandler";
import { Room, Hotel, Booking } from "../models";
import {
  CreateRoomRequest,
  UpdateRoomRequest,
  RoomAvailabilityQuery,
} from "../types";

export const getRoomsByHotel = asyncHandler(
  async (
    req: Request<{ hotelId: string }, {}, {}, RoomAvailabilityQuery>,
    res: Response
  ): Promise<void> => {
    const { hotelId } = req.params;
    const { check_in, check_out, guests } = req.query;

    const where: any = {
      hotel_id: hotelId,
      is_available: true,
    };

    if (guests) {
      where.capacity = { [Op.gte]: parseInt(guests) };
    }

    const rooms = await Room.findAll({
      where,
      include: [
        {
          model: Hotel,
          as: "hotel",
          attributes: ["id", "name", "city"],
        },
      ],
    });

    if (check_in && check_out && rooms.length > 0) {
      const roomIds = rooms.map((r) => r.id);

      const overlappingBookings = await Booking.findAll({
        where: {
          room_id: { [Op.in]: roomIds },
          status: { [Op.notIn]: ["cancelled"] },
          [Op.or]: [
            {
              check_in_date: { [Op.between]: [check_in, check_out] },
            },
            {
              check_out_date: { [Op.between]: [check_in, check_out] },
            },
            {
              [Op.and]: [
                { check_in_date: { [Op.lte]: check_in } },
                { check_out_date: { [Op.gte]: check_out } },
              ],
            },
          ],
        },
        attributes: ["room_id", "number_of_rooms"],
      });

      const bookedRoomCounts: Record<string, number> = {};
      overlappingBookings.forEach((booking) => {
        bookedRoomCounts[booking.room_id] =
          (bookedRoomCounts[booking.room_id] || 0) + booking.number_of_rooms;
      });

      rooms.forEach((room) => {
        const booked = bookedRoomCounts[room.id] || 0;
        room.available_rooms = room.total_rooms - booked;
      });

      const availableRooms = rooms.filter((room) => room.available_rooms > 0);

      res.status(200).json({
        success: true,
        data: availableRooms,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: rooms,
    });
  }
);

export const getRoom = asyncHandler(
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const room = await Room.findByPk(req.params.id, {
      include: [
        {
          model: Hotel,
          as: "hotel",
        },
      ],
    });

    if (!room) {
      res.status(404).json({
        success: false,
        message: "Room not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: room,
    });
  }
);

export const createRoom = asyncHandler(
  async (
    req: Request<{ hotelId: string }, {}, CreateRoomRequest>,
    res: Response
  ): Promise<void> => {
    const { hotelId } = req.params;

    const hotel = await Hotel.findByPk(hotelId);

    if (!hotel) {
      res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
      return;
    }

    const roomData = {
      ...req.body,
      hotel_id: hotelId,
      available_rooms: req.body.total_rooms,
    };

    const room = await Room.create(roomData);

    res.status(201).json({
      success: true,
      data: room,
    });
  }
);

export const updateRoom = asyncHandler(
  async (
    req: Request<{ id: string }, {}, UpdateRoomRequest>,
    res: Response
  ): Promise<void> => {
    let room = await Room.findByPk(req.params.id);

    if (!room) {
      res.status(404).json({
        success: false,
        message: "Room not found",
      });
      return;
    }

    room = await room.update(req.body);

    res.status(200).json({
      success: true,
      data: room,
    });
  }
);

export const deleteRoom = asyncHandler(
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const room = await Room.findByPk(req.params.id);

    if (!room) {
      res.status(404).json({
        success: false,
        message: "Room not found",
      });
      return;
    }

    const activeBookings = await Booking.count({
      where: {
        room_id: room.id,
        status: { [Op.notIn]: ["cancelled", "checked_out"] },
      },
    });

    if (activeBookings > 0) {
      res.status(400).json({
        success: false,
        message: "Cannot delete room with active bookings",
      });
      return;
    }

    await room.destroy();

    res.status(200).json({
      success: true,
      message: "Room deleted successfully",
    });
  }
);

export const checkAvailability = asyncHandler(
  async (
    req: Request<{ id: string }, {}, {}, RoomAvailabilityQuery>,
    res: Response
  ): Promise<void> => {
    const { check_in, check_out, number_of_rooms = "1" } = req.query;

    if (!check_in || !check_out) {
      res.status(400).json({
        success: false,
        message: "Please provide check-in and check-out dates",
      });
      return;
    }

    const room = await Room.findByPk(req.params.id);

    if (!room) {
      res.status(404).json({
        success: false,
        message: "Room not found",
      });
      return;
    }

    const overlappingBookings = await Booking.findAll({
      where: {
        room_id: room.id,
        status: { [Op.notIn]: ["cancelled"] },
        [Op.or]: [
          {
            check_in_date: { [Op.between]: [check_in, check_out] },
          },
          {
            check_out_date: { [Op.between]: [check_in, check_out] },
          },
          {
            [Op.and]: [
              { check_in_date: { [Op.lte]: check_in } },
              { check_out_date: { [Op.gte]: check_out } },
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
    const isAvailable = availableRooms >= parseInt(number_of_rooms);

    res.status(200).json({
      success: true,
      data: {
        is_available: isAvailable,
        available_rooms: availableRooms,
        requested_rooms: parseInt(number_of_rooms),
        total_rooms: room.total_rooms,
      },
    });
  }
);
