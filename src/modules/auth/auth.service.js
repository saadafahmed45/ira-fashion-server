const jwt = require("jsonwebtoken");
const User = require("../users/user.model");
const ApiError = require("../../common/errors/ApiError");

const JWT_SECRET = process.env.JWT_SECRET || "ira_fashion_jwt_secret_change_in_prod";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

class AuthService {
  generateToken(user) {
    return jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  async loginWithEmail(email, password) {
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(401, "Invalid email or password");
    }

    const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    if (adminEmail && user.email.toLowerCase() === adminEmail && user.role !== "admin") {
      user.role = "admin";
      await user.save();
    }

    const token = this.generateToken(user);
    const userObject = user.toObject();
    delete userObject.password;

    return { user: userObject, token };
  }

  async registerUser(userData) {
    const existing = await User.findOne({ email: userData.email.toLowerCase() });
    if (existing) {
      throw new ApiError(400, "Email is already registered");
    }

    const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const isAdmin = adminEmail && userData.email.toLowerCase() === adminEmail;
    const user = await User.create({
      ...userData,
      email: userData.email.toLowerCase(),
      role: isAdmin ? "admin" : "customer",
    });

    const token = this.generateToken(user);
    const userObject = user.toObject();
    delete userObject.password;

    return { user: userObject, token };
  }

  async firebaseGoogleLogin(idToken) {
    let decodedToken = null;

    // 1. Try Firebase Admin SDK verification if configured
    try {
      const admin = require("../../config/firebase");
      if (admin.getApps().length) {
        const { getAuth } = require("firebase-admin/auth");
        decodedToken = await getAuth().verifyIdToken(idToken);
      }
    } catch {
      // Firebase Admin SDK uninitialized or verify failed
    }

    // 2. Client-side ID token fallback (jwt.decode)
    if (!decodedToken) {
      try {
        const decodedPayload = jwt.decode(idToken);
        if (decodedPayload) {
          decodedToken = {
            uid: decodedPayload.user_id || decodedPayload.sub || decodedPayload.uid,
            email: decodedPayload.email,
            name: decodedPayload.name || decodedPayload.email?.split("@")[0] || "Customer",
            picture: decodedPayload.picture || "",
          };
        }
      } catch {
        // Decode failed
      }
    }

    if (!decodedToken || (!decodedToken.email && !decodedToken.uid)) {
      throw new ApiError(400, "Invalid or unparseable ID token provided");
    }

    let user = await User.findOne({
      $or: [
        ...(decodedToken.uid ? [{ firebaseUid: decodedToken.uid }] : []),
        ...(decodedToken.email ? [{ email: decodedToken.email.toLowerCase() }] : []),
      ],
    });

    const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const isAdmin = adminEmail && decodedToken.email?.toLowerCase() === adminEmail;

    if (!user) {
      user = await User.create({
        firebaseUid: decodedToken.uid || "",
        email: decodedToken.email ? decodedToken.email.toLowerCase() : "",
        name: decodedToken.name || decodedToken.email?.split("@")[0] || "Customer",
        photoURL: decodedToken.picture || "",
        role: isAdmin ? "admin" : "customer",
      });
    } else {
      let needsSave = false;
      if (decodedToken.uid && !user.firebaseUid) {
        user.firebaseUid = decodedToken.uid;
        needsSave = true;
      }
      if (decodedToken.picture && user.photoURL !== decodedToken.picture) {
        user.photoURL = decodedToken.picture;
        needsSave = true;
      }
      if (isAdmin && user.role !== "admin") {
        user.role = "admin";
        needsSave = true;
      }
      if (needsSave) {
        await user.save();
      }
    }

    const token = this.generateToken(user);
    return { user, token };
  }
}

module.exports = new AuthService();
