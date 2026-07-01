"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Radio,
  UploadCloud,
  FileText,
  BarChart3,
  Wrench,
  Settings,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

const NAV = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Live Inspection", href: "/live-inspection", icon: Radio },
  { label: "Image Upload", href: "/image-upload", icon: UploadCloud },
  { label: "Inspection Reports", href: "/reports", icon: FileText },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Maintenance", href: "/maintenance", icon: Wrench },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar({ userName }: { userName?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    router.push("/login");
    router.refresh();
  }

  const sidebar = (
    <aside className="h-screen w-[272px] shrink-0 flex-col gap-3 border-r border-[#0e2540] bg-[#06101d]/80 px-3 py-5 backdrop-blur-xl lg:flex">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 pb-4">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#00AEEF] to-[#007fb0] glow-primary">
          <ShieldCheck className="h-5 w-5 text-[#04111e]" />
          <span className="absolute inset-0 rounded-xl border border-[#00E5FF]/40" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-white">EdgeInspect</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#00E5FF]">AI · Aerospace</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                active ? "bg-[#00aeef1a] text-white" : "text-[#8aa3c0] hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-6 -translate-y-1/2 w-[3px] rounded-r-full bg-gradient-to-b from-[#00E5FF] to-[#00AEEF] shadow-[0_0_10px_#00E5FF]" />
              )}
              <Icon className={`h-[18px] w-[18px] transition-colors ${active ? "text-[#00E5FF]" : "text-[#5f7a99] group-hover:text-[#9fc3e6]"}`} />
              <span className="truncate">{item.label}</span>
              {active && <ChevronRight className="ml-auto h-4 w-4 text-[#00E5FF]" />}
            </Link>
          );
        })}
      </nav>

      {/* Status */}
      <div className="rounded-xl border border-[#0e2540] bg-[#07121f]/60 p-3">
        <div className="flex items-center gap-2">
          <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-[#22E58A] text-[#22E58A]" />
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#7d96b3]">Edge Inference Online</span>
        </div>
        <p className="mt-1 font-mono text-[10px] text-[#4d6480]">model ei-edge-cnn-v2.4.1</p>
      </div>

      {/* User / logout */}
      <div className="mt-1 flex items-center gap-3 rounded-xl border border-[#0e2540] bg-[#07121f]/60 p-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#1a3a55] to-[#0d2238] text-sm font-bold text-[#00E5FF]">
          {(userName ?? "I").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{userName ?? "Inspector"}</p>
          <p className="font-mono text-[10px] text-[#5f7a99]">AUTHENTICATED</p>
        </div>
        <button
          onClick={logout}
          disabled={loggingOut}
          title="Sign out"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8aa3c0] transition-colors hover:bg-[#ff3b5c1a] hover:text-[#FF3B5C]"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-[#0e2540] bg-[#06101d]/80 px-4 py-3 backdrop-blur-xl lg:hidden">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#0e2540] text-[#9fc3e6]"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[#00E5FF]" />
          <span className="text-sm font-bold text-white">EdgeInspect</span>
        </div>
        <div className="h-9 w-9" />
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[272px] overflow-y-auto border-r border-[#0e2540] bg-[#06101d]">
            {sidebar}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block">{sidebar}</div>
    </>
  );
}