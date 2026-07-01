import bcrypt from "bcrypt";
import AuthModel from "../models/authModel.js";
import generateToken from "../utils/generateToken.js";
import { sendSuccess, sendError } from "../utils/response.js";

const authController = {
  async register(req, res) {
    try {
      const { first_name, last_name, email, password, phone, role } = req.body;

      // Check if user already exists
      const existingUser = await AuthModel.findUserByEmail(email);
      if (existingUser) {
        return sendError(res, "Email already registered", 400);
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user (role default is customer, unless explicitly admin, but typically we protect admin role or allow user-provided for testing)
      const userId = await AuthModel.createUser({
        first_name,
        last_name,
        email,
        password: hashedPassword,
        phone,
        role: role || "customer",
      });

      // Fetch newly created user details (excluding password)
      const user = await AuthModel.findUserByEmail(email);
      delete user.password;

      // Generate token
      const token = generateToken(userId);

      return sendSuccess(res, "Registration successful", { user, token }, 201);
    } catch (error) {
      console.error("Register Error:", error.message);
      return sendError(res, "Registration failed: " + error.message, 500);
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await AuthModel.findUserByEmail(email);
      if (!user) {
        return sendError(res, "Invalid email or password", 401);
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return sendError(res, "Invalid email or password", 401);
      }

      // Exclude password from response
      delete user.password;

      // Generate token
      const token = generateToken(user.id);

      return sendSuccess(res, "Login successful", { user, token }, 200);
    } catch (error) {
      console.error("Login Error:", error.message);
      return sendError(res, "Login failed: " + error.message, 500);
    }
  },

  async getMe(req, res) {
    try {
      // req.user is set by auth middleware
      return sendSuccess(res, "User profile retrieved successfully", { user: req.user }, 200);
    } catch (error) {
      console.error("GetMe Error:", error.message);
      return sendError(res, "Failed to retrieve profile: " + error.message, 500);
    }
  },
};

export default authController;
