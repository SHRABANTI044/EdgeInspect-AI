import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "ei_session";
const ALG = "HS256";

function getSecret(): Uint8Array {
  const secret =
    process.env.JWT_SECRET ||
    "edgeinspect-dev-secret-change-me-in-production-please-32+chars";
  return new TextEncoder().encode(secret);
}

const PROTECTED = [
  "/dashboard",
  "/live-inspection",
  "/image-upload",
  "/reports",
  "/analytics",
  "/maintenance",
  "/settings",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  let isAuthed = false;
  if (token) {
    try {
      await jwtVerify(token, getSecret(), { algorithms: [ALG] });
      isAuthed = true;
    } catch {
      isAuthed = false;
    }
  }

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));

  if (isProtected && !isAuthed) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/live-inspection/:path*",
    "/image-upload/:path*",
    "/reports/:path*",
    "/analytics/:path*",
    "/maintenance/:path*",
    "/settings/:path*",
  ],
};


