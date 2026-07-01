import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

import { sendError } from "./utils/response.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check / Root Endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the E-commerce Backend API",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

// 404 Not Found Handler
app.use((req, res, next) => {
  return sendError(res, "Endpoint not found", 404);
});

// Centralized Global Error Handler
app.use((err, req, res, next) => {
  console.error("Uncaught Error:", err);
  const status = err.status || 500;
  return sendError(res, err.message || "Something went wrong", status);
});

export default app;
