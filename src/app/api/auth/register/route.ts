import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, createSession, COOKIE_NAME } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let email = "";
    let name = "";
    let password = "";
    let organization = "EdgeInspect Aerospace";

    if (contentType.includes("application/json")) {
      const body = await request.json();
      email = String(body?.email ?? "").trim().toLowerCase();
      name = String(body?.name ?? "").trim();
      password = String(body?.password ?? "");
      organization = String(body?.organization ?? "EdgeInspect Aerospace");
    } else {
      const form = await request.formData();
      email = String(form.get("email") ?? "").trim().toLowerCase();
      name = String(form.get("name") ?? "").trim();
      password = String(form.get("password") ?? "");
      organization = String(form.get("organization") ?? "EdgeInspect Aerospace");
    }

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required." },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
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
        organization: users.organization,
      });

    const token = await createSession({
      sub: user!.id,
      email: user!.email,
      name: user!.name,
      role: user!.role,
    });

    const response = NextResponse.json({ user }, { status: 201 });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    console.error("register error", err);
    return NextResponse.json(
      { error: "Registration service unavailable." },
      { status: 500 }
    );
  }
}
