"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";

const COLORS = {
  CRITICAL: "#FF3B5C",
  WARNING: "#FF8A3D",
  INFO: "#00AEEF",
  CLEAN: "#22E58A",
};

const tooltipStyle = {
  background: "rgba(7,17,29,0.95)",
  border: "1px solid rgba(0,229,255,0.25)",
  borderRadius: 12,
  color: "#eaf4ff",
  fontSize: 12,
  fontFamily: "var(--font-jetbrains), monospace",
};

export function SeverityDonut({
  critical,
  warning,
  info,
  clean,
}: {
  critical: number;
  warning: number;
  info: number;
  clean: number;
}) {
  const data = [
    { name: "Critical", value: critical, color: COLORS.CRITICAL },
    { name: "Warning", value: warning, color: COLORS.WARNING },
    { name: "Info", value: info, color: COLORS.INFO },
    { name: "Pass", value: clean, color: COLORS.CLEAN },
  ].filter((d) => d.value > 0);
  const total = critical + warning + info + clean;

  return (
    <div className="relative h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={58}
            outerRadius={82}
            paddingAngle={3}
            stroke="none"
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} cursor={false} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white">{total}</span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#5f7a99]">
          Scans
        </span>
      </div>
    </div>
  );
}

export function TypeBars({
  data,
}: {
  data: { type: string; count: number }[];
}) {
  const palette = [
    "#00E5FF",
    "#00AEEF",
    "#A78BFA",
    "#22E58A",
    "#FF8A3D",
    "#FF3B5C",
    "#FFD23D",
  ];
  const chartData = (data.length ? data : [{ type: "No data", count: 0 }]).map(
    (d, i) => ({ ...d, fill: palette[i % palette.length] })
  );
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="type"
          tick={{ fill: "#7d96b3", fontSize: 10, fontFamily: "monospace" }}
          tickLine={false}
          axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
          interval={0}
          angle={-18}
          textAnchor="end"
          height={50}
        />
        <YAxis
          tick={{ fill: "#7d96b3", fontSize: 11, fontFamily: "monospace" }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,229,255,0.06)" }} />
        <Bar dataKey="count" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendArea({
  data,
}: {
  data: { day: string; inspections: number; defects: number }[];
}) {
  const chartData = (
    data.length ? data : [{ day: "—", inspections: 0, defects: 0 }]
  ).map((d) => ({
    ...d,
    day: d.day.slice(5),
  }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={chartData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="gInspections" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00E5FF" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#00E5FF" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gDefects" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF8A3D" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#FF8A3D" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fill: "#7d96b3", fontSize: 10, fontFamily: "monospace" }}
          tickLine={false}
          axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
        />
        <YAxis
          tick={{ fill: "#7d96b3", fontSize: 11, fontFamily: "monospace" }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip contentStyle={tooltipStyle} />
        <Area
          type="monotone"
          dataKey="inspections"
          stroke="#00E5FF"
          strokeWidth={2}
          fill="url(#gInspections)"
        />
        <Area
          type="monotone"
          dataKey="defects"
          stroke="#FF8A3D"
          strokeWidth={2}
          fill="url(#gDefects)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ComponentBars({
  data,
}: {
  data: { component: string; count: number; defects: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 38)}>
      <BarChart
        layout="vertical"
        data={data.length ? data : [{ component: "No data", count: 0, defects: 0 }]}
        margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: "#7d96b3", fontSize: 11, fontFamily: "monospace" }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="component"
          tick={{ fill: "#9fc3e6", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={110}
        />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,229,255,0.06)" }} />
        <Bar dataKey="count" fill="#00AEEF" radius={[0, 6, 6, 0]} barSize={14} />
        <Bar dataKey="defects" fill="#00E5FF" radius={[0, 6, 6, 0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ConfidenceGauge({
  value,
}: {
  value: number;
}) {
  const data = [{ name: "conf", value: Math.round(value * 100), fill: "#00E5FF" }];
  return (
    <div className="relative h-[180px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="72%"
          outerRadius="100%"
          data={data}
          startAngle={220}
          endAngle={-40}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar background={{ fill: "rgba(255,255,255,0.05)" }} dataKey="value" cornerRadius={20} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-6">
        <span className="text-3xl font-bold text-[#00E5FF] glow-text">
          {Math.round(value * 100)}%
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#5f7a99]">
          Avg Confidence
        </span>
      </div>
    </div>
  );
}
