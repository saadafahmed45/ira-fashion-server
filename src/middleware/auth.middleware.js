const jwt = require("jsonwebtoken");
const User = require("../features/users/user.model");

const JWT_SECRET = process.env.JWT_SECRET || "ira_fashion_jwt_secret_change_in_prod";

const verifyToken = async (req, res, next) => {
  try {
    // 1. Try Authorization header (Bearer token — used by Axios interceptor)
    const authHeader = req.headers.authorization;
    let token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    // 2. Fall back to HttpOnly cookie (set by server on login)
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "Access denied. Token missing." });
    }


    // Try local JWT first
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user) {
        req.user = {
          id: user._id,
          firebaseUid: user.firebaseUid,
          email: user.email,
          name: user.name,
          role: user.role,
        };
        return next();
      }
    } catch {
      // Not a valid JWT — fall through to Firebase check
    }

    // Try Firebase Admin SDK if configured
    try {
      const admin = require("../config/firebase");
      if (admin.getApps().length) {
        const { getAuth } = require("firebase-admin/auth");
        const firebaseUser = await getAuth().verifyIdToken(token);

        let localUser = await User.findOne({ firebaseUid: firebaseUser.uid });
        if (!localUser) {
          localUser = await User.create({
            firebaseUid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.name || firebaseUser.email?.split("@")[0] || "User",
            photoURL: firebaseUser.picture || "",
            role: firebaseUser.email?.toLowerCase() === (process.env.ADMIN_EMAIL || "").toLowerCase() ? "admin" : "customer",
          });
        }

        req.user = {
          id: localUser._id,
          firebaseUid: localUser.firebaseUid,
          email: localUser.email,
          name: localUser.name,
          role: localUser.role,
        };
        return next();
      }
    } catch {
      // Firebase Admin unavailable or token invalid
    }

    return res.status(401).json({ success: false, message: "Invalid or expired token." });
  } catch (error) {
    next(error);
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Forbidden. Admin access required." });
  }
  next();
};

const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Forbidden. Insufficient permissions." });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireRole,
};
