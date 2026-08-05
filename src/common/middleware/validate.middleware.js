const ApiResponse = require("../utils/apiResponse");

const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    if (parsed.body) req.body = parsed.body;
    if (parsed.query) req.query = parsed.query;
    if (parsed.params) req.params = parsed.params;
    next();
  } catch (error) {
    const errorMessages = error.errors
      ? error.errors.map((err) => `${err.path.join(".")}: ${err.message}`)
      : [error.message];
    return ApiResponse.error(res, "Validation failed", 400, errorMessages);
  }
};

module.exports = validate;
