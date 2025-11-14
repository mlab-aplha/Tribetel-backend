import express from "express";
import {
  getRoomsByHotel,
  getRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  checkAvailability,
} from "../controllers/roomController";
import { protect, authorize } from "../middlewares/auth";

const router = express.Router();

router.get("/hotel/:hotelId", getRoomsByHotel);
router.get("/:id", getRoom);
router.get("/:id/availability", checkAvailability);

router.post("/hotel/:hotelId", protect, authorize("admin"), createRoom);
router.put("/:id", protect, authorize("admin"), updateRoom);
router.delete("/:id", protect, authorize("admin"), deleteRoom);

export default router;
