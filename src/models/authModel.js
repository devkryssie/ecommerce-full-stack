import db from "../config/db.js";

const AuthModel = {
  async createUser({ first_name, last_name, email, password, phone, role = "customer" }) {
    const [result] = await db.execute(
      "INSERT INTO users (first_name, last_name, email, password, phone, role) VALUES (?, ?, ?, ?, ?, ?)",
      [first_name, last_name, email, password, phone, role]
    );
    return result.insertId;
  },

  async findUserByEmail(email) {
    const [rows] = await db.execute(
      "SELECT id, first_name, last_name, email, password, phone, role, created_at, updated_at FROM users WHERE email = ?",
      [email]
    );
    return rows[0] || null;
  }
};

export default AuthModel;
