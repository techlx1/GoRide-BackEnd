import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    // Check for Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    // Extract token
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "Invalid token format" });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    next();
  } catch (error) {
    console.error("❌ JWT Verification Failed:", error.message);
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};
