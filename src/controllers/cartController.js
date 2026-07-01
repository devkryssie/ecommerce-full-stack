import CartModel from "../models/cartModel.js";
import ProductModel from "../models/productModel.js";
import { sendSuccess, sendError } from "../utils/response.js";

const cartController = {
  async getCart(req, res) {
    try {
      const cart = await CartModel.getCartByUserId(req.user.id);
      return sendSuccess(res, "Cart retrieved successfully", cart, 200);
    } catch (error) {
      console.error("Get Cart Error:", error.message);
      return sendError(res, "Failed to retrieve cart: " + error.message, 500);
    }
  },

  async addItem(req, res) {
    try {
      const { product_id, quantity = 1 } = req.body;
      const userId = req.user.id;

      // Verify product exists and has stock
      const product = await ProductModel.getById(product_id);
      if (!product) {
        return sendError(res, "Product not found", 404);
      }

      if (product.stock < quantity) {
        return sendError(res, `Insufficient stock. Only ${product.stock} items left.`, 400);
      }

      const cartId = await CartModel.getOrCreateCart(userId);
      await CartModel.addItem(cartId, product_id, quantity);

      const cart = await CartModel.getCartDetails(cartId);
      return sendSuccess(res, "Item added to cart", cart, 200);
    } catch (error) {
      console.error("Add Cart Item Error:", error.message);
      return sendError(res, "Failed to add item to cart: " + error.message, 500);
    }
  },

  async updateQuantity(req, res) {
    try {
      const { productId } = req.params;
      const { quantity } = req.body;
      const userId = req.user.id;

      if (!quantity || quantity <= 0) {
        return sendError(res, "Quantity must be a positive integer", 400);
      }

      // Verify product stock
      const product = await ProductModel.getById(productId);
      if (!product) {
        return sendError(res, "Product not found", 404);
      }

      if (product.stock < quantity) {
        return sendError(res, `Insufficient stock. Only ${product.stock} items available.`, 400);
      }

      const cartId = await CartModel.getOrCreateCart(userId);
      const success = await CartModel.updateQuantity(cartId, productId, quantity);

      if (!success) {
        return sendError(res, "Item not found in cart", 404);
      }

      const cart = await CartModel.getCartDetails(cartId);
      return sendSuccess(res, "Cart item quantity updated", cart, 200);
    } catch (error) {
      console.error("Update Cart Quantity Error:", error.message);
      return sendError(res, "Failed to update quantity: " + error.message, 500);
    }
  },

  async removeItem(req, res) {
    try {
      const { productId } = req.params;
      const userId = req.user.id;

      const cartId = await CartModel.getOrCreateCart(userId);
      const success = await CartModel.removeItem(cartId, productId);

      if (!success) {
        return sendError(res, "Item not found in cart", 404);
      }

      const cart = await CartModel.getCartDetails(cartId);
      return sendSuccess(res, "Item removed from cart", cart, 200);
    } catch (error) {
      console.error("Remove Cart Item Error:", error.message);
      return sendError(res, "Failed to remove item from cart: " + error.message, 500);
    }
  },

  async clearCart(req, res) {
    try {
      const userId = req.user.id;
      const cartId = await CartModel.getOrCreateCart(userId);

      await CartModel.clearCart(cartId);

      const cart = await CartModel.getCartDetails(cartId);
      return sendSuccess(res, "Cart cleared successfully", cart, 200);
    } catch (error) {
      console.error("Clear Cart Error:", error.message);
      return sendError(res, "Failed to clear cart: " + error.message, 500);
    }
  },
};

export default cartController;
