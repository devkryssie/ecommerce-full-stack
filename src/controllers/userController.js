import bcrypt from "bcrypt";
import UserModel from "../models/userModel.js";
import { sendSuccess, sendError } from "../utils/response.js";

const userController = {
  async updateProfile(req, res) {
    try {
      const { first_name, last_name, phone } = req.body;
      const userId = req.user.id;

      const updatedUser = await UserModel.updateProfile(userId, {
        first_name,
        last_name,
        phone,
      });

      return sendSuccess(res, "Profile updated successfully", { user: updatedUser }, 200);
    } catch (error) {
      console.error("Update Profile Error:", error.message);
      return sendError(res, "Failed to update profile: " + error.message, 500);
    }
  },

  async changePassword(req, res) {
    try {
      const { current_password, new_password } = req.body;
      const userId = req.user.id;

      // Find user with password to compare
      const user = await UserModel.findByIdWithPassword(userId);
      if (!user) {
        return sendError(res, "User not found", 404);
      }

      // Check current password
      const isMatch = await bcrypt.compare(current_password, user.password);
      if (!isMatch) {
        return sendError(res, "Incorrect current password", 400);
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(new_password, salt);

      // Save new password
      const success = await UserModel.updatePassword(userId, hashedPassword);
      if (!success) {
        return sendError(res, "Failed to change password", 500);
      }

      return sendSuccess(res, "Password changed successfully", {}, 200);
    } catch (error) {
      console.error("Change Password Error:", error.message);
      return sendError(res, "Failed to change password: " + error.message, 500);
    }
  },
};

export default userController;
