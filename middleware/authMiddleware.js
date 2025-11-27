import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // No Authorization header at all
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization header missing",
      });
    }

    // Format must be: Bearer <token>
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        success: false,
        message: "Invalid Authorization format",
      });
    }

    const token = parts[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token missing",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach clean user object
    req.user = {
      id: decoded.id,
      email: decoded.email || null,
      role: decoded.role || "driver",
    };

    next();
  } catch (error) {
    console.error("❌ JWT Verification Error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please log in again.",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid or unauthorized token",
    });
  }
};
