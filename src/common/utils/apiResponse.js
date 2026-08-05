class ApiResponse {
  static success(res, data = null, message = "Success", statusCode = 200, meta = null) {
    const responseBody = {
      success: true,
      statusCode,
      message,
      ...(data !== null && { data }),
      ...(meta !== null && { meta }),
    };
    return res.status(statusCode).json(responseBody);
  }

  static error(res, message = "An error occurred", statusCode = 400, errors = null) {
    const responseBody = {
      success: false,
      statusCode,
      message,
      ...(errors !== null && { errors }),
    };
    return res.status(statusCode).json(responseBody);
  }
}

module.exports = ApiResponse;
