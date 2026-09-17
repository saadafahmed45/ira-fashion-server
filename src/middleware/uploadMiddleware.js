const multer = require("multer");
const { storage } = require("../config/cloudinary");
const ErrorResponse = require("../utils/errorResponse");

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new ErrorResponse("Only image files are allowed", 400), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter,
});

module.exports = upload;
