import db from "../config/db.js";

const OrderModel = {
  async createOrder({ user_id, total_price, status = "Pending" }, connection) {
    const dbConn = connection || db;
    const [result] = await dbConn.execute(
      "INSERT INTO orders (user_id, total_price, status) VALUES (?, ?, ?)",
      [user_id, total_price, status]
    );
    return result.insertId;
  },

  async createOrderItem({ order_id, product_id, quantity, price }, connection) {
    const dbConn = connection || db;
    const [result] = await dbConn.execute(
      "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
      [order_id, product_id, quantity, price]
    );
    return result.insertId;
  },

  async getOrdersByUserId(userId) {
    const [orders] = await db.execute(
      "SELECT id, status, total_price, created_at, updated_at FROM orders WHERE user_id = ? ORDER BY id DESC",
      [userId]
    );

    for (let order of orders) {
      order.total_price = Number(order.total_price);
      const [items] = await db.execute(
        `SELECT oi.id AS order_item_id, oi.product_id, oi.quantity, oi.price, p.name 
         FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [order.id]
      );
      for (let item of items) {
        item.price = Number(item.price);
        item.subtotal = Number((item.quantity * item.price).toFixed(2));
      }
      order.items = items;
    }

    return orders;
  },

  async getOrderById(orderId) {
    const [rows] = await db.execute(
      `SELECT o.*, u.email, u.first_name, u.last_name, u.phone
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.id = ?`,
      [orderId]
    );
    if (!rows[0]) return null;

    const order = rows[0];
    order.total_price = Number(order.total_price);

    const [items] = await db.execute(
      `SELECT oi.id AS order_item_id, oi.product_id, oi.quantity, oi.price,
              p.name, p.slug
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    for (let item of items) {
      if (item.product_id) {
        const [images] = await db.execute(
          "SELECT id, image_url FROM product_images WHERE product_id = ?",
          [item.product_id]
        );
        item.images = images;
      } else {
        item.images = [];
      }
      item.price = Number(item.price);
      item.subtotal = Number((item.quantity * item.price).toFixed(2));
    }

    order.items = items;
    return order;
  },

  async getAllOrders() {
    const [orders] = await db.execute(
      `SELECT o.*, u.email, u.first_name, u.last_name
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       ORDER BY o.id DESC`
    );

    for (let order of orders) {
      order.total_price = Number(order.total_price);
      const [items] = await db.execute(
        `SELECT oi.id AS order_item_id, oi.product_id, oi.quantity, oi.price, p.name 
         FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [order.id]
      );
      for (let item of items) {
        item.price = Number(item.price);
        item.subtotal = Number((item.quantity * item.price).toFixed(2));
      }
      order.items = items;
    }

    return orders;
  },

  async updateOrderStatus(orderId, status) {
    const [result] = await db.execute(
      "UPDATE orders SET status = ? WHERE id = ?",
      [status, orderId]
    );
    return result.affectedRows > 0;
  },
};

export default OrderModel;
