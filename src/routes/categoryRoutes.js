import { Router } from "express";
import { body } from "express-validator";
import categoryController from "../controllers/categoryController.js";
import protect from "../middleware/auth.js";
import admin from "../middleware/admin.js";
import validate from "../middleware/validation.js";

const router = Router();

router.post(
  "/",
  protect,
  admin,
  [
    body("name").trim().notEmpty().withMessage("Category name is required"),
    validate,
  ],
  categoryController.createCategory
);

router.get("/", categoryController.getAllCategories);

router.get("/:id", categoryController.getCategoryById);

router.put(
  "/:id",
  protect,
  admin,
  [
    body("name").trim().notEmpty().withMessage("Category name is required"),
    validate,
  ],
  categoryController.updateCategory
);

router.delete("/:id", protect, admin, categoryController.deleteCategory);

export default router;
