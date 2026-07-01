import Link from "next/link";
import {
  FileText,
  UploadCloud,
  Boxes,
  Timer,
  Filter,
  ArrowUpRight,
} from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { getAllInspections, getDashboardStats } from "@/lib/queries";
import { GlassCard, SeverityBadge, SectionTitle, EmptyState } from "@/components/Primitives";
import { COMPONENTS } from "@/lib/constants";

function formatDate(d: Date) {
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ component?: string }>;
}) {
  const session = await getSessionUser();
  const sp = await searchParams;
  const componentFilter = sp.component;

  const [all, stats] = await Promise.all([
    getAllInspections(session!.sub, 100),
    getDashboardStats(session!.sub),
  ]);

  const inspections = componentFilter
    ? all.filter((i) => i.component === componentFilter)
    : all;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="fade-up flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#5f7a99]">
            Inspection Records
          </p>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Inspection Reports
          </h1>
          <p className="mt-1 text-sm text-[#9fb6d1]">
            {inspections.length} stored scans · all data persisted in the
            operational database.
          </p>
        </div>
        <Link
          href="/image-upload"
          className="btn-primary flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm"
        >
          <UploadCloud className="h-4 w-4" /> New Inspection
        </Link>
      </div>

      {/* Filter chips */}
      <div className="fade-up flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-[#5f7a99]">
          <Filter className="h-3.5 w-3.5" /> Filter:
        </span>
        <Link
          href="/reports"
          className={`rounded-full border px-3 py-1 text-xs transition-colors ${
            !componentFilter
              ? "border-[#00E5FF]/50 bg-[#00E5FF]/[0.1] text-[#00E5FF]"
              : "border-[#0e2540] text-[#9fb6d1] hover:border-[#00AEEF]/40"
          }`}
        >
          All
        </Link>
        {COMPONENTS.slice(0, 6).map((c) => {
          const active = componentFilter === c;
          const count = all.filter((i) => i.component === c).length;
          return (
            <Link
              key={c}
              href={`/reports?component=${encodeURIComponent(c)}`}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                active
                  ? "border-[#00E5FF]/50 bg-[#00E5FF]/[0.1] text-[#00E5FF]"
                  : "border-[#0e2540] text-[#9fb6d1] hover:border-[#00AEEF]/40"
              }`}
            >
              {c} <span className="opacity-50">({count})</span>
            </Link>
          );
        })}
      </div>

      {inspections.length === 0 ? (
        <GlassCard>
          <EmptyState
            icon={<FileText className="h-7 w-7" />}
            title={componentFilter ? `No reports for ${componentFilter}` : "No inspection reports yet"}
            subtitle="Run an inspection to generate your first digital report."
            action={
              <Link href="/image-upload" className="btn-primary flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm">
                <UploadCloud className="h-4 w-4" /> Start Inspection
              </Link>
            }
          />
        </GlassCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {inspections.map((r) => (
            <Link key={r.id} href={`/reports/${r.id}`} className="block">
              <GlassCard hover className="overflow-hidden">
                <div className="relative aspect-video w-full overflow-hidden bg-[#06101d]">
                  {r.thumbnailPath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.thumbnailPath}
                      alt={r.component}
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[#1a3a55]">
                      <FileText className="h-10 w-10" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#06101d] via-transparent to-transparent" />
                  <div className="absolute right-2 top-2">
                    <SeverityBadge level={r.maxSeverity} size="sm" />
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-white">{r.component}</p>
                    <span className="font-mono text-[10px] text-[#5f7a99]">
                      {formatDate(r.createdAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[#9fb6d1]">{r.aircraftType}</p>

                  <div className="mt-3 flex items-center gap-4 font-mono text-[11px]">
                    <span className="flex items-center gap-1 text-[#FF8A3D]">
                      <Boxes className="h-3 w-3" /> {r.defectCount} defects
                    </span>
                    <span className="flex items-center gap-1 text-[#00AEEF]">
                      <Timer className="h-3 w-3" /> {Math.round(r.processingTimeMs)}ms
                    </span>
                  </div>

                  {r.summary && (
                    <p className="mt-2 line-clamp-2 text-xs text-[#7d96b3]">
                      {r.summary}
                    </p>
                  )}

                  <div className="mt-3 flex items-center gap-1 font-mono text-[11px] text-[#00E5FF]">
                    Open report <ArrowUpRight className="h-3 w-3" />
                  </div>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}

      {inspections.length > 0 && (
        <GlassCard className="p-5">
          <SectionTitle title="Fleet Summary" subtitle="Aggregate across all stored reports" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <SummaryStat label="Total Reports" value={stats.totalInspections} />
            <SummaryStat label="Total Defects" value={stats.totalDefects} accent="#FF8A3D" />
            <SummaryStat label="Critical" value={stats.critical} accent="#FF3B5C" />
            <SummaryStat label="Passed" value={stats.clean} accent="#22E58A" />
          </div>
        </GlassCard>
      )}
    </div>
  );
}

function SummaryStat({
  label,
  value,
  accent = "#00AEEF",
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-[#0e2540] bg-[#07121f]/60 p-4">
      <p className="font-mono text-[10px] uppercase tracking-wider text-[#5f7a99]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold" style={{ color: accent }}>
        {value}
      </p>
    </div>
  );
}
