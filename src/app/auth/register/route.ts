import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, createSession, COOKIE_NAME } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const organization = String(formData.get("organization") ?? "EdgeInspect Aerospace").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/dashboard");

  if (!name || !email || !password) {
    return NextResponse.redirect(new URL("/login?mode=register&error=missing", request.url));
  }

  if (password.length < 6) {
    return NextResponse.redirect(new URL("/login?mode=register&error=password", request.url));
  }

  try {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return NextResponse.redirect(new URL("/login?mode=register&error=exists", request.url));
    }

    const passwordHash = await hashPassword(password);
    const [user] = await db
      .insert(users)
      .values({ email, name, passwordHash, organization, role: "INSPECTOR" })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
      });

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
    console.error("form register error", error);
    return NextResponse.redirect(new URL("/login?mode=register&error=server", request.url));
  }
}
