export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, 'NOT_FOUND', message);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(400, 'BAD_REQUEST', message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(401, 'UNAUTHORIZED', message);
  }
}
