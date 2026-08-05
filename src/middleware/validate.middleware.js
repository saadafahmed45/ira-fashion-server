const { ZodError } = require("zod");

const validate = (schema) => (req, res, next) => {
  let parsed;
  try {
    // Parse checks body, query, and params and returns coerced/preprocessed objects
    parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      const errorDetails = err.issues.map((e) => ({
        field: e.path.slice(1).join("."), // e.g. body.title -> title
        message: e.message,
      }));
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Validation failed",
        errors: errorDetails,
      });
    }
    return next(err);
  }

  // Assign validated/preprocessed values back to the request object
  req.body = parsed.body;
  req.query = parsed.query;
  req.params = parsed.params;
  
  next();
};

module.exports = validate;
