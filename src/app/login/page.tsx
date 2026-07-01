"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  Radar,
  ScanLine,
  Cpu,
  Activity,
} from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const redirectTo = params.get("redirect") || "/dashboard";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, remember }),
      });

      let data: any;
      try {
        data = await res.json();
      } catch {
        throw new Error("Server error. Please try again.");
      }

      if (!res.ok) {
        throw new Error(data?.error ?? "Authentication failed.");
      }

      window.location.assign(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
      setLoading(false);
    }
  }

  const FEATURES = [
    { icon: Radar, text: "Real-time defect detection" },
    { icon: Cpu, text: "Edge AI inference" },
    { icon: Activity, text: "Live inspection feed" },
    { icon: ScanLine, text: "Automated reporting" },
  ];

  return (
    <div className="relative flex min-h-screen overflow-x-hidden lg:grid-cols-2">
      <AnimatedBackground />

      {/* Left side - Dynamic Aerospace Panel */}
      <div className="relative hidden lg:flex lg:flex-col lg:justify-between p-10 overflow-hidden">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#00AEEF]/15 via-transparent to-[#A78BFA]/10" />

        {/* Top branding */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
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
          </div>
        </div>

        {/* Center content with animated rings */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          {/* Animated radar rings */}
          <div className="relative mb-8 flex h-64 w-64 items-center justify-center">
            <div className="radar-ring absolute h-full w-full rounded-full border border-[#00E5FF]/30" />
            <div className="radar-ring absolute h-48 w-48 rounded-full border border-[#00E5FF]/25" />
            <div className="radar-ring absolute h-32 w-32 rounded-full border border-[#00E5FF]/20" />
            <div className="radar-sweep absolute h-full w-full rounded-full opacity-60" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#00AEEF]/20 backdrop-blur">
              <ShieldCheck className="h-10 w-10 text-[#00E5FF]" />
            </div>
          </div>

          <h2 className="mb-4 text-center text-4xl font-bold leading-tight text-white">
            Intelligent Aircraft
            <br />
            <span className="bg-gradient-to-r from-[#00E5FF] via-[#00AEEF] to-[#A78BFA] bg-clip-text text-transparent glow-text">
              Inspection
            </span>
          </h2>
          <p className="max-w-md text-center text-base font-medium text-white">
            Real-time defect detection powered by Edge AI. Detect cracks, corrosion, dents and structural anomalies instantly.
          </p>
        </div>

        {/* Bottom features list */}
        <div className="relative z-10 space-y-3">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.text}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.8 + i * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#00E5FF]/30 bg-[#00E5FF]/[0.08]">
                <feature.icon className="h-4 w-4 text-[#00E5FF]" />
              </div>
              <span className="text-sm text-[#c9d8e8]">{feature.text}</span>
            </motion.div>
          ))}
        </div>

        {/* Floating orbs for extra dynamism */}
        <div className="absolute -right-20 top-20 h-40 w-40 rounded-full bg-[#00E5FF]/10 blur-3xl" />
        <div className="absolute -left-10 bottom-20 h-32 w-32 rounded-full bg-[#A78BFA]/10 blur-3xl" />
      </div>

      {/* Right side - Login Card */}
      <div className="relative z-10 flex items-center justify-center px-6 py-12 lg:px-10 lg:pr-16 xl:pr-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="w-full max-w-lg"
        >
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#00AEEF] to-[#007fb0] glow-primary">
              <ShieldCheck className="h-6 w-6 text-[#04111e]" />
            </div>
            <div>
              <p className="text-base font-bold text-white">EdgeInspect AI</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#00E5FF]">
                Identity Verification
              </p>
            </div>
          </div>

          <div className="mb-8 hidden lg:block">
            <h1 className="text-3xl font-bold text-white">Welcome back</h1>
            <p className="mt-2 text-sm text-[#9fb6d1]">
              Sign in to access the inspection console and manage your fleet inspections.
            </p>
          </div>

          <div className="mb-8 lg:hidden">
            <h1 className="text-2xl font-bold text-white">Access Console</h1>
            <p className="mt-1.5 text-sm text-[#9fb6d1]">
              Authenticate to enter the inspection operating system.
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-[#FF3B5C]/30 bg-[#FF3B5C]/[0.08] px-4 py-3 text-sm text-[#FF3B5C]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div className="group rounded-2xl border border-[#0e2540] bg-[#07121f]/70 px-4 py-3.5 transition-all focus-within:border-[#00E5FF]/50 focus-within:shadow-[0_0_24px_rgba(0,229,255,0.15)]">
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

            <div className="group rounded-2xl border border-[#0e2540] bg-[#07121f]/70 px-4 py-3.5 transition-all focus-within:border-[#00E5FF]/50 focus-within:shadow-[0_0_24px_rgba(0,229,255,0.15)]">
              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[#7d96b3]">
                Password
              </label>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#5f7a99]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
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

            <div className="flex items-center justify-between text-xs text-[#9fb6d1]">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-[#0e2540] bg-[#07121f]"
                />
                Remember Me
              </label>
              <button type="button" className="font-semibold text-[#00E5FF] hover:underline">
                Forgot Password
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Signing in…
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#9fb6d1]">
            Need an account?{" "}
            <Link href="/register" className="font-semibold text-[#00E5FF] hover:underline">
              Create one
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}