const ApiResponse = require("../utils/apiResponse");

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errors = err.errors || null;

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Resource not found. Invalid ${err.path}`;
  }

  // Handle Mongoose Validation Error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation Error";
    errors = Object.values(err.errors).map((val) => val.message);
  }

  // Handle Mongoose Duplicate Key Error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate field value entered: ${field}`;
  }

  // Handle JWT Errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token. Please log in again.";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Your token has expired. Please log in again.";
  }

  if (process.env.NODE_ENV === "development") {
    console.error("🚨 Error Stack:", err);
  }

  return ApiResponse.error(res, message, statusCode, errors);
};

module.exports = errorHandler;
