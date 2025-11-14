import express from "express";
import {
  getAmenities,
  createAmenity,
  updateAmenity,
  deleteAmenity,
} from "../controllers/amenityController";
import { protect, authorize } from "../middlewares/auth";

const router = express.Router();

router.get("/", getAmenities);

router.post("/", protect, authorize("admin"), createAmenity);
router.put("/:id", protect, authorize("admin"), updateAmenity);
router.delete("/:id", protect, authorize("admin"), deleteAmenity);

export default router;
