import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ScanLine,
  Boxes,
  ShieldCheck,
  Timer,
  UploadCloud,
  ArrowUpRight,
  Cpu,
  Radar,
  TrendingUp,
} from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import {
  getDashboardStats,
  getRecentInspections,
  getSeverityBreakdown,
} from "@/lib/queries";
import {
  GlassCard,
  StatCard,
  SeverityBadge,
  SectionTitle,
  EmptyState,
  ProgressBar,
} from "@/components/Primitives";

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default async function DashboardPage() {
  const session = await getSessionUser();
  if (!session) return redirect("/login");

  const [stats, recent, breakdown] = await Promise.all([
    getDashboardStats(session.sub),
    getRecentInspections(session.sub, 6),
    getSeverityBreakdown(session.sub),
  ]);

  const firstName = session.name.split(" ")[0];
  const totalSeverity = stats.critical + stats.warning + stats.info + stats.clean;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="fade-up flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#5f7a99]">Welcome back, Operator</p>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Hello, {firstName}.</h1>
          <p className="mt-1 text-sm text-[#9fb6d1]">Real-time aerospace inspection overview computed from stored operational data.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/live-inspection" className="btn-ghost flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm">
            <Radar className="h-4 w-4" /> Live Scan
          </Link>
          <Link href="/image-upload" className="btn-primary flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm">
            <UploadCloud className="h-4 w-4" /> New Inspection
          </Link>
        </div>
      </div>

      <div className="fade-up grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Inspections" value={stats.totalInspections} icon={<ScanLine className="h-5 w-5" />} accent="#00AEEF" trend={`${stats.totalDefects} defects found`} />
        <StatCard label="Defects Detected" value={stats.totalDefects} icon={<Boxes className="h-5 w-5" />} accent="#FF8A3D" trend={`${stats.critical} critical · ${stats.warning} warning`} />
        <StatCard label="Avg Confidence" value={`${Math.round(stats.avgConfidence * 100)}%`} icon={<TrendingUp className="h-5 w-5" />} accent="#22E58A" trend="across all detections" />
        <StatCard label="Avg Inference" value={`${stats.avgProcessingMs}`} unit="ms" icon={<Timer className="h-5 w-5" />} accent="#A78BFA" trend="edge pipeline latency" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="p-5">
          <SectionTitle title="Inspection Outcomes" subtitle="Severity distribution" />
          {totalSeverity === 0 ? (
            <EmptyState icon={<ShieldCheck className="h-7 w-7" />} title="No inspections yet" subtitle="Run your first scan to populate telemetry." />
          ) : (
            <div className="space-y-4">
              {[
                ["Critical", stats.critical, "#FF3B5C"],
                ["Warning", stats.warning, "#FF8A3D"],
                ["Info", stats.info, "#00AEEF"],
                ["Pass", stats.clean, "#22E58A"],
              ].map(([label, value, color]) => (
                <div key={String(label)}>
                  <div className="mb-1 flex items-center justify-between font-mono text-[11px]">
                    <span className="text-[#9fb6d1]">{label}</span>
                    <span style={{ color: String(color) }}>{value as number}</span>
                  </div>
                  <ProgressBar value={totalSeverity ? (value as number) / totalSeverity : 0} color={String(color)} />
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-5">
          <SectionTitle title="Defects by Type" subtitle="Last 30 days" />
          {breakdown.length === 0 ? (
            <EmptyState icon={<Cpu className="h-7 w-7" />} title="No defect records" subtitle="Defect classes will appear after inspections are stored." />
          ) : (
            <div className="space-y-4">
              {breakdown.slice(0, 6).map((item) => {
                const max = Math.max(...breakdown.map((b) => b.total), 1);
                return (
                  <div key={item.type}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-white">{item.type}</span>
                      <span className="font-mono text-[#00E5FF]">{item.total}</span>
                    </div>
                    <ProgressBar value={item.total / max} color="#00E5FF" />
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-5">
          <SectionTitle title="Detection Confidence" subtitle="Operational quality" />
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#0e2540] bg-[#07121f]/60 p-5 text-center">
              <p className="text-4xl font-bold text-[#00E5FF] glow-text">{Math.round(stats.avgConfidence * 100)}%</p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-[#5f7a99]">Average confidence</p>
            </div>
            <div className="space-y-2 font-mono text-[11px] text-[#9fb6d1]">
              <div className="flex items-center justify-between rounded-lg border border-[#0e2540] bg-[#07121f]/50 px-3 py-2">
                <span className="text-[#5f7a99]">Pass rate</span>
                <span className="text-[#c9d8e8]">{stats.passRate}%</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[#0e2540] bg-[#07121f]/50 px-3 py-2">
                <span className="text-[#5f7a99]">Critical findings</span>
                <span className="text-[#c9d8e8]">{String(stats.critical)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[#0e2540] bg-[#07121f]/50 px-3 py-2">
                <span className="text-[#5f7a99]">Warning findings</span>
                <span className="text-[#c9d8e8]">{String(stats.warning)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[#0e2540] bg-[#07121f]/50 px-3 py-2">
                <span className="text-[#5f7a99]">Average inference</span>
                <span className="text-[#c9d8e8]">{stats.avgProcessingMs}ms</span>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="overflow-hidden">
        <div className="flex items-center justify-between p-5 pb-3">
          <SectionTitle title="Recent Inspections" subtitle="Latest scans across the fleet" />
          <Link href="/reports" className="flex items-center gap-1 font-mono text-xs text-[#00E5FF] hover:underline">
            View all <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <EmptyState
            icon={<Cpu className="h-7 w-7" />}
            title="No inspection records"
            subtitle="Upload an aircraft panel image to run real defect detection."
            action={
              <Link href="/image-upload" className="btn-primary flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm">
                <UploadCloud className="h-4 w-4" /> Start Inspection
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-y border-[#0e2540] text-left font-mono text-[10px] uppercase tracking-wider text-[#5f7a99]">
                  <th className="px-5 py-2.5 font-medium">Component</th>
                  <th className="px-5 py-2.5 font-medium">Aircraft</th>
                  <th className="px-5 py-2.5 font-medium">Defects</th>
                  <th className="px-5 py-2.5 font-medium">Confidence</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                  <th className="px-5 py-2.5 font-medium">Time</th>
                  <th className="px-5 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id} className="border-b border-[#0e2540]/60 transition-colors hover:bg-[#00aeef0a]">
                    <td className="px-5 py-3 text-sm font-medium text-white">{r.component}</td>
                    <td className="px-5 py-3 text-sm text-[#9fb6d1]">{r.aircraftType}</td>
                    <td className="px-5 py-3"><span className="font-mono text-sm text-[#00E5FF]">{r.defectCount}</span></td>
                    <td className="px-5 py-3"><span className="font-mono text-sm text-[#c9d8e8]">{Math.round(r.confidenceAvg * 100)}%</span></td>
                    <td className="px-5 py-3"><SeverityBadge level={r.maxSeverity} size="sm" /></td>
                    <td className="px-5 py-3 font-mono text-xs text-[#5f7a99]">{timeAgo(r.createdAt)}</td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/reports/${r.id}`} className="inline-flex items-center gap-1 rounded-lg border border-[#0e2540] px-2.5 py-1 text-xs text-[#9fc3e6] hover:border-[#00E5FF]/40 hover:text-[#00E5FF]">
                        Report <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}