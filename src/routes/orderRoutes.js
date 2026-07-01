import { Router } from "express";
import { body } from "express-validator";
import orderController from "../controllers/orderController.js";
import protect from "../middleware/auth.js";
import admin from "../middleware/admin.js";
import validate from "../middleware/validation.js";

const router = Router();

router.use(protect); // All order routes require authentication

// Customer: Place order from cart
router.post("/", orderController.placeOrder);

// Customer: Get logged-in user's orders
router.get("/my", orderController.getMyOrders);

// Admin: Get all orders in the system
router.get("/all", admin, orderController.getAllOrders);

// Customer/Admin: Get details of a single order (permission checks inside controller)
router.get("/:id", orderController.getSingleOrder);

// Admin: Update the status of an order
router.put(
  "/:id/status",
  admin,
  [
    body("status")
      .trim()
      .notEmpty()
      .withMessage("Order status is required")
      .isIn(["Pending", "Processing", "Shipped", "Delivered", "Cancelled"])
      .withMessage("Invalid order status value"),
    validate,
  ],
  orderController.updateOrderStatus
);

export default router;
