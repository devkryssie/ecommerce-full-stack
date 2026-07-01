import db from "../config/db.js";

const CartModel = {
  async getOrCreateCart(userId) {
    const [rows] = await db.execute("SELECT id FROM cart WHERE user_id = ?", [
      userId,
    ]);
    if (rows[0]) {
      return rows[0].id;
    }
    const [result] = await db.execute("INSERT INTO cart (user_id) VALUES (?)", [
      userId,
    ]);
    return result.insertId;
  },

  async addItem(cartId, productId, quantity) {
    await db.execute(
      `INSERT INTO cart_items (cart_id, product_id, quantity) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
      [cartId, productId, quantity, quantity]
    );
  },

  async updateQuantity(cartId, productId, quantity) {
    const [result] = await db.execute(
      "UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND product_id = ?",
      [quantity, cartId, productId]
    );
    return result.affectedRows > 0;
  },

  async removeItem(cartId, productId) {
    const [result] = await db.execute(
      "DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?",
      [cartId, productId]
    );
    return result.affectedRows > 0;
  },

  async clearCart(cartId, connection) {
    const dbConn = connection || db;
    const [result] = await dbConn.execute(
      "DELETE FROM cart_items WHERE cart_id = ?",
      [cartId]
    );
    return result.affectedRows > 0;
  },

  async getCartDetails(cartId) {
    const [items] = await db.execute(
      `SELECT ci.id AS cart_item_id, ci.product_id, ci.quantity, 
              p.name, p.slug, p.price, p.stock
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = ?`,
      [cartId]
    );

    let cartTotal = 0;

    for (let item of items) {
      const [images] = await db.execute(
        "SELECT id, image_url, public_id FROM product_images WHERE product_id = ?",
        [item.product_id]
      );
      item.images = images;
      item.price = Number(item.price);
      item.subtotal = Number((item.quantity * item.price).toFixed(2));
      cartTotal += item.subtotal;
    }

    return {
      items,
      cartTotal: Number(cartTotal.toFixed(2)),
    };
  },

  async getCartByUserId(userId) {
    const cartId = await this.getOrCreateCart(userId);
    return this.getCartDetails(cartId);
  },
};

export default CartModel;
