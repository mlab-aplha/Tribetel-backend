import express from "express";
import passport from "passport";
import {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  logout,
} from "../controllers/authController";
import {
  googleCallback,
  facebookCallback,
} from "../controllers/oauthController";
import { protect } from "../middlewares/auth";
import { validate } from "../middlewares/validation";
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from "../validators/authValidator";
import { authLimiter } from "../middlewares/rateLimiter";

const router = express.Router();

router.post("/register", authLimiter, registerValidator, validate, register);
router.post("/login", authLimiter, loginValidator, validate, login);
router.get("/me", protect, getMe);
router.put("/updatedetails", protect, updateDetails);
router.put("/updatepassword", protect, updatePassword);
router.post(
  "/forgotpassword",
  authLimiter,
  forgotPasswordValidator,
  validate,
  forgotPassword
);
router.put(
  "/resetpassword/:resettoken",
  resetPasswordValidator,
  validate,
  resetPassword
);
router.get("/verifyemail/:token", verifyEmail);
router.post("/logout", protect, logout);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`,
    session: false,
  }),
  googleCallback
);

router.get(
  "/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
);

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=facebook_auth_failed`,
    session: false,
  }),
  facebookCallback
);

export default router;
