import { validationResult } from "express-validator";

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMsg = errors
      .array()
      .map((err) => `${err.path || err.param || "field"}: ${err.msg}`)
      .join("; ");
    return res.status(400).json({
      success: false,
      message: `Validation failed: ${errorMsg}`,
      errors: errors.array(),
    });
  }
  next();
};

export default validate;
