const admin = require("firebase-admin");

// Initialize Firebase Admin SDK if not already initialized
if (!admin.getApps().length) {
  try {
    // Check if we have service account credentials in environment variables
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Handle newline characters in private key
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
      console.log("✅ Firebase Admin SDK Initialized");
    } else {
      console.warn("⚠️ Firebase Admin credentials missing. Auth verification routes will fail.");
    }
  } catch (error) {
    console.error("❌ Firebase Admin Initialization Error:", error.message);
  }
}

module.exports = admin;
