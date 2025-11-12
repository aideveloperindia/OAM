export class AppError extends Error {
  readonly status: number
  readonly details?: unknown

  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.status = status
    this.details = details
  }
}

export const assertCondition = (condition: unknown, status: number, message: string) => {
  if (!condition) {
    throw new AppError(status, message)
  }
}


