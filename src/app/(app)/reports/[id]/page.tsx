import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Boxes,
  Gauge,
  Timer,
  Cpu,
  Wrench,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { getInspectionDetail } from "@/lib/queries";
import { DEFECT_COLORS, DEFECT_DESCRIPTIONS } from "@/lib/constants";
import { GlassCard, SeverityBadge, SectionTitle, ProgressBar } from "@/components/Primitives";
import BoundingBoxOverlay from "@/components/BoundingBoxOverlay";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSessionUser();
  const { id } = await params;
  const detail = await getInspectionDetail(id, session!.sub);
  if (!detail) notFound();

  const { inspection, defects } = detail;
  const imageUrl = inspection.thumbnailPath?.replace("/anno-", "/orig-") ?? inspection.thumbnailPath;
  const annotatedUrl = inspection.thumbnailPath;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="fade-up flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link href="/reports" className="mb-3 inline-flex items-center gap-2 font-mono text-xs text-[#9fc3e6] hover:text-[#00E5FF]">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to reports
          </Link>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#5f7a99]">
            Digital Inspection Report
          </p>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            {inspection.component}
          </h1>
          <p className="mt-1 text-sm text-[#9fb6d1]">{inspection.aircraftType} · {inspection.fileName}</p>
        </div>
        <div className="flex items-center gap-2">
          <SeverityBadge level={inspection.maxSeverity} />
          <Link href="/maintenance" className="btn-primary flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm">
            <Wrench className="h-4 w-4" /> Maintenance Queue
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2 overflow-hidden p-3">
          <SectionTitle title="Annotated Detection Overlay" subtitle="Real bounding boxes rendered from stored inference" />
          <div className="relative overflow-hidden rounded-xl border border-[#0e2540]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl ?? annotatedUrl ?? ""} alt="inspection" className="block w-full" />
            <BoundingBoxOverlay
              defects={defects.map((d) => ({
                type: d.type,
                confidence: d.confidence,
                x: d.x,
                y: d.y,
                width: d.width,
                height: d.height,
                severity: d.severity,
              }))}
            />
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard className="grid grid-cols-2 gap-3 p-4">
            <Mini icon={<Boxes className="h-4 w-4" />} label="Defects" value={String(inspection.defectCount)} accent="#FF8A3D" />
            <Mini icon={<Gauge className="h-4 w-4" />} label="Avg Conf" value={`${Math.round(inspection.confidenceAvg * 100)}%`} accent="#22E58A" />
            <Mini icon={<Timer className="h-4 w-4" />} label="Inference" value={`${Math.round(inspection.processingTimeMs)}ms`} accent="#00AEEF" />
            <Mini icon={<Cpu className="h-4 w-4" />} label="Model" value={inspection.modelVersion.split("-").slice(-1)[0] ?? "v"} accent="#A78BFA" />
          </GlassCard>

          <GlassCard className="p-5">
            <SectionTitle title="Report Summary" subtitle="Generated from stored record" />
            <div className="space-y-2 text-sm text-[#9fb6d1]">
              <p>{inspection.summary ?? "No summary available."}</p>
              <div className="grid grid-cols-2 gap-3 pt-2 font-mono text-[11px]">
                <Row k="Created" v={new Date(inspection.createdAt).toLocaleString()} />
                <Row k="Resolution" v={`${inspection.imageWidth}×${inspection.imageHeight}`} />
                <Row k="Aircraft" v={inspection.aircraftType} />
                <Row k="Component" v={inspection.component} />
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      <GlassCard className="overflow-hidden">
        <div className="p-5 pb-3">
          <SectionTitle title="Defect Findings" subtitle={`${defects.length} localized anomaly/anomalies`} />
        </div>
        <div className="grid gap-3 p-5 pt-0 sm:grid-cols-2 lg:grid-cols-3">
          {defects.length === 0 ? (
            <div className="col-span-full rounded-xl border border-[#0e2540] bg-[#07121f]/60 p-8 text-center text-sm text-[#9fb6d1]">
              No anomalies detected for this inspection.
            </div>
          ) : (
            defects.map((d) => (
              <div key={d.id} className="rounded-xl border border-[#0e2540] bg-[#07121f]/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: DEFECT_COLORS[d.type], boxShadow: `0 0 8px ${DEFECT_COLORS[d.type]}` }} />
                    <p className="font-semibold text-white">{d.type}</p>
                  </div>
                  <SeverityBadge level={d.severity} size="sm" />
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between font-mono text-[10px] text-[#5f7a99]">
                    <span>CONFIDENCE</span>
                    <span className="text-[#00E5FF]">{(d.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <ProgressBar value={d.confidence} color={DEFECT_COLORS[d.type] ?? "#00E5FF"} />
                </div>
                <p className="mt-3 text-xs text-[#9fb6d1]">
                  {DEFECT_DESCRIPTIONS[d.type] ?? "Structural anomaly detected. Review manually."}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[10px] text-[#5f7a99]">
                  <span>Area: {d.areaPx}px²</span>
                  <span>Box: {(d.width * 100).toFixed(1)}% × {(d.height * 100).toFixed(1)}%</span>
                </div>
              </div>
            ))
          )}
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <SectionTitle title="Evidence Assets" subtitle="Stored inspection imagery" />
        <div className="grid gap-4 md:grid-cols-2">
          <AssetCard title="Source Image" icon={<ImageIcon className="h-4 w-4" />} url={imageUrl ?? undefined} />
          <AssetCard title="Annotated Output" icon={<FileText className="h-4 w-4" />} url={annotatedUrl ?? undefined} />
        </div>
      </GlassCard>
    </div>
  );
}

function Mini({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl border border-[#0e2540] bg-[#07121f]/60 p-3">
      <div className="flex items-center gap-1.5" style={{ color: accent }}>
        {icon}
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#5f7a99]">{label}</span>
      </div>
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg border border-[#0e2540] bg-[#07121f]/50 px-3 py-2">
      <p className="text-[#5f7a99]">{k}</p>
      <p className="mt-1 text-[#c9d8e8]">{v}</p>
    </div>
  );
}

function AssetCard({ title, icon, url }: { title: string; icon: React.ReactNode; url?: string }) {
  return (
    <div className="rounded-xl border border-[#0e2540] bg-[#07121f]/60 p-4">
      <div className="mb-3 flex items-center gap-2 text-[#9fc3e6]">
        {icon}
        <span className="font-semibold text-white">{title}</span>
      </div>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={title} className="rounded-xl border border-[#0e2540]" />
      ) : (
        <div className="rounded-xl border border-dashed border-[#0e2540] p-10 text-center text-sm text-[#5f7a99]">No asset available.</div>
      )}
    </div>
  );
}
