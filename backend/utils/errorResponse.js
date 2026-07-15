/**
 * Sends a safe error response: detailed message in development, generic
 * message in production, while always logging full details server-side.
 */
export function sendError(res, statusCode, publicMessage, err, context = "") {
  if (err) {
    console.error(`${context ? `[${context}] ` : ""}Error:`, err);
  }

  const isProd = process.env.NODE_ENV === "production";
  const detail = isProd ? undefined : err?.message;

  res.status(statusCode).json({
    message: publicMessage,
    ...(detail ? { error: detail } : {}),
  });
}