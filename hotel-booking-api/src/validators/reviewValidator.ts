import { body } from "express-validator";

export const createReviewValidator = [
  body("hotel_id")
    .notEmpty()
    .withMessage("Hotel ID is required")
    .isUUID()
    .withMessage("Invalid hotel ID"),

  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),

  body("title")
    .trim()
    .notEmpty()
    .withMessage("Review title is required")
    .isLength({ min: 5, max: 100 })
    .withMessage("Title must be between 5 and 100 characters"),

  body("comment")
    .trim()
    .notEmpty()
    .withMessage("Review comment is required")
    .isLength({ min: 20 })
    .withMessage("Comment must be at least 20 characters"),

  body("cleanliness_rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Cleanliness rating must be between 1 and 5"),

  body("service_rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Service rating must be between 1 and 5"),

  body("location_rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Location rating must be between 1 and 5"),

  body("value_rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Value rating must be between 1 and 5"),
];
