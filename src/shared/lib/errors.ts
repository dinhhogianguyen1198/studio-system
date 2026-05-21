/**
 * Shared application error classes.
 * Service layer throws these; action layer catches and converts to ActionResult.
 */

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message)
    this.name = "AppError"
    // Ensure instanceof checks work after transpilation
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource}_NOT_FOUND`, `${resource} không tồn tại`, 404)
    this.name = "NotFoundError"
  }
}

export class ConflictError extends AppError {
  constructor(code: string, message: string) {
    super(code, message, 409)
    this.name = "ConflictError"
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Không có quyền thực hiện thao tác này") {
    super("FORBIDDEN", message, 403)
    this.name = "ForbiddenError"
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super("VALIDATION_ERROR", message, 400)
    this.name = "ValidationError"
  }
}

/** Type-guard: check if unknown value is an AppError */
export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError
}

/** Extract error message from unknown; fallback to provided string */
export function toErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof AppError) return err.message
  if (err instanceof Error) return err.message
  if (typeof err === "string") return err
  return fallback
}
