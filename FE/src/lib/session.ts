// Lightweight auth-session bridge shared by the API layer (lib/api) and the auth
// store (store/auth). Kept dependency-free so neither side has to import the other
// (avoids a circular import) while still letting apiFetch attach the token and
// trigger a global logout on 401.
let authToken: string | null = null
let onUnauthorized: (() => void) | null = null

export function setAuthToken(token: string | null): void {
  authToken = token
}

export function getAuthToken(): string | null {
  return authToken
}

/** Registered once by the auth store; invoked by apiFetch on any 401. */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler
}

export function notifyUnauthorized(): void {
  onUnauthorized?.()
}
