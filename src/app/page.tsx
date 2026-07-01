"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ShieldCheck,
  ScanLine,
  Cpu,
  Activity,
  Boxes,
  Radar,
  FileText,
  ArrowRight,
  Plane,
  Gauge,
  Zap,
} from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";

const FEATURES = [
  {
    icon: ScanLine,
    title: "Real-Time Detection",
    desc: "Live defect detection with bounding-box visualization on every scan.",
    accent: "#00AEEF",
  },
  {
    icon: Cpu,
    title: "Edge AI Inference",
    desc: "On-device model execution optimized for constrained aerospace hardware.",
    accent: "#00E5FF",
  },
  {
    icon: Plane,
    title: "Aircraft Safety",
    desc: "Mission-ready reliability with deterministic preprocessing and validation.",
    accent: "#22E58A",
  },
  {
    icon: Activity,
    title: "Predictive Maintenance",
    desc: "Trend analysis and defect patterns to reduce downtime and risk.",
    accent: "#A78BFA",
  },
  {
    icon: FileText,
    title: "Inspection Reports",
    desc: "Automated, export-ready inspection records with severity classifications.",
    accent: "#FF8A3D",
  },
  {
    icon: Gauge,
    title: "Performance Metrics",
    desc: "Real-time monitoring of inference latency, throughput, and confidence.",
    accent: "#00E5FF",
  },
];

const STATS = [
  { label: "Defect Classes", value: "12+" },
  { label: "Inference Speed", value: "< 50ms" },
  { label: "Accuracy", value: "98.5%" },
  { label: "Edge Optimized", value: "Yes" },
];

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, 100]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  return (
    <div className="relative overflow-x-hidden" ref={containerRef}>
      <AnimatedBackground />

      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-5"
      >
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#00AEEF] to-[#007fb0] glow-primary">
            <ShieldCheck className="h-5 w-5 text-[#04111e]" />
            <span className="absolute inset-0 rounded-xl border border-[#00E5FF]/40" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">EdgeInspect AI</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#00E5FF]">
              Aerospace OS
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="btn-primary rounded-xl px-5 py-2 text-sm font-medium"
          >
            Sign In
          </Link>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-8 lg:pt-20"
      >
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#00E5FF]/25 bg-[#00E5FF]/[0.06] px-4 py-2">
              <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-[#22E58A] text-[#22E58A]" />
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#9fc3e6]">
                Edge AI · Real-Time Defect Detection
              </span>
            </div>

            <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Aerospace{" "}
              <span className="bg-gradient-to-r from-[#00E5FF] via-[#00AEEF] to-[#A78BFA] bg-clip-text text-transparent glow-text">
                Inspection
              </span>
              <br />
              Reimagined
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-[#9fb6d1] sm:text-lg">
              Detect cracks, corrosion, dents, scratches and structural defects instantly using Edge AI
              with real-time intelligent inspection for aircraft safety.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/login"
                className="btn-primary inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm"
              >
                Sign In to Console <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {STATS.map((stat) => (
                <div key={stat.label} className="text-center sm:text-left">
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-[#5f7a99]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.4 }}
            className="relative hidden lg:block"
          >
            <div className="glass relative overflow-hidden rounded-[28px] p-3">
              <div className="relative overflow-hidden rounded-[22px]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#00AEEF]/20 to-transparent" />
                <div className="flex h-[460px] items-center justify-center">
                  <div className="relative flex h-48 w-48 items-center justify-center">
                    <div className="radar-ring absolute h-full w-full rounded-full border border-[#00E5FF]/40" />
                    <div className="radar-ring absolute h-24 w-24 rounded-full border border-[#00E5FF]/30" style={{ inset: "25%" }} />
                    <div className="radar-sweep absolute h-full w-full rounded-full" />
                    <Plane className="relative z-10 h-16 w-16 text-[#00E5FF] drop-shadow-[0_0_18px_rgba(0,229,255,0.8)]" />
                  </div>
                </div>
                {/* HUD overlay */}
                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-lg border border-[#00E5FF]/30 bg-[#04111e]/80 px-3 py-1.5 backdrop-blur">
                  <Radar className="h-3.5 w-3.5 text-[#00E5FF]" />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#9fc3e6]">
                    Scanning · Wing Upper
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-[#7d96b3]">
                      Anomalies
                    </p>
                    <p className="text-3xl font-bold text-white">03</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-[#7d96b3]">
                      Confidence
                    </p>
                    <p className="text-3xl font-bold text-[#22E58A] glow-text">92%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* floating radar chip */}
            <div className="glass absolute -right-6 -top-6 hidden h-24 w-24 items-center justify-center rounded-2xl sm:flex">
              <div className="relative h-14 w-14">
                <div className="radar-ring absolute h-full w-full rounded-full border border-[#00E5FF]/40" />
                <div className="radar-ring absolute h-7 w-7 rounded-full border border-[#00E5FF]/30" style={{ inset: "18%" }} />
                <div className="radar-sweep absolute h-full w-full rounded-full" />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Features */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#00E5FF]">
            Platform Capabilities
          </p>
          <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
            Built for aerospace excellence
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              <div className="glass glass-hover h-full rounded-[20px] p-6">
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{
                    background: `${f.accent}1a`,
                    border: `1px solid ${f.accent}44`,
                    color: f.accent,
                  }}
                >
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#9fb6d1]">
                  {f.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-16">
        <div className="glass relative overflow-hidden rounded-[24px] p-10 text-center lg:p-16">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00AEEF]/10 via-transparent to-[#A78BFA]/10" />
          <div className="relative">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Ready to elevate your inspection workflow?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[#9fb6d1]">
              Sign in to start real-time defect detection and review digital inspection records.
            </p>
            <Link href="/login" className="btn-primary mt-7 inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm">
              Sign In <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#0e2540] px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#00E5FF]" />
            <span className="text-sm text-[#7d96b3]">
              EdgeInspect AI — Real-Time Aircraft Defect Detection
            </span>
          </div>
          <p className="font-mono text-[11px] text-[#4d6480]">
            v2.4.1 · Edge Inference Engine
          </p>
        </div>
      </footer>
    </div>
  );
}