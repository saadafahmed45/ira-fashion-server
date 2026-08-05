class ApiResponse {
  constructor(statusCode, data, message = "Success", meta = null) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    if (data !== undefined) this.data = data;
    if (meta) this.meta = meta;
  }

  static success(res, data, message = "Success", statusCode = 200, meta = null) {
    return res.status(statusCode).json(new ApiResponse(statusCode, data, message, meta));
  }

  static error(res, message = "Error", statusCode = 500, errors = null) {
    const response = {
      success: false,
      statusCode,
      message,
    };
    if (errors) response.errors = errors;
    return res.status(statusCode).json(response);
  }
}

module.exports = ApiResponse;
