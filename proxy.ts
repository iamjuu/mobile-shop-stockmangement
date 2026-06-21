import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE = "stock_management_token";
const PROTECTED_PREFIXES = ["/admin", "/employee"];
const AUTH_ROUTES = ["/sign-in", "/sign-up"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = Boolean(request.cookies.get(AUTH_COOKIE)?.value);
  const isProtectedRoute = PROTECTED_PREFIXES.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (!isAuthenticated && isProtectedRoute) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL("/employee/billing", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)",
    "/(api|trpc)(.*)",
  ],
};
