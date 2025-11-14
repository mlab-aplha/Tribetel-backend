import express from "express";
import {
  getHotels,
  getHotel,
  createHotel,
  updateHotel,
  deleteHotel,
  uploadHotelImages,
  deleteHotelImage,
  getFeaturedHotels,
} from "../controllers/hotelController";
import { protect, authorize } from "../middlewares/auth";
import { validate } from "../middlewares/validation";
import {
  createHotelValidator,
  searchHotelsValidator,
} from "../validators/hotelValidator";
import upload from "../middlewares/upload";

const router = express.Router();

router.get("/", searchHotelsValidator, validate, getHotels);
router.get("/featured", getFeaturedHotels);
router.get("/:id", getHotel);

router.post(
  "/",
  protect,
  authorize("admin"),
  createHotelValidator,
  validate,
  createHotel
);
router.put("/:id", protect, authorize("admin"), updateHotel);
router.delete("/:id", protect, authorize("admin"), deleteHotel);

router.post(
  "/:id/images",
  protect,
  authorize("admin"),
  upload.array("images", 10),
  uploadHotelImages
);
router.delete(
  "/:hotelId/images/:imageId",
  protect,
  authorize("admin"),
  deleteHotelImage
);

export default router;
