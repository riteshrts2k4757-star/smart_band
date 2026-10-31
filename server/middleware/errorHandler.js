/**
 * Central error handling middleware.
 * Ensures no sensitive API keys or stack traces are leaked to the client.
 */
export function errorHandler(err, req, res, next) {
  // Safe logging without credentials
  console.error(`[API Error] ${req.method} ${req.url}:`, err.message || err);

  const status = err.status || (err.message && err.message.includes('not found') ? 404 : 500);

  res.status(status).json({
    success: false,
    error: err.message || 'An unexpected error occurred while communicating with the routing service.'
  });
}

