"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  Activity,
  Menu,
  LogOut,
} from "lucide-react";

const TITLES: Record<string, string> = {
  "/dashboard": "Mission Control",
  "/live-inspection": "Live Inspection Feed",
  "/image-upload": "Image Analysis Console",
  "/reports": "Inspection Reports",
  "/analytics": "Analytics & Telemetry",
  "/maintenance": "Maintenance Operations",
  "/settings": "System Settings",
};

export default function TopBar() {
  const pathname = usePathname();
  const [now, setNow] = useState<string>("");
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => {
      setNow(
        new Date().toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) {
          setUserName(data.user.name);
          setUserRole(data.user.role);
        }
      })
      .catch(() => {});
  }, []);

  const title =
    Object.entries(TITLES).find(
      ([k]) => pathname === k || pathname.startsWith(k + "/")
    )?.[1] ?? "EdgeInspect AI";

  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  async function logout() {
    await fetch("/api/auth/me", { method: "DELETE", credentials: "include" });
    window.location.assign("/login");
  }

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-[#0e2540] bg-[#06101d]/80 px-4 py-3 backdrop-blur-xl lg:px-7">
      <div className="min-w-0">
        <p className="hidden lg:block font-mono text-[11px] uppercase tracking-[0.22em] text-[#5f7a99]">
          EdgeInspect AI // Operating System
        </p>
        <h1 className="truncate text-base font-semibold text-[#eaf4ff] lg:text-base">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-lg border border-[#0e2540] bg-[#07121f]/60 px-3 py-1.5 sm:flex">
          <Activity className="h-3.5 w-3.5 text-[#22E58A]" />
          <span className="font-mono text-[11px] text-[#7d96b3]">SYS NOMINAL</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-[#00E5FF]/20 bg-[#00E5FF]/[0.06] px-3 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]" />
          <span className="font-mono text-sm font-medium text-[#00E5FF] tabular-nums">
            {now || "--:--:--"} UTC{-new Date().getTimezoneOffset() / 60 >= 0 ? "+" : ""}
            {-new Date().getTimezoneOffset() / 60}
          </span>
        </div>

        {userName && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-xl border border-[#0e2540] bg-[#07121f]/60 px-3 py-2"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#1a3a55] to-[#0d2238] text-xs font-bold text-[#00E5FF]">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-white">{userName}</p>
                <p className="font-mono text-[10px] text-[#5f7a99]">{userRole ?? "OPERATOR"}</p>
              </div>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[#0e2540] bg-[#07121f] p-2">
                <div className="mb-2 border-b border-[#0e2540] pb-2">
                  <p className="text-sm font-semibold text-white">{userName}</p>
                  <p className="font-mono text-[11px] text-[#9fb6d1]">{userRole ?? "OPERATOR"}</p>
                </div>
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[#FF3B5C] transition-colors hover:bg-[#ff3b5c15]"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}