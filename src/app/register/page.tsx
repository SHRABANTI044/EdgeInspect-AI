"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  EyeOff,
  Eye,
  User,
  Building2,
} from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("EdgeInspect Aerospace");
  const [password, setPassword] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password, organization: org }),
      });

      let data: any;
      try {
        data = await res.json();
      } catch {
        throw new Error("Server error. Please try again.");
      }

      if (!res.ok) {
        throw new Error(data?.error ?? "Registration failed.");
      }

      window.location.assign("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen overflow-x-hidden lg:grid-cols-2">
      <AnimatedBackground />

      {/* Left side - Dynamic Aerospace Panel */}
      <div className="relative hidden lg:flex lg:flex-col lg:justify-between p-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#A78BFA]/15 via-transparent to-[#00AEEF]/10" />

        <div className="relative z-10">
          <Link href="/login" className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#00AEEF] to-[#007fb0] glow-primary">
              <ShieldCheck className="h-6 w-6 text-[#04111e]" />
              <span className="absolute inset-0 rounded-xl border border-[#00E5FF]/40" />
            </div>
            <div>
              <p className="text-base font-bold text-white">EdgeInspect AI</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#00E5FF]">
                Aerospace Operating System
              </p>
            </div>
          </Link>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center">
          <div className="relative mb-8 flex h-64 w-64 items-center justify-center">
            <div className="radar-ring absolute h-full w-full rounded-full border border-[#A78BFA]/30" />
            <div className="radar-ring absolute h-48 w-48 rounded-full border border-[#A78BFA]/25" />
            <div className="radar-ring absolute h-32 w-32 rounded-full border border-[#A78BFA]/20" />
            <div className="radar-sweep absolute h-full w-full rounded-full opacity-60" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#A78BFA]/20 backdrop-blur">
              <ShieldCheck className="h-10 w-10 text-[#A78BFA]" />
            </div>
          </div>

          <h2 className="mb-4 text-center text-4xl font-bold leading-tight text-white">
            Join the
            <br />
            <span className="bg-gradient-to-r from-[#A78BFA] via-[#00AEEF] to-[#22E58A] bg-clip-text text-transparent glow-text">
              Mission
            </span>
          </h2>
          <p className="max-w-md text-center text-base font-medium text-white">
            Create your account to access real-time defect detection, inspection reports, and predictive maintenance tools.
          </p>
        </div>

        <div className="relative z-10">
          <p className="text-center font-mono text-[11px] uppercase tracking-wider text-[#5f7a99]">
            Secure · Encrypted · Mission-Ready
          </p>
        </div>

        <div className="absolute -right-20 top-20 h-40 w-40 rounded-full bg-[#A78BFA]/10 blur-3xl" />
        <div className="absolute -left-10 bottom-20 h-32 w-32 rounded-full bg-[#00AEEF]/10 blur-3xl" />
      </div>

      {/* Right side - Register Card */}
      <div className="relative z-10 flex items-center justify-center px-6 py-12 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="w-full max-w-lg"
        >
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Link href="/login" className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#00AEEF] to-[#007fb0] glow-primary">
                <ShieldCheck className="h-6 w-6 text-[#04111e]" />
              </div>
              <div>
                <p className="text-base font-bold text-white">EdgeInspect AI</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#00E5FF]">
                  Identity Verification
                </p>
              </div>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Create account</h1>
            <p className="mt-2 text-sm text-[#9fb6d1]">
              Register to join the inspection command center.
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-[#FF3B5C]/30 bg-[#FF3B5C]/[0.08] px-4 py-3 text-sm text-[#FF3B5C]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div className="group rounded-2xl border border-[#0e2540] bg-[#07121f]/70 px-4 py-3.5 transition-all focus-within:border-[#A78BFA]/50 focus-within:shadow-[0_0_24px_rgba(167,139,250,0.15)]">
              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[#7d96b3]">
                Full Name
              </label>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-[#5f7a99]" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Inspector Name"
                  required
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#4d6480]"
                />
              </div>
            </div>

            <div className="group rounded-2xl border border-[#0e2540] bg-[#07121f]/70 px-4 py-3.5 transition-all focus-within:border-[#A78BFA]/50 focus-within:shadow-[0_0_24px_rgba(167,139,250,0.15)]">
              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[#7d96b3]">
                Organization
              </label>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#5f7a99]" />
                <input
                  type="text"
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                  placeholder="EdgeInspect Aerospace"
                  required
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#4d6480]"
                />
              </div>
            </div>

            <div className="group rounded-2xl border border-[#0e2540] bg-[#07121f]/70 px-4 py-3.5 transition-all focus-within:border-[#A78BFA]/50 focus-within:shadow-[0_0_24px_rgba(167,139,250,0.15)]">
              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[#7d96b3]">
                Email
              </label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#5f7a99]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@aerospace.io"
                  required
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#4d6480]"
                />
              </div>
            </div>

            <div className="group rounded-2xl border border-[#0e2540] bg-[#07121f]/70 px-4 py-3.5 transition-all focus-within:border-[#A78BFA]/50 focus-within:shadow-[0_0_24px_rgba(167,139,250,0.15)]">
              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[#7d96b3]">
                Password
              </label>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#5f7a99]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#4d6480]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-[#5f7a99] hover:text-[#9fc3e6]"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#A78BFA] to-[#00AEEF] px-6 py-3.5 text-sm font-semibold text-[#04111e]"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Creating account…
                </>
              ) : (
                <>
                  Create Account <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#9fb6d1]">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[#00E5FF] hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}