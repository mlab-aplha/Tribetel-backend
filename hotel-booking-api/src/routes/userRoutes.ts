import express from "express";
import {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  getDashboard,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
} from "../controllers/userController";
import { protect, authorize } from "../middlewares/auth";
import upload from "../middlewares/upload";

const router = express.Router();

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.post(
  "/profile/picture",
  protect,
  upload.single("image"),
  uploadProfilePicture
);
router.get("/dashboard", protect, getDashboard);

router.get("/", protect, authorize("admin"), getUsers);
router.get("/:id", protect, authorize("admin"), getUser);
router.put("/:id", protect, authorize("admin"), updateUser);
router.delete("/:id", protect, authorize("admin"), deleteUser);

export default router;
