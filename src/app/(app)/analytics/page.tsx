import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import { inspections, defects } from "@/db/schema";
import { eq, sql, desc, gte, and } from "drizzle-orm";
import { GlassCard, SectionTitle, StatCard, EmptyState, ProgressBar, SeverityBadge } from "@/components/Primitives";
import { BarChart3, Activity, ShieldCheck, Timer, Boxes, TrendingUp } from "lucide-react";

export default async function AnalyticsPage() {
  const session = await getSessionUser();
  if (!session) return null;

  const userId = session.sub;
  const totals = await db
    .select({
      inspections: sql<number>`count(*)::int`,
      totalDefects: sql<number>`coalesce(sum(${inspections.defectCount}),0)::int`,
      avgConfidence: sql<number>`coalesce(avg(${inspections.confidenceAvg}),0)::float`,
      avgProcessingMs: sql<number>`coalesce(avg(${inspections.processingTimeMs}),0)::float`,
      critical: sql<number>`count(*) filter (where ${inspections.maxSeverity} = 'CRITICAL')::int`,
      warning: sql<number>`count(*) filter (where ${inspections.maxSeverity} = 'WARNING')::int`,
      clean: sql<number>`count(*) filter (where ${inspections.maxSeverity} = 'CLEAN')::int`,
      info: sql<number>`count(*) filter (where ${inspections.maxSeverity} = 'INFO')::int`,
    })
    .from(inspections)
    .where(eq(inspections.userId, userId));

  const byType = await db
    .select({ type: defects.type, count: sql<number>`count(*)::int` })
    .from(defects)
    .innerJoin(inspections, eq(defects.inspectionId, inspections.id))
    .where(eq(inspections.userId, userId))
    .groupBy(defects.type)
    .orderBy(desc(sql`count(*)`));

  const byComponent = await db
    .select({
      component: inspections.component,
      count: sql<number>`count(*)::int`,
      defects: sql<number>`coalesce(sum(${inspections.defectCount}),0)::int`,
    })
    .from(inspections)
    .where(eq(inspections.userId, userId))
    .groupBy(inspections.component)
    .orderBy(desc(sql`count(*)`));

  const since = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000);
  since.setHours(0, 0, 0, 0);
  const recentDays = await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${inspections.createdAt}), 'YYYY-MM-DD')`,
      inspections: sql<number>`count(*)::int`,
      defects: sql<number>`coalesce(sum(${inspections.defectCount}),0)::int`,
    })
    .from(inspections)
    .where(and(eq(inspections.userId, userId), gte(inspections.createdAt, since)))
    .groupBy(sql`date_trunc('day', ${inspections.createdAt})`)
    .orderBy(sql`date_trunc('day', ${inspections.createdAt})`);

  const t = totals[0];
  const totalInspections = Number(t?.inspections ?? 0);
  const passRate = totalInspections > 0 ? Math.round((Number(t?.clean ?? 0) / totalInspections) * 1000) / 10 : 0;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#5f7a99]">Analytics & Telemetry</p>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Operational Analytics</h1>
        <p className="mt-1 text-sm text-[#9fb6d1]">Every metric on this page is generated from stored inspection records.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Inspections" value={totalInspections} icon={<BarChart3 className="h-5 w-5" />} accent="#00AEEF" />
        <StatCard label="Defects" value={Number(t?.totalDefects ?? 0)} icon={<Boxes className="h-5 w-5" />} accent="#FF8A3D" />
        <StatCard label="Pass Rate" value={`${passRate}%`} icon={<ShieldCheck className="h-5 w-5" />} accent="#22E58A" />
        <StatCard label="Avg Inference" value={`${Math.round(Number(t?.avgProcessingMs ?? 0) * 10) / 10}`} unit="ms" icon={<Timer className="h-5 w-5" />} accent="#A78BFA" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="p-5">
          <SectionTitle title="Severity Breakdown" subtitle="Inspection outcomes" />
          {totalInspections === 0 ? (
            <EmptyState icon={<Activity className="h-7 w-7" />} title="No telemetry yet" subtitle="Run inspections to populate analytics." />
          ) : (
            <div className="space-y-4">
              {[
                ["Critical", Number(t?.critical ?? 0), "#FF3B5C"],
                ["Warning", Number(t?.warning ?? 0), "#FF8A3D"],
                ["Info", Number(t?.info ?? 0), "#00AEEF"],
                ["Pass", Number(t?.clean ?? 0), "#22E58A"],
              ].map(([label, value, color]) => (
                <div key={String(label)}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-white">{label}</span>
                    <span style={{ color: String(color) }} className="font-mono">{value as number}</span>
                  </div>
                  <ProgressBar value={totalInspections ? (value as number) / totalInspections : 0} color={String(color)} />
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-5">
          <SectionTitle title="Defects by Type" subtitle="Stored detections" />
          {byType.length === 0 ? (
            <EmptyState icon={<Boxes className="h-7 w-7" />} title="No defect classes yet" subtitle="Detections will appear here automatically." />
          ) : (
            <div className="space-y-4">
              {byType.map((item) => {
                const max = Math.max(...byType.map((x) => x.count), 1);
                return (
                  <div key={item.type}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-white">{item.type}</span>
                      <span className="font-mono text-[#00E5FF]">{item.count}</span>
                    </div>
                    <ProgressBar value={item.count / max} color="#00E5FF" />
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-5">
          <SectionTitle title="Confidence Quality" subtitle="Average detector output" />
          <div className="rounded-2xl border border-[#0e2540] bg-[#07121f]/60 p-5 text-center">
            <p className="text-4xl font-bold text-[#00E5FF] glow-text">{Math.round(Number(t?.avgConfidence ?? 0) * 100)}%</p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-[#5f7a99]">Average confidence</p>
          </div>
          <div className="mt-4 space-y-2 font-mono text-[11px] text-[#9fb6d1]">
            <div className="flex items-center justify-between rounded-lg border border-[#0e2540] bg-[#07121f]/50 px-3 py-2"><span className="text-[#5f7a99]">Recent active days</span><span>{recentDays.length}</span></div>
            <div className="flex items-center justify-between rounded-lg border border-[#0e2540] bg-[#07121f]/50 px-3 py-2"><span className="text-[#5f7a99]">Total defects</span><span>{Number(t?.totalDefects ?? 0)}</span></div>
            <div className="flex items-center justify-between rounded-lg border border-[#0e2540] bg-[#07121f]/50 px-3 py-2"><span className="text-[#5f7a99]">Pass rate</span><span>{passRate}%</span></div>
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard className="p-5">
          <SectionTitle title="Component Risk" subtitle="Inspections vs defect totals" />
          {byComponent.length === 0 ? (
            <EmptyState icon={<TrendingUp className="h-7 w-7" />} title="No components yet" subtitle="Component analytics will appear after scans are stored." />
          ) : (
            <div className="space-y-4">
              {byComponent.map((item) => {
                const max = Math.max(...byComponent.map((x) => x.defects), 1);
                return (
                  <div key={item.component} className="rounded-xl border border-[#0e2540] bg-[#07121f]/60 p-4">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-white">{item.component}</span>
                      <span className="font-mono text-[#00E5FF]">{item.defects} defects</span>
                    </div>
                    <ProgressBar value={item.defects / max} color="#A78BFA" />
                    <p className="mt-2 font-mono text-[10px] text-[#5f7a99]">{item.count} inspections recorded</p>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-5">
          <SectionTitle title="Recent Daily Activity" subtitle="Last 14 days" />
          {recentDays.length === 0 ? (
            <EmptyState icon={<Activity className="h-7 w-7" />} title="No recent activity" subtitle="No stored inspections in the last 14 days." />
          ) : (
            <div className="space-y-3">
              {recentDays.map((day) => {
                const max = Math.max(...recentDays.map((x) => x.inspections), 1);
                return (
                  <div key={day.day} className="rounded-xl border border-[#0e2540] bg-[#07121f]/60 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-white">{day.day}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-[#00E5FF]">{day.inspections} scans</span>
                        <SeverityBadge level={day.defects > 0 ? "WARNING" : "CLEAN"} size="sm" />
                      </div>
                    </div>
                    <ProgressBar value={day.inspections / max} color="#00AEEF" />
                    <p className="mt-2 font-mono text-[10px] text-[#5f7a99]">{day.defects} defects recorded</p>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
