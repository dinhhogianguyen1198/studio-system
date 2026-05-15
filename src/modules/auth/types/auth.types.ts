export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "EMAIL_ALREADY_EXISTS"
  | "ROLE_NOT_FOUND"
  | "UNKNOWN"

export interface AuthError {
  code: AuthErrorCode
  message: string
}

export interface RegisterResult {
  id: string
  email: string
  name: string | null
}
