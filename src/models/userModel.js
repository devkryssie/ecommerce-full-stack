import db from "../config/db.js";

const UserModel = {
  async findById(id) {
    const [rows] = await db.execute(
      "SELECT id, first_name, last_name, email, phone, role, created_at, updated_at FROM users WHERE id = ?",
      [id]
    );
    return rows[0] || null;
  },

  async findByIdWithPassword(id) {
    const [rows] = await db.execute(
      "SELECT id, first_name, last_name, email, password, phone, role, created_at, updated_at FROM users WHERE id = ?",
      [id]
    );
    return rows[0] || null;
  },

  async updateProfile(id, { first_name, last_name, phone }) {
    await db.execute(
      "UPDATE users SET first_name = ?, last_name = ?, phone = ? WHERE id = ?",
      [first_name, last_name, phone, id]
    );
    return this.findById(id);
  },

  async updatePassword(id, hashedPassword) {
    const [result] = await db.execute(
      "UPDATE users SET password = ? WHERE id = ?",
      [hashedPassword, id]
    );
    return result.affectedRows > 0;
  }
};

export default UserModel;
