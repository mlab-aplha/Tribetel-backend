import express from "express";
import {
  addFavorite,
  getFavorites,
  removeFavorite,
  checkFavorite,
} from "../controllers/favoriteController";
import { protect } from "../middlewares/auth";

const router = express.Router();

router.post("/", protect, addFavorite);
router.get("/", protect, getFavorites);
router.delete("/:hotelId", protect, removeFavorite);
router.get("/check/:hotelId", protect, checkFavorite);

export default router;
