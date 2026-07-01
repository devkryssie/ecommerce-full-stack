import jwt from "jsonwebtoken";
import { sendError } from "../utils/response.js";
import UserModel from "../models/userModel.js";

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await UserModel.findById(decoded.id);

      if (!user) {
        return sendError(res, "Not authorized, user not found", 401);
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("Token verification error:", error.message);
      return sendError(res, "Not authorized, token failed", 401);
    }
  }

  if (!token) {
    return sendError(res, "Not authorized, no token", 401);
  }
};

export default protect;
