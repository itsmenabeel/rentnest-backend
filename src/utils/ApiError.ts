export class ApiError extends Error {
  public statusCode: number;
  public errorDetails?: unknown;

  constructor(statusCode: number, message: string, errorDetails?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.errorDetails = errorDetails;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(message: string, errorDetails?: unknown) {
    return new ApiError(400, message, errorDetails);
  }
  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }
  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }
  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }
  static conflict(message: string, errorDetails?: unknown) {
    return new ApiError(409, message, errorDetails);
  }
  static internal(message = 'Internal server error') {
    return new ApiError(500, message);
  }
}
