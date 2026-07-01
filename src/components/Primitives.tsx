import { type ReactNode, type HTMLAttributes } from "react";

export function GlassCard({
  children,
  className = "",
  hover = false,
  ...props
}: {
  children: ReactNode;
  hover?: boolean;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`glass rounded-[20px] ${hover ? "glass-hover" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

const SEVERITY: Record<string, { color: string; bg: string; label: string }> = {
  CRITICAL: { color: "#FF3B5C", bg: "rgba(255,59,92,0.14)", label: "CRITICAL" },
  WARNING: { color: "#FF8A3D", bg: "rgba(255,138,61,0.14)", label: "WARNING" },
  INFO: { color: "#00AEEF", bg: "rgba(0,174,239,0.14)", label: "INFO" },
  CLEAN: { color: "#22E58A", bg: "rgba(34,229,138,0.14)", label: "PASS" },
};

export function SeverityBadge({
  level,
  size = "md",
}: {
  level: string;
  size?: "sm" | "md";
}) {
  const s = SEVERITY[level] ?? SEVERITY.INFO;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-mono font-semibold uppercase tracking-wider ${
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
      }`}
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.color}44` }}
    >
      <span
        className="pulse-dot inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: s.color, color: s.color }}
      />
      {s.label}
    </span>
  );
}

export function StatCard({
  label,
  value,
  unit,
  icon,
  accent = "#00AEEF",
  trend,
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon?: ReactNode;
  accent?: string;
  trend?: string;
}) {
  return (
    <GlassCard hover className="relative overflow-hidden p-5">
      <div
        className="absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl"
        style={{ background: `${accent}33` }}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#7d96b3]">
            {label}
          </p>
          <div className="mt-2 flex items-baseline gap-1">
            <span
              className="text-3xl font-bold tracking-tight"
              style={{ color: "#eaf4ff" }}
            >
              {value}
            </span>
            {unit && (
              <span className="text-sm font-medium text-[#7d96b3]">{unit}</span>
            )}
          </div>
          {trend && (
            <p className="mt-1 font-mono text-[11px] text-[#5f7a99]">{trend}</p>
          )}
        </div>
        {icon && (
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{
              background: `${accent}1f`,
              border: `1px solid ${accent}44`,
              color: accent,
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

export function ProgressBar({
  value,
  color = "#00E5FF",
  height = 6,
}: {
  value: number;
  color?: string;
  height?: number;
}) {
  return (
    <div
      className="w-full overflow-hidden rounded-full"
      style={{ height, background: "rgba(255,255,255,0.06)" }}
    >
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${Math.min(100, Math.max(0, value * 100))}%`,
          background: `linear-gradient(90deg, ${color}aa, ${color})`,
          boxShadow: `0 0 12px ${color}99`,
        }}
      />
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-[#eaf4ff]">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 text-sm text-[#7d96b3]">{subtitle}</p>
        )}
      </div>
      {right}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00aeef12] text-[#00AEEF]">
          {icon}
        </div>
      )}
      <p className="text-base font-semibold text-[#c9d8e8]">{title}</p>
      {subtitle && (
        <p className="mt-1 max-w-sm text-sm text-[#7d96b3]">{subtitle}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
