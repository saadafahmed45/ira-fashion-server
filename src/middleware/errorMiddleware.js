const errorMiddleware = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Log error for developers in development
  if (process.env.NODE_ENV === "development") {
    console.error("🔥 Error Caught:", err);
  }

  // Mongoose bad ObjectId (CastError)
  if (err.name === "CastError") {
    const message = `Resource not found with id of ${err.value}`;
    error.statusCode = 404;
    error.message = message;
  }

  // Mongoose duplicate key (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    const message = `Duplicate value entered for '${field}'. Please use another value.`;
    error.statusCode = 400;
    error.message = message;
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((val) => val.message);
    error.statusCode = 400;
    error.message = messages.join(", ");
    error.errors = messages;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    error.statusCode = 401;
    error.message = "Invalid token authorization signature";
  }

  if (err.name === "TokenExpiredError") {
    error.statusCode = 401;
    error.message = "Token has expired, please re-authenticate";
  }

  // Multer errors
  if (err.name === "MulterError") {
    error.statusCode = 400;
    error.message = err.message;
  }

  res.status(error.statusCode).json({
    success: false,
    statusCode: error.statusCode,
    message: error.message || "Internal Server Error",
    errors: error.errors || null,
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
};

module.exports = errorMiddleware;
