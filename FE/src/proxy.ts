import { NextResponse } from 'next/server'

// Next.js 16 renamed the "middleware" convention to "proxy".
//
// Auth is enforced CLIENT-SIDE by ProtectedLayout (redirects unauthenticated users
// to /login and wrong-role users to their home). We intentionally do NOT guard here:
// the JWT is stored in localStorage (zustand persist), which server middleware cannot
// read, so any check at this layer would be blind. Moving the token into an httpOnly
// cookie is the prerequisite for a real server-side guard — a deliberate follow-up,
// out of scope for the demo. This pass-through is kept only so the matcher stays wired.
export function proxy() {
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except api, Next internals, favicon, and the MSW worker.
    '/((?!api|_next/static|_next/image|favicon.ico|mockServiceWorker.js).*)',
  ],
}
