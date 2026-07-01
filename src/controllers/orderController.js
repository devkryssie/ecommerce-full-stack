import db from "../config/db.js";
import OrderModel from "../models/orderModel.js";
import CartModel from "../models/cartModel.js";
import ProductModel from "../models/productModel.js";
import { sendSuccess, sendError } from "../utils/response.js";

const orderController = {
  async placeOrder(req, res) {
    const userId = req.user.id;
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Get user's cart
      const cart = await CartModel.getCartByUserId(userId);
      if (!cart || cart.items.length === 0) {
        await connection.rollback();
        connection.release();
        return sendError(res, "Your cart is empty. Cannot place order.", 400);
      }

      // 2. Validate stock and reduce stock
      for (let item of cart.items) {
        const product = await ProductModel.getById(item.product_id);
        if (!product) {
          await connection.rollback();
          connection.release();
          return sendError(res, `Product with ID ${item.product_id} no longer exists`, 404);
        }

        if (product.stock < item.quantity) {
          await connection.rollback();
          connection.release();
          return sendError(
            res,
            `Insufficient stock for "${product.name}". Required: ${item.quantity}, Available: ${product.stock}`,
            400
          );
        }

        // Reduce stock atomically
        const stockReduced = await ProductModel.reduceStock(item.product_id, item.quantity, connection);
        if (!stockReduced) {
          await connection.rollback();
          connection.release();
          return sendError(
            res,
            `Failed to secure stock for "${product.name}". Please try again.`,
            400
          );
        }
      }

      // 3. Create the order
      const orderId = await OrderModel.createOrder(
        {
          user_id: userId,
          total_price: cart.cartTotal,
          status: "Pending",
        },
        connection
      );

      // 4. Create order items
      for (let item of cart.items) {
        await OrderModel.createOrderItem(
          {
            order_id: orderId,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
          },
          connection
        );
      }

      // 5. Clear the user's cart
      const cartId = await CartModel.getOrCreateCart(userId);
      await CartModel.clearCart(cartId, connection);

      // Commit transaction
      await connection.commit();
      connection.release();

      const createdOrder = await OrderModel.getOrderById(orderId);
      return sendSuccess(res, "Order placed successfully", { order: createdOrder }, 201);
    } catch (error) {
      console.error("Place Order Transaction Error:", error.message);
      try {
        await connection.rollback();
      } catch (rollErr) {
        console.error("Rollback failed:", rollErr.message);
      }
      connection.release();
      return sendError(res, "Failed to place order: " + error.message, 500);
    }
  },

  async getMyOrders(req, res) {
    try {
      const orders = await OrderModel.getOrdersByUserId(req.user.id);
      return sendSuccess(res, "My orders retrieved successfully", { orders }, 200);
    } catch (error) {
      console.error("Get My Orders Error:", error.message);
      return sendError(res, "Failed to retrieve orders: " + error.message, 500);
    }
  },

  async getSingleOrder(req, res) {
    try {
      const { id } = req.params;
      const order = await OrderModel.getOrderById(id);

      if (!order) {
        return sendError(res, "Order not found", 404);
      }

      // Restrict access to owner or admin
      if (order.user_id !== req.user.id && req.user.role !== "admin") {
        return sendError(res, "Access denied. Not your order.", 403);
      }

      return sendSuccess(res, "Order retrieved successfully", { order }, 200);
    } catch (error) {
      console.error("Get Single Order Error:", error.message);
      return sendError(res, "Failed to retrieve order: " + error.message, 500);
    }
  },

  async getAllOrders(req, res) {
    try {
      const orders = await OrderModel.getAllOrders();
      return sendSuccess(res, "All orders retrieved successfully", { orders }, 200);
    } catch (error) {
      console.error("Get All Orders Error:", error.message);
      return sendError(res, "Failed to retrieve orders: " + error.message, 500);
    }
  },

  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
      if (!validStatuses.includes(status)) {
        return sendError(res, "Invalid status value. Must be Pending, Processing, Shipped, Delivered, or Cancelled.", 400);
      }

      const order = await OrderModel.getOrderById(id);
      if (!order) {
        return sendError(res, "Order not found", 404);
      }

      if (order.status === status) {
        return sendSuccess(res, `Order status is already ${status}`, { order }, 200);
      }

      // If status changed to Cancelled, restore stock
      if (status === "Cancelled" && order.status !== "Cancelled") {
        for (let item of order.items) {
          if (item.product_id) {
            await ProductModel.increaseStock(item.product_id, item.quantity);
          }
        }
      }
      // If status changed from Cancelled to something else, reduce stock again (with validation)
      else if (order.status === "Cancelled" && status !== "Cancelled") {
        for (let item of order.items) {
          if (item.product_id) {
            const product = await ProductModel.getById(item.product_id);
            if (!product || product.stock < item.quantity) {
              return sendError(
                res,
                `Cannot change status from Cancelled. Insufficient stock for product "${item.name}"`,
                400
              );
            }
          }
        }
        for (let item of order.items) {
          if (item.product_id) {
            await ProductModel.reduceStock(item.product_id, item.quantity);
          }
        }
      }

      await OrderModel.updateOrderStatus(id, status);
      const updatedOrder = await OrderModel.getOrderById(id);

      return sendSuccess(res, "Order status updated successfully", { order: updatedOrder }, 200);
    } catch (error) {
      console.error("Update Order Status Error:", error.message);
      return sendError(res, "Failed to update order status: " + error.message, 500);
    }
  },
};

export default orderController;
