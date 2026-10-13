import { NextRequest, NextResponse } from "next/server";

// Matches the express-session cookie name (Server SESSION_COOKIE_NAME, default "sms.sid").
// The cookie is set on the localhost domain by the /api rewrite proxy, so it's
// visible to middleware regardless of the API port.
const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME || "sms.sid";

/**
 * Page-level guard. The backend `authenticate` middleware only protects API
 * routes — Next.js can still serve protected pages without a session. This
 * checks the session cookie before render and redirects to /login when absent.
 * Note: it only verifies cookie *presence*; API routes still reject invalid
 * sessions, and the dashboard's /auth/me call handles stale cookies.
 */
export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE);

  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
