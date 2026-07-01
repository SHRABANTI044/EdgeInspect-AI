"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, RotateCcw, LayoutDashboard } from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App route error:", error);
  }, [error]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-x-hidden px-6 py-12">
      <AnimatedBackground />
      <div className="glass w-full max-w-xl rounded-[24px] p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ff8a3d14] text-[#FF8A3D]">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-white">Protected page failed to load</h1>
        <p className="mt-2 text-sm text-[#9fb6d1]">
          The application hit a runtime error while rendering this page. The
          route now has a dedicated fallback so navigation won&apos;t silently die.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="btn-primary flex items-center gap-2 rounded-xl px-5 py-3 text-sm"
          >
            <RotateCcw className="h-4 w-4" /> Retry
          </button>
          <Link
            href="/dashboard"
            className="btn-ghost flex items-center gap-2 rounded-xl px-5 py-3 text-sm"
          >
            <LayoutDashboard className="h-4 w-4" /> Dashboard Home
          </Link>
        </div>
        {error.digest && (
          <p className="mt-4 font-mono text-[11px] text-[#5f7a99]">
            digest: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
