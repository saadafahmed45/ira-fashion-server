const jwt = require("jsonwebtoken");
const User = require("../../modules/users/user.model");
const ApiResponse = require("../utils/apiResponse");

const JWT_SECRET = process.env.JWT_SECRET || "ira_fashion_jwt_secret_change_in_prod";

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return ApiResponse.error(res, "Access denied. Authentication token missing.", 401);
    }

    const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();

    // 1. Try local JWT verification first
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user) {
        if (adminEmail && user.email.toLowerCase() === adminEmail && user.role !== "admin") {
          user.role = "admin";
          await user.save();
        }
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
      // Token not signed by local JWT_SECRET, proceed to Firebase checks
    }

    // 2. Try Firebase Admin SDK if configured
    try {
      const admin = require("../../config/firebase");
      if (admin.getApps().length) {
        const { getAuth } = require("firebase-admin/auth");
        const firebaseUser = await getAuth().verifyIdToken(token);

        let localUser = await User.findOne({
          $or: [{ firebaseUid: firebaseUser.uid }, { email: firebaseUser.email }],
        });

        const isAdmin = adminEmail && firebaseUser.email?.toLowerCase() === adminEmail;

        if (!localUser) {
          localUser = await User.create({
            firebaseUid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.name || firebaseUser.email?.split("@")[0] || "Customer",
            photoURL: firebaseUser.picture || "",
            role: isAdmin ? "admin" : "customer",
          });
        } else if (isAdmin && localUser.role !== "admin") {
          localUser.role = "admin";
          await localUser.save();
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
      // Firebase Admin SDK unavailable or failed
    }

    // 3. Fallback: Decode Firebase ID Token payload (client-side Firebase token fallback)
    try {
      const decodedPayload = jwt.decode(token);
      if (decodedPayload) {
        const userEmail = (decodedPayload.email || decodedPayload.user_id || "").toLowerCase();
        const userUid = decodedPayload.user_id || decodedPayload.sub || decodedPayload.uid;

        if (userEmail || userUid) {
          let localUser = await User.findOne({
            $or: [
              ...(userEmail ? [{ email: userEmail }] : []),
              ...(userUid ? [{ firebaseUid: userUid }] : []),
            ],
          });

          const isAdmin = adminEmail && (userEmail === adminEmail || localUser?.email?.toLowerCase() === adminEmail);

          if (!localUser && userEmail) {
            localUser = await User.create({
              firebaseUid: userUid || "",
              email: userEmail,
              name: decodedPayload.name || userEmail.split("@")[0] || "Customer",
              photoURL: decodedPayload.picture || "",
              role: isAdmin ? "admin" : "customer",
            });
          } else if (localUser && isAdmin && localUser.role !== "admin") {
            localUser.role = "admin";
            await localUser.save();
          }

          if (localUser) {
            req.user = {
              id: localUser._id,
              firebaseUid: localUser.firebaseUid,
              email: localUser.email,
              name: localUser.name,
              role: localUser.role,
            };
            return next();
          }
        }
      }
    } catch {
      // Decode fallback failed
    }

    return ApiResponse.error(res, "Invalid or expired token.", 401);
  } catch (error) {
    next(error);
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return ApiResponse.error(res, "Forbidden. Admin access required.", 403);
  }
  next();
};

const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return ApiResponse.error(res, "Forbidden. Insufficient permissions.", 403);
    }
    next();
  };
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireRole,
};
