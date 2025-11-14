import { body } from "express-validator";

export const createBookingValidator = [
  body("room_id")
    .notEmpty()
    .withMessage("Room ID is required")
    .isUUID()
    .withMessage("Invalid room ID"),

  body("check_in_date")
    .notEmpty()
    .withMessage("Check-in date is required")
    .isISO8601()
    .withMessage("Invalid check-in date format")
    .custom((value) => {
      const checkIn = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (checkIn < today) {
        throw new Error("Check-in date cannot be in the past");
      }
      return true;
    }),

  body("check_out_date")
    .notEmpty()
    .withMessage("Check-out date is required")
    .isISO8601()
    .withMessage("Invalid check-out date format")
    .custom((value, { req }) => {
      const checkIn = new Date(req.body.check_in_date);
      const checkOut = new Date(value);

      if (checkOut <= checkIn) {
        throw new Error("Check-out date must be after check-in date");
      }
      return true;
    }),

  body("number_of_guests")
    .isInt({ min: 1 })
    .withMessage("Number of guests must be at least 1"),

  body("number_of_rooms")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Number of rooms must be at least 1"),

  body("guest_name").trim().notEmpty().withMessage("Guest name is required"),

  body("guest_email")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("guest_phone").trim().notEmpty().withMessage("Guest phone is required"),
];
