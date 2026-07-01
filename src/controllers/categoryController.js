import CategoryModel from "../models/categoryModel.js";
import { sendSuccess, sendError } from "../utils/response.js";

const categoryController = {
  async createCategory(req, res) {
    try {
      const { name } = req.body;
      const category = await CategoryModel.create(name);
      return sendSuccess(res, "Category created successfully", { category }, 201);
    } catch (error) {
      console.error("Create Category Error:", error.message);
      if (error.code === "ER_DUP_ENTRY") {
        return sendError(res, "Category name already exists", 400);
      }
      return sendError(res, "Failed to create category: " + error.message, 500);
    }
  },

  async getAllCategories(req, res) {
    try {
      const categories = await CategoryModel.getAll();
      return sendSuccess(res, "Categories retrieved successfully", { categories }, 200);
    } catch (error) {
      console.error("Get All Categories Error:", error.message);
      return sendError(res, "Failed to retrieve categories: " + error.message, 500);
    }
  },

  async getCategoryById(req, res) {
    try {
      const { id } = req.params;
      const category = await CategoryModel.getById(id);
      if (!category) {
        return sendError(res, "Category not found", 404);
      }
      return sendSuccess(res, "Category retrieved successfully", { category }, 200);
    } catch (error) {
      console.error("Get Category By Id Error:", error.message);
      return sendError(res, "Failed to retrieve category: " + error.message, 500);
    }
  },

  async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { name } = req.body;

      const success = await CategoryModel.update(id, name);
      if (!success) {
        return sendError(res, "Category not found or no changes made", 404);
      }

      const updatedCategory = await CategoryModel.getById(id);
      return sendSuccess(res, "Category updated successfully", { category: updatedCategory }, 200);
    } catch (error) {
      console.error("Update Category Error:", error.message);
      if (error.code === "ER_DUP_ENTRY") {
        return sendError(res, "Category name already exists", 400);
      }
      return sendError(res, "Failed to update category: " + error.message, 500);
    }
  },

  async deleteCategory(req, res) {
    try {
      const { id } = req.params;
      const success = await CategoryModel.delete(id);
      if (!success) {
        return sendError(res, "Category not found", 404);
      }
      return sendSuccess(res, "Category deleted successfully", {}, 200);
    } catch (error) {
      console.error("Delete Category Error:", error.message);
      return sendError(res, "Failed to delete category: " + error.message, 500);
    }
  },
};

export default categoryController;
