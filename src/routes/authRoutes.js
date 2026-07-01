import { Router } from "express";
import { body } from "express-validator";
import authController from "../controllers/authController.js";
import protect from "../middleware/auth.js";
import validate from "../middleware/validation.js";

const router = Router();

router.post(
  "/register",
  [
    body("first_name").trim().notEmpty().withMessage("First name is required"),
    body("last_name").trim().notEmpty().withMessage("Last name is required"),
    body("email").trim().isEmail().withMessage("Provide a valid email address").normalizeEmail(),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
    body("phone").optional().trim(),
    body("role")
      .optional()
      .isIn(["admin", "customer"])
      .withMessage("Role must be either admin or customer"),
    validate,
  ],
  authController.register
);

router.post(
  "/login",
  [
    body("email").trim().isEmail().withMessage("Provide a valid email address").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
    validate,
  ],
  authController.login
);

router.get("/me", protect, authController.getMe);

export default router;
