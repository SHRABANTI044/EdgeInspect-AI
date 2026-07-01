"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  UploadCloud,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Cpu,
  Timer,
  Boxes,
  Gauge,
  RotateCcw,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { GlassCard, SeverityBadge, SectionTitle, EmptyState } from "@/components/Primitives";
import LoadingScanner from "@/components/LoadingScanner";
import BoundingBoxOverlay, { type BoxDefect } from "@/components/BoundingBoxOverlay";
import { AIRCRAFT_TYPES, COMPONENTS, DEFECT_COLORS } from "@/lib/constants";

interface DefectResult extends BoxDefect {
  areaPx: number;
  description: string;
}

interface InspectResponse {
  inspectionId: string;
  width: number;
  height: number;
  processingTimeMs: number;
  totalMs: number;
  modelVersion: string;
  imageUrl: string;
  annotatedUrl: string;
  maxSeverity: string;
  confidenceAvg: number;
  summary: string;
  stats: {
    meanLuminance: number;
    contrast: number;
    edgeRatio: number;
    processedPixels: number;
    edgeThreshold: number;
  };
  defects: DefectResult[];
}

export default function ImageUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [component, setComponent] = useState(COMPONENTS[0]);
  const [aircraft, setAircraft] = useState(AIRCRAFT_TYPES[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InspectResponse | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }
    setError(null);
    setResult(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }, []);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0] ?? null);
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function runInspection() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("component", component);
      fd.append("aircraftType", aircraft);
      const res = await fetch("/api/inspect", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Inference failed.");
      setResult(data as InspectResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inference failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="fade-up">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#5f7a99]">
          Image Analysis Console
        </p>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Run Defect Detection
        </h1>
        <p className="mt-1 text-sm text-[#9fb6d1]">
          Upload an aircraft panel image — the edge CV engine will preprocess,
          detect anomalies, and draw bounding boxes with real confidence.
        </p>
      </div>

      {/* Upload zone + controls */}
      {!loading && !result && (
        <div className="fade-up grid gap-4 lg:grid-cols-3">
          <GlassCard className="lg:col-span-2 p-5">
            <SectionTitle title="Inspection Image" subtitle="Drag & drop or browse — JPG / PNG up to 12MB" />
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`relative flex aspect-[4/3] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-all ${
                dragOver
                  ? "border-[#00E5FF] bg-[#00E5FF]/[0.06]"
                  : "border-[#1a3a55] bg-[#06101d]/60 hover:border-[#00AEEF]/50"
              }`}
            >
              {preview ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="preview"
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg border border-[#0e2540] bg-[#04111e]/80 px-3 py-1.5 backdrop-blur">
                    <ImageIcon className="h-3.5 w-3.5 text-[#00E5FF]" />
                    <span className="max-w-[200px] truncate font-mono text-[11px] text-[#9fc3e6]">
                      {file?.name}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00aeef14] text-[#00AEEF]">
                    <UploadCloud className="h-8 w-8" />
                  </div>
                  <p className="mt-4 font-semibold text-white">
                    Drop aircraft panel image here
                  </p>
                  <p className="mt-1 font-mono text-xs text-[#5f7a99]">
                    or click to browse files
                  </p>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <SectionTitle title="Mission Parameters" subtitle="Context for this scan" />
            <div className="space-y-4">
              <Select
                label="Aircraft Type"
                value={aircraft}
                onChange={setAircraft}
                options={AIRCRAFT_TYPES}
              />
              <Select
                label="Component"
                value={component}
                onChange={setComponent}
                options={COMPONENTS}
              />

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-[#FF3B5C]/30 bg-[#FF3B5C]/[0.08] px-3 py-2.5 text-xs text-[#FF3B5C]">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                onClick={runInspection}
                disabled={!file}
                className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm"
              >
                <Cpu className="h-4 w-4" />
                Run AI Inspection
              </button>
              <p className="text-center font-mono text-[10px] text-[#4d6480]">
                Inference runs on edge CV pipeline · real pixel analysis
              </p>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <LoadingScanner imageUrl={preview ?? undefined} />
          </div>
          <GlassCard className="p-5">
            <SectionTitle title="Processing" subtitle="Edge inference in progress" />
            <div className="space-y-3">
              {[
                "Decoding image tensor",
                "Running Sobel edge detection",
                "Labeling connected components",
                "Classifying anomalies",
              ].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#00E5FF]" style={{ animationDelay: `${i * 0.2}s` }} />
                  <span className="font-mono text-xs text-[#9fc3e6]">{s}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="fade-up space-y-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#22e58a14] text-[#22E58A]">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-white">Inspection Complete</p>
                <p className="font-mono text-[11px] text-[#5f7a99]">
                  {result.modelVersion} · id {result.inspectionId.slice(0, 8)}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={reset}
                className="btn-ghost flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm"
              >
                <RotateCcw className="h-4 w-4" /> New Scan
              </button>
              <Link
                href={`/reports/${result.inspectionId}`}
                className="btn-primary flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm"
              >
                <FileText className="h-4 w-4" /> View Report
              </Link>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Annotated image */}
            <GlassCard className="lg:col-span-2 overflow-hidden p-3">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#5f7a99]">
                  Detection Overlay · {result.width}×{result.height}
                </span>
                <SeverityBadge level={result.maxSeverity} size="sm" />
              </div>
              <div className="relative overflow-hidden rounded-xl border border-[#0e2540]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.imageUrl}
                  alt="analyzed"
                  className="block w-full"
                />
                <BoundingBoxOverlay defects={result.defects} activeType={activeType} />
              </div>
            </GlassCard>

            {/* Stats + defects */}
            <div className="space-y-4">
              <GlassCard className="grid grid-cols-2 gap-3 p-4">
                <MiniStat icon={<Boxes className="h-4 w-4" />} label="Defects" value={String(result.defects.length)} accent="#FF8A3D" />
                <MiniStat icon={<Gauge className="h-4 w-4" />} label="Avg Conf" value={`${Math.round(result.confidenceAvg * 100)}%`} accent="#22E58A" />
                <MiniStat icon={<Timer className="h-4 w-4" />} label="Inference" value={`${result.processingTimeMs}ms`} accent="#00AEEF" />
                <MiniStat icon={<Cpu className="h-4 w-4" />} label="Pixels" value={`${(result.stats.processedPixels / 1000).toFixed(0)}k`} accent="#A78BFA" />
              </GlassCard>

              <GlassCard className="p-4">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-[#5f7a99]">
                  Engine Telemetry
                </p>
                <div className="space-y-1.5 font-mono text-[11px] text-[#9fc3e6]">
                  <Row k="Edge threshold" v={`${result.stats.edgeThreshold}`} />
                  <Row k="Edge ratio" v={`${(result.stats.edgeRatio * 100).toFixed(2)}%`} />
                  <Row k="Mean luminance" v={`${result.stats.meanLuminance}`} />
                  <Row k="Contrast" v={`${(result.stats.contrast * 100).toFixed(0)}%`} />
                </div>
              </GlassCard>
            </div>
          </div>

          {/* Defect list */}
          <GlassCard className="overflow-hidden">
            <div className="p-5 pb-3">
              <SectionTitle
                title="Detected Anomalies"
                subtitle={result.summary}
              />
            </div>
            {result.defects.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 className="h-7 w-7" />}
                title="No anomalies detected"
                subtitle="Surface integrity within acceptable tolerance thresholds."
              />
            ) : (
              <div className="grid gap-3 p-5 pt-0 sm:grid-cols-2">
                {result.defects.map((d, i) => (
                  <button
                    key={i}
                    onMouseEnter={() => setActiveType(d.type)}
                    onMouseLeave={() => setActiveType(null)}
                    className="group rounded-xl border border-[#0e2540] bg-[#07121f]/60 p-4 text-left transition-all hover:border-[#00E5FF]/40"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: DEFECT_COLORS[d.type], boxShadow: `0 0 8px ${DEFECT_COLORS[d.type]}` }}
                        />
                        <span className="font-semibold text-white">{d.type}</span>
                      </div>
                      <SeverityBadge level={d.severity} size="sm" />
                    </div>
                    <div className="mt-3 flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between font-mono text-[10px] text-[#5f7a99]">
                          <span>CONFIDENCE</span>
                          <span className="text-[#00E5FF]">{(d.confidence * 100).toFixed(1)}%</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${d.confidence * 100}%`,
                              background: DEFECT_COLORS[d.type],
                              boxShadow: `0 0 8px ${DEFECT_COLORS[d.type]}`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-[#5f7a99]">
                        {d.areaPx}px²
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-[#9fb6d1]">{d.description}</p>
                  </button>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[#7d96b3]">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-[#0e2540] bg-[#07121f]/70 px-3.5 py-3 text-sm text-white outline-none focus:border-[#00E5FF]/50"
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-[#07121f]">
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function MiniStat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-[#0e2540] bg-[#07121f]/60 p-3">
      <div className="flex items-center gap-1.5" style={{ color: accent }}>
        {icon}
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#5f7a99]">
          {label}
        </span>
      </div>
      <p className="mt-1 text-xl font-bold text-white">{value}</p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[#5f7a99]">{k}</span>
      <span>{v}</span>
    </div>
  );
}
