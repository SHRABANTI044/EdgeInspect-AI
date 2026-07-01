"use client";

import { useState } from "react";
import { DEFECT_COLORS } from "@/lib/constants";

export interface BoxDefect {
  type: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
  severity: string;
}

export default function BoundingBoxOverlay({
  defects,
  activeType,
}: {
  defects: BoxDefect[];
  activeType?: string | null;
}) {
  const [hover, setHover] = useState<string | null>(null);

  return (
    <div className="pointer-events-none absolute inset-0">
      {defects.map((d, i) => {
        const color = DEFECT_COLORS[d.type] ?? "#00E5FF";
        const dimmed = activeType && activeType !== d.type;
        return (
          <div
            key={i}
            className="absolute transition-all duration-300"
            style={{
              left: `${d.x * 100}%`,
              top: `${d.y * 100}%`,
              width: `${d.width * 100}%`,
              height: `${d.height * 100}%`,
              opacity: dimmed ? 0.2 : 1,
            }}
          >
            <div
              className="absolute inset-0 rounded-[3px] border-2"
              style={{
                borderColor: color,
                boxShadow: `0 0 12px ${color}aa, inset 0 0 14px ${color}33`,
                background: `${color}0d`,
              }}
            />
            {/* corner accents */}
            {["top-0 left-0", "top-0 right-0", "bottom-0 left-0", "bottom-0 right-0"].map(
              (pos) => (
                <span
                  key={pos}
                  className={`absolute ${pos} h-2.5 w-2.5`}
                  style={{ background: color }}
                />
              )
            )}
            {/* label */}
            <div
              className="absolute -top-[18px] left-0 flex items-center gap-1 whitespace-nowrap rounded px-1.5 py-0.5 font-mono text-[9px] font-bold leading-none text-[#04111e]"
              style={{ background: color, boxShadow: `0 0 10px ${color}99` }}
            >
              {d.type} · {(d.confidence * 100).toFixed(0)}%
            </div>
            <input
              aria-label={`defect ${d.type}`}
              className="pointer-events-auto absolute -top-[18px] left-0 h-4 w-full cursor-pointer opacity-0"
              onMouseEnter={() => setHover(d.type)}
              onMouseLeave={() => setHover(null)}
            />
            {hover === d.type && (
              <div
                className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-md px-2 py-1 font-mono text-[10px] text-white"
                style={{ background: "#04111e", border: `1px solid ${color}` }}
              >
                {d.severity}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
