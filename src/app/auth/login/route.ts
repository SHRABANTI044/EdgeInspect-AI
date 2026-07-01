import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, createSession, COOKIE_NAME } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/dashboard");

  if (!email || !password) {
    return NextResponse.redirect(new URL("/login?error=missing", request.url));
  }

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return NextResponse.redirect(new URL("/login?error=invalid", request.url));
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.redirect(new URL("/login?error=invalid", request.url));
    }

    const token = await createSession({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const target = redirectTo.startsWith("/") ? redirectTo : "/dashboard";
    const response = NextResponse.redirect(new URL(target, request.url));
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error) {
    console.error("form login error", error);
    return NextResponse.redirect(new URL("/login?error=server", request.url));
  }
}
