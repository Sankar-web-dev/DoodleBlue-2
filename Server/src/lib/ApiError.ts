export interface ApiErrorDetail {
  field: string;
  message: string;
}

/**
 * Typed application error thrown by services.
 * Mapped to the standard error envelope by the central error handler in app.ts.
 */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: ApiErrorDetail[];

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: ApiErrorDetail[]
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}
