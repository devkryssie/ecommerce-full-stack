import db from "../config/db.js";

const CategoryModel = {
  async create(name) {
    const [result] = await db.execute(
      "INSERT INTO categories (name) VALUES (?)",
      [name]
    );
    return { id: result.insertId, name };
  },

  async getAll() {
    const [rows] = await db.execute(
      "SELECT id, name, created_at, updated_at FROM categories ORDER BY name ASC"
    );
    return rows;
  },

  async getById(id) {
    const [rows] = await db.execute(
      "SELECT id, name, created_at, updated_at FROM categories WHERE id = ?",
      [id]
    );
    return rows[0] || null;
  },

  async update(id, name) {
    const [result] = await db.execute(
      "UPDATE categories SET name = ? WHERE id = ?",
      [name, id]
    );
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await db.execute(
      "DELETE FROM categories WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  }
};

export default CategoryModel;
