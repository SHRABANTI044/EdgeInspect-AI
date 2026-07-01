"use client";

import { useState, useEffect } from "react";

export default function AnimatedBackground() {
  const [particles, setParticles] = useState<
    { id: number; left: number; size: number; delay: number; duration: number; opacity: number }[]
  >([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 10 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 1 + Math.random() * 3,
        delay: Math.random() * 18,
        duration: 14 + Math.random() * 18,
        opacity: 0.2 + Math.random() * 0.6,
      }))
    );
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#07111F]">
      {/* base gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_-10%,#0d2a44_0%,#07111F_55%,#04101c_100%)]" />

      {/* digital grid */}
      <div className="grid-bg absolute inset-0" />

      {/* moving gradient orbs */}
      <div
        className="orb"
        style={{
          width: 520,
          height: 520,
          top: "-12%",
          left: "-8%",
          background:
            "radial-gradient(circle,rgba(0,174,239,0.55),transparent 60%)",
        }}
      />
      <div
        className="orb"
        style={{
          width: 460,
          height: 460,
          bottom: "-15%",
          right: "-6%",
          animationDelay: "6s",
          background:
            "radial-gradient(circle,rgba(0,229,255,0.4),transparent 60%)",
        }}
      />
      <div
        className="orb"
        style={{
          width: 380,
          height: 380,
          top: "30%",
          right: "20%",
          animationDelay: "11s",
          opacity: 0.25,
          background:
            "radial-gradient(circle,rgba(167,139,250,0.4),transparent 60%)",
        }}
      />

      {/* particles - rendered only on client after hydration */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="particle"
          style={{
            left: `${p.left}%`,
            bottom: "-10px",
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}

      {/* vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.55)_100%)]" />
    </div>
  );
}