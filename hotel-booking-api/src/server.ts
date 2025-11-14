import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import dotenv from "dotenv";

dotenv.config();

import { sequelize, testConnection } from "./config/database";
import passport from "./config/passport";

import errorHandler from "./middlewares/errorHandler";
import { apiLimiter } from "./middlewares/rateLimiter";

import authRoutes from "./routes/authRoutes";
import hotelRoutes from "./routes/hotelRoutes";
import roomRoutes from "./routes/roomRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import reviewRoutes from "./routes/reviewRoutes";
import favoriteRoutes from "./routes/favoriteRoutes";
import amenityRoutes from "./routes/amenityRoutes";
import userRoutes from "./routes/userRoutes";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/api/", apiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/amenities", amenityRoutes);
app.use("/api/users", userRoutes);

app.get("/api/health", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

app.use(errorHandler);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  try {
    await testConnection();

    await sequelize.sync({ alter: process.env.NODE_ENV === "development" });
    console.log("✅ Database synchronized");

    app.listen(PORT, () => {
      console.log(
        `✅ Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
      );
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

process.on("unhandledRejection", (err: Error) => {
  console.error("❌ Unhandled Promise Rejection:", err);
  process.exit(1);
});

export default app;
