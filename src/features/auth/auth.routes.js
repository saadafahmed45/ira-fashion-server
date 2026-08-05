const express = require("express");
const { syncUser, makeAdmin, logout } = require("./auth.controller");

const router = express.Router();

// Firebase user sync — creates or updates user in DB, returns JWT + sets HttpOnly cookie
router.post("/sync", syncUser);

// Promote a user to admin by email (dev/setup use only)
router.post("/make-admin", makeAdmin);

// Clear the HttpOnly session cookie on logout
router.post("/logout", logout);

module.exports = router;

