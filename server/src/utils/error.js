export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.statusCode = status; // Added for downstream compatibility
    Error.captureStackTrace(this, this.constructor);
  }
}

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);