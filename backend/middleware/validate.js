/**
 * Generic schema-validation middleware. Validates req.body against a Zod
 * schema and rejects (400) anything that doesn't strictly match — wrong
 * types, missing fields, out-of-range lengths, malformed formats — rather
 * than attempting to sanitize or coerce bad input into something usable.
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      return res.status(400).json({
        message: firstIssue?.message
          ? `Invalid ${firstIssue.path.join(".")}: ${firstIssue.message}`
          : "Invalid request body",
      });
    }

    // Replace req.body with the parsed (trimmed/typed) data so downstream
    // code only ever sees data that already matched the schema exactly.
    req.body = result.data;
    next();
  };
}