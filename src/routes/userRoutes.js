import { Router } from "express";
import { body } from "express-validator";
import userController from "../controllers/userController.js";
import protect from "../middleware/auth.js";
import validate from "../middleware/validation.js";

const router = Router();

router.put(
  "/profile",
  protect,
  [
    body("first_name").optional().trim().notEmpty().withMessage("First name cannot be empty"),
    body("last_name").optional().trim().notEmpty().withMessage("Last name cannot be empty"),
    body("phone").optional().trim(),
    validate,
  ],
  userController.updateProfile
);

router.put(
  "/change-password",
  protect,
  [
    body("current_password").notEmpty().withMessage("Current password is required"),
    body("new_password").isLength({ min: 6 }).withMessage("New password must be at least 6 characters long"),
    validate,
  ],
  userController.changePassword
);

export default router;
