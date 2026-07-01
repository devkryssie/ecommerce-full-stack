import { Router } from "express";
import { body } from "express-validator";
import cartController from "../controllers/cartController.js";
import protect from "../middleware/auth.js";
import validate from "../middleware/validation.js";

const router = Router();

router.use(protect); // All cart routes require authentication

router.get("/", cartController.getCart);

router.post(
  "/",
  [
    body("product_id").isInt().withMessage("Product ID is required and must be an integer"),
    body("quantity").optional().isInt({ min: 1 }).withMessage("Quantity must be a positive integer"),
    validate,
  ],
  cartController.addItem
);

router.put(
  "/items/:productId",
  [
    body("quantity").isInt({ min: 1 }).withMessage("Quantity must be a positive integer"),
    validate,
  ],
  cartController.updateQuantity
);

router.delete("/items/:productId", cartController.removeItem);

router.delete("/", cartController.clearCart);

export default router;
