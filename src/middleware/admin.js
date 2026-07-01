import { sendError } from "../utils/response.js";

const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return sendError(res, "Access denied, admin privilege required", 403);
  }
};

export default admin;
