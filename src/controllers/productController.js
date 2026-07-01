import ProductModel from "../models/productModel.js";
import { cloudinary } from "../config/cloudinary.js";
import { sendSuccess, sendError } from "../utils/response.js";

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-"); // Replace multiple - with single -
};

const productController = {
  async createProduct(req, res) {
    try {
      const { category_id, name, description, price, stock } = req.body;
      const slug = `${slugify(name)}-${Date.now()}`;

      // Insert product
      const productId = await ProductModel.create({
        category_id: category_id || null,
        name,
        slug,
        description,
        price,
        stock,
      });

      // Handle uploaded images
      if (req.files && req.files.length > 0) {
        const images = req.files.map((file) => ({
          image_url: file.path,
          public_id: file.filename,
        }));
        await ProductModel.addImages(productId, images);
      }

      const product = await ProductModel.getById(productId);
      return sendSuccess(res, "Product created successfully", { product }, 201);
    } catch (error) {
      console.error("Create Product Error:", error.message);
      // Clean up uploaded files from Cloudinary if database insertion fails
      if (req.files && req.files.length > 0) {
        for (let file of req.files) {
          try {
            await cloudinary.uploader.destroy(file.filename);
          } catch (clgErr) {
            console.error("Cloudinary cleanup error:", clgErr.message);
          }
        }
      }
      return sendError(res, "Failed to create product: " + error.message, 500);
    }
  },

  async getAllProducts(req, res) {
    try {
      const { page, limit, search, category, minPrice, maxPrice, sort } = req.query;
      const result = await ProductModel.getAll({
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 10,
        search,
        category,
        minPrice,
        maxPrice,
        sort,
      });
      return sendSuccess(res, "Products retrieved successfully", result, 200);
    } catch (error) {
      console.error("Get All Products Error:", error.message);
      return sendError(res, "Failed to retrieve products: " + error.message, 500);
    }
  },

  async getProductById(req, res) {
    try {
      const { id } = req.params;
      const product = await ProductModel.getById(id);
      if (!product) {
        return sendError(res, "Product not found", 404);
      }
      return sendSuccess(res, "Product retrieved successfully", { product }, 200);
    } catch (error) {
      console.error("Get Product By Id Error:", error.message);
      return sendError(res, "Failed to retrieve product: " + error.message, 500);
    }
  },

  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const { category_id, name, description, price, stock } = req.body;

      const existingProduct = await ProductModel.getById(id);
      if (!existingProduct) {
        return sendError(res, "Product not found", 404);
      }

      // Re-slug if name changes
      let slug = existingProduct.slug;
      if (name && name !== existingProduct.name) {
        slug = `${slugify(name)}-${Date.now()}`;
      }

      const success = await ProductModel.update(id, {
        category_id: category_id !== undefined ? category_id : existingProduct.category_id,
        name: name || existingProduct.name,
        slug,
        description: description !== undefined ? description : existingProduct.description,
        price: price !== undefined ? price : existingProduct.price,
        stock: stock !== undefined ? stock : existingProduct.stock,
      });

      if (!success) {
        return sendError(res, "Failed to update product details or no changes made", 400);
      }

      const updatedProduct = await ProductModel.getById(id);
      return sendSuccess(res, "Product updated successfully", { product: updatedProduct }, 200);
    } catch (error) {
      console.error("Update Product Error:", error.message);
      return sendError(res, "Failed to update product: " + error.message, 500);
    }
  },

  async deleteProduct(req, res) {
    try {
      const { id } = req.params;

      const product = await ProductModel.getById(id);
      if (!product) {
        return sendError(res, "Product not found", 404);
      }

      // Delete images from Cloudinary
      if (product.images && product.images.length > 0) {
        for (let img of product.images) {
          try {
            await cloudinary.uploader.destroy(img.public_id);
          } catch (clgErr) {
            console.error("Cloudinary image delete error:", clgErr.message);
          }
        }
      }

      // Delete product from Database (cascades image rows in DB)
      const success = await ProductModel.delete(id);
      if (!success) {
        return sendError(res, "Failed to delete product from database", 500);
      }

      return sendSuccess(res, "Product deleted successfully", {}, 200);
    } catch (error) {
      console.error("Delete Product Error:", error.message);
      return sendError(res, "Failed to delete product: " + error.message, 500);
    }
  },

  async addProductImages(req, res) {
    try {
      const { id } = req.params; // product_id

      const product = await ProductModel.getById(id);
      if (!product) {
        return sendError(res, "Product not found", 404);
      }

      if (!req.files || req.files.length === 0) {
        return sendError(res, "No image files uploaded", 400);
      }

      const images = req.files.map((file) => ({
        image_url: file.path,
        public_id: file.filename,
      }));

      await ProductModel.addImages(id, images);

      const updatedProduct = await ProductModel.getById(id);
      return sendSuccess(res, "Images added successfully", { product: updatedProduct }, 200);
    } catch (error) {
      console.error("Add Product Images Error:", error.message);
      // Clean up uploaded files
      if (req.files && req.files.length > 0) {
        for (let file of req.files) {
          try {
            await cloudinary.uploader.destroy(file.filename);
          } catch (clgErr) {
            console.error("Cloudinary cleanup error:", clgErr.message);
          }
        }
      }
      return sendError(res, "Failed to add images: " + error.message, 500);
    }
  },

  async deleteProductImage(req, res) {
    try {
      const { id, imageId } = req.params; // product_id, image_id

      const image = await ProductModel.getImageById(imageId);
      if (!image || Number(image.product_id) !== Number(id)) {
        return sendError(res, "Image not found for this product", 404);
      }

      // Destroy from Cloudinary
      try {
        await cloudinary.uploader.destroy(image.public_id);
      } catch (clgErr) {
        console.error("Cloudinary delete error:", clgErr.message);
      }

      // Delete from DB
      await ProductModel.deleteImage(imageId);

      const updatedProduct = await ProductModel.getById(id);
      return sendSuccess(res, "Image deleted successfully", { product: updatedProduct }, 200);
    } catch (error) {
      console.error("Delete Product Image Error:", error.message);
      return sendError(res, "Failed to delete image: " + error.message, 500);
    }
  },

  async replaceProductImage(req, res) {
    try {
      const { id, imageId } = req.params; // product_id, image_id

      const oldImage = await ProductModel.getImageById(imageId);
      if (!oldImage || Number(oldImage.product_id) !== Number(id)) {
        return sendError(res, "Image not found for this product", 404);
      }

      if (!req.file) {
        return sendError(res, "No new image file uploaded", 400);
      }

      // Delete old image from Cloudinary
      try {
        await cloudinary.uploader.destroy(oldImage.public_id);
      } catch (clgErr) {
        console.error("Cloudinary delete error:", clgErr.message);
      }

      // Delete old image from DB
      await ProductModel.deleteImage(imageId);

      // Add new image
      const newImage = {
        image_url: req.file.path,
        public_id: req.file.filename,
      };

      await ProductModel.addImages(id, [newImage]);

      const updatedProduct = await ProductModel.getById(id);
      return sendSuccess(res, "Image replaced successfully", { product: updatedProduct }, 200);
    } catch (error) {
      console.error("Replace Product Image Error:", error.message);
      // Clean up uploaded new image if it failed
      if (req.file) {
        try {
          await cloudinary.uploader.destroy(req.file.filename);
        } catch (clgErr) {
          console.error("Cloudinary cleanup error:", clgErr.message);
        }
      }
      return sendError(res, "Failed to replace image: " + error.message, 500);
    }
  },
};

export default productController;
