"use server";

import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createSession, hashPassword, verifyPassword } from "@/lib/auth";
import { cookies } from "next/headers";

const COOKIE_NAME = "ei_session";

export interface AuthFormState {
  error?: string;
}

async function setSession(token: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/dashboard");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) return { error: "Invalid credentials." };

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return { error: "Invalid credentials." };

    const token = await createSession({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    await setSession(token);
    redirect(redirectTo.startsWith("/") ? redirectTo : "/dashboard");
  } catch (error) {
    console.error("login action error", error);
    return { error: "Authentication service unavailable." };
  }
}

export async function registerAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const organization = String(
    formData.get("organization") ?? "EdgeInspect Aerospace"
  ).trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/dashboard");

  if (!name || !email || !password) {
    return { error: "Name, email and password are required." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  try {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return { error: "An account with this email already exists." };
    }

    const passwordHash = await hashPassword(password);
    const [user] = await db
      .insert(users)
      .values({
        email,
        name,
        passwordHash,
        organization,
        role: "INSPECTOR",
      })
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

    await setSession(token);
    redirect(redirectTo.startsWith("/") ? redirectTo : "/dashboard");
  } catch (error) {
    console.error("register action error", error);
    return { error: "Registration service unavailable." };
  }
}
