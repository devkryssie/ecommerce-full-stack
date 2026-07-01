import { Router } from "express";
import { body } from "express-validator";
import productController from "../controllers/productController.js";
import protect from "../middleware/auth.js";
import admin from "../middleware/admin.js";
import upload from "../middleware/upload.js";
import validate from "../middleware/validation.js";

const router = Router();

// Create Product (Admins only, accepts up to 5 images)
router.post(
  "/",
  protect,
  admin,
  upload.array("images", 5),
  [
    body("name").trim().notEmpty().withMessage("Product name is required"),
    body("price").isFloat({ min: 0 }).withMessage("Price must be a non-negative number"),
    body("stock").isInt({ min: 0 }).withMessage("Stock must be a non-negative integer"),
    body("category_id").optional({ nullable: true }).isInt().withMessage("Category ID must be an integer"),
    validate,
  ],
  productController.createProduct
);

// Get All Products (Public)
router.get("/", productController.getAllProducts);

// Get Product by ID (Public)
router.get("/:id", productController.getProductById);

// Update Product details (Admins only)
router.put(
  "/:id",
  protect,
  admin,
  [
    body("name").optional().trim().notEmpty().withMessage("Product name cannot be empty"),
    body("price").optional().isFloat({ min: 0 }).withMessage("Price must be a non-negative number"),
    body("stock").optional().isInt({ min: 0 }).withMessage("Stock must be a non-negative integer"),
    body("category_id").optional({ nullable: true }).isInt().withMessage("Category ID must be an integer"),
    validate,
  ],
  productController.updateProduct
);

// Delete Product (Admins only)
router.delete("/:id", protect, admin, productController.deleteProduct);

// Add new images to existing product (Admins only)
router.post(
  "/:id/images",
  protect,
  admin,
  upload.array("images", 5),
  productController.addProductImages
);

// Replace an existing product image (Admins only)
router.put(
  "/:id/images/:imageId",
  protect,
  admin,
  upload.single("image"),
  productController.replaceProductImage
);

// Delete individual image from product (Admins only)
router.delete("/:id/images/:imageId", protect, admin, productController.deleteProductImage);

export default router;
