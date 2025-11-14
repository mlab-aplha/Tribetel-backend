import { body, query } from "express-validator";

export const createHotelValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Hotel name is required")
    .isLength({ min: 3 })
    .withMessage("Hotel name must be at least 3 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 20 })
    .withMessage("Description must be at least 20 characters"),

  body("address").trim().notEmpty().withMessage("Address is required"),

  body("city").trim().notEmpty().withMessage("City is required"),

  body("state").trim().notEmpty().withMessage("State is required"),

  body("country").trim().notEmpty().withMessage("Country is required"),

  body("postal_code").trim().notEmpty().withMessage("Postal code is required"),

  body("star_rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Star rating must be between 1 and 5"),

  body("phone_number")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required"),

  body("email")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
];

export const searchHotelsValidator = [
  query("city")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("City cannot be empty"),

  query("country")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Country cannot be empty"),

  query("min_price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Minimum price must be a positive number"),

  query("max_price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Maximum price must be a positive number"),

  query("star_rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Star rating must be between 1 and 5"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
];
