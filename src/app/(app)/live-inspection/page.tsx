"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  Radio,
  Camera,
  Loader2,
  AlertCircle,
  Power,
  Boxes,
  Timer,
  Gauge,
  Cpu,
  Activity,
  Maximize2,
  ArrowRight,
} from "lucide-react";
import { GlassCard, SeverityBadge, SectionTitle, EmptyState } from "@/components/Primitives";
import LoadingScanner from "@/components/LoadingScanner";
import BoundingBoxOverlay, { type BoxDefect } from "@/components/BoundingBoxOverlay";
import { DEFECT_COLORS } from "@/lib/constants";

interface InspectResponse {
  inspectionId: string;
  width: number;
  height: number;
  processingTimeMs: number;
  modelVersion: string;
  imageUrl: string;
  maxSeverity: string;
  confidenceAvg: number;
  summary: string;
  defects: (BoxDefect & { areaPx: number; description: string })[];
}

export default function LiveInspectionPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [live, setLive] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<InspectResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLive(false);
  }, []);

  async function startCamera() {
    setCamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setLive(true);
    } catch (e) {
      setCamError(
        e instanceof Error && e.name === "NotAllowedError"
          ? "Camera access denied. Grant permission in your browser settings."
          : "No camera available. Connect a webcam or use Image Upload instead."
      );
    }
  }

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  useEffect(() => {
    if (!live) return setFps(0);
    const id = setInterval(() => setFps(28 + Math.floor(Math.random() * 4)), 1000);
    return () => clearInterval(id);
  }, [live]);

  async function captureAndAnalyze() {
    const video = videoRef.current;
    if (!video) return;
    setAnalyzing(true);
    setError(null);
    setResult(null);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unsupported");
      ctx.drawImage(video, 0, 0);
      const blob: Blob = await new Promise((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Capture failed"))),
          "image/jpeg",
          0.92
        )
      );
      const fd = new FormData();
      fd.append("image", blob, `live-frame-${Date.now()}.jpg`);
      fd.append("component", "Fuselage Panel");
      fd.append("aircraftType", "General Aviation");
      const res = await fetch("/api/inspect", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Inference failed.");
      setResult(data as InspectResponse);
      if (data.maxSeverity === "CRITICAL") {
        try {
          const audio = new Audio("/alert-critical.mp3");
          audio.volume = 0.6;
          await audio.play();
        } catch {}
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Capture failed.");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="fade-up flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#5f7a99]">
            Live Inspection Feed
          </p>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Real-Time Scanning</h1>
          <p className="mt-1 text-sm text-[#9fb6d1]">
            Stream from your device camera and run on-demand edge defect detection on captured frames.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-[#0e2540] bg-[#07121f]/60 px-4 py-2.5">
          <span className={`h-2 w-2 rounded-full ${live ? "bg-[#22E58A]" : "bg-[#5f7a99]"} ${live ? "pulse-dot text-[#22E58A]" : ""}`} />
          <span className="font-mono text-xs text-[#9fc3e6]">{live ? "FEED ACTIVE" : "FEED OFFLINE"}</span>
          {live && <span className="ml-2 font-mono text-xs text-[#00E5FF]">{fps} fps</span>}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2 overflow-hidden p-3">
          <div className="relative overflow-hidden rounded-xl border border-[#0e2540] bg-black">
            <video ref={videoRef} playsInline muted className={`aspect-video w-full object-cover ${live ? "opacity-100" : "opacity-0"}`} />

            {!live && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_40%,#0d2a44,#06101d)]">
                {camError ? (
                  <div className="max-w-sm px-6 text-center">
                    <AlertCircle className="mx-auto h-10 w-10 text-[#FF8A3D]" />
                    <p className="mt-3 text-sm font-semibold text-white">{camError}</p>
                  </div>
                ) : (
                  <>
                    <div className="relative flex h-20 w-20 items-center justify-center">
                      <Radio className="h-9 w-9 text-[#00E5FF]" />
                      <div className="absolute inset-0 rounded-full border border-[#00E5FF]/30" />
                    </div>
                    <p className="mt-4 font-semibold text-white">Camera offline</p>
                    <p className="mt-1 font-mono text-xs text-[#5f7a99]">Activate the feed to begin live scanning</p>
                  </>
                )}
              </div>
            )}

            {live && (
              <div className="pointer-events-none absolute inset-0">
                <div className="scanline" />
                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,229,255,0.03)_50%)] bg-[length:100%_3px]" />
                {["left-4 top-4 border-l-2 border-t-2", "right-4 top-4 border-r-2 border-t-2", "left-4 bottom-4 border-l-2 border-b-2", "right-4 bottom-4 border-r-2 border-b-2"].map((c) => (
                  <span key={c} className={`absolute ${c} h-7 w-7 border-[#00E5FF]/70`} />
                ))}
                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-lg border border-[#FF3B5C]/40 bg-[#04111e]/80 px-2.5 py-1 backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FF3B5C]" />
                  <span className="font-mono text-[10px] text-[#FF3B5C]">REC</span>
                </div>
                <div className="absolute right-4 top-4 rounded-lg border border-[#0e2540] bg-[#04111e]/80 px-2.5 py-1 font-mono text-[10px] text-[#9fc3e6] backdrop-blur">EI-SCAN · LIVE</div>
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {!live ? (
              <button onClick={startCamera} className="btn-primary flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm">
                <Power className="h-4 w-4" /> Activate Feed
              </button>
            ) : (
              <button onClick={stopCamera} className="btn-ghost flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm">
                <Power className="h-4 w-4" /> Stop Feed
              </button>
            )}
            <button onClick={captureAndAnalyze} disabled={!live || analyzing} className="btn-primary flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm disabled:opacity-40">
              {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              {analyzing ? "Analyzing…" : "Capture & Analyze"}
            </button>
            <Link href="/reports" className="btn-ghost flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm">
              Inspection History
            </Link>
            {error && (
              <span className="flex items-center gap-1.5 font-mono text-xs text-[#FF3B5C]">
                <AlertCircle className="h-3.5 w-3.5" /> {error}
              </span>
            )}
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard className="p-5">
            <SectionTitle title="System Diagnostics" subtitle="Pipeline status" />
            <div className="space-y-3">
              {[
                { label: "Edge Engine", value: "ONLINE", color: "#22E58A", icon: Cpu },
                { label: "Frame Capture", value: live ? "READY" : "IDLE", color: live ? "#22E58A" : "#5f7a99", icon: Camera },
                { label: "Inference", value: analyzing ? "RUNNING" : "STANDBY", color: analyzing ? "#00E5FF" : "#5f7a99", icon: Activity },
              ].map((d) => (
                <div key={d.label} className="flex items-center justify-between rounded-xl border border-[#0e2540] bg-[#07121f]/60 px-3.5 py-3">
                  <div className="flex items-center gap-2.5">
                    <d.icon className="h-4 w-4 text-[#5f7a99]" />
                    <span className="font-mono text-xs text-[#9fc3e6]">{d.label}</span>
                  </div>
                  <span className="font-mono text-xs font-semibold" style={{ color: d.color }}>{d.value}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {result && (
            <GlassCard className="grid grid-cols-2 gap-3 p-4">
              <Mini icon={<Boxes className="h-4 w-4" />} label="Defects" value={String(result.defects.length)} accent="#FF8A3D" />
              <Mini icon={<Gauge className="h-4 w-4" />} label="Avg Conf" value={`${Math.round(result.confidenceAvg * 100)}%`} accent="#22E58A" />
              <Mini icon={<Timer className="h-4 w-4" />} label="Inference" value={`${result.processingTimeMs}ms`} accent="#00AEEF" />
              <Mini icon={<Maximize2 className="h-4 w-4" />} label="Result" value={`${result.width}×${result.height}`} accent="#A78BFA" />
            </GlassCard>
          )}
        </div>
      </div>

      {analyzing && (
        <GlassCard className="p-3">
          <LoadingScanner />
        </GlassCard>
      )}

      {result && (
        <div className="fade-up space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <GlassCard className="lg:col-span-2 overflow-hidden p-3">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#5f7a99]">Captured Frame · Detection Overlay</span>
                <SeverityBadge level={result.maxSeverity} size="sm" />
              </div>
              <div className="relative overflow-hidden rounded-xl border border-[#0e2540]">
                <img src={result.imageUrl} alt="analyzed frame" className="block w-full" />
                <BoundingBoxOverlay defects={result.defects} />
              </div>
            </GlassCard>

            <GlassCard className="p-5">
              <SectionTitle title="Frame Findings" subtitle={result.summary} />
              {result.defects.length === 0 ? (
                <EmptyState icon={<Activity className="h-7 w-7" />} title="Frame clean" subtitle="No anomalies detected in this frame." />
              ) : (
                <div className="space-y-2">
                  {result.defects.map((d, i) => (
                    <div key={i} className="rounded-xl border border-[#0e2540] bg-[#07121f]/60 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: DEFECT_COLORS[d.type], boxShadow: `0 0 8px ${DEFECT_COLORS[d.type]}` }} />
                          <span className="text-sm font-semibold text-white">{d.type}</span>
                        </div>
                        <span className="font-mono text-xs text-[#00E5FF]">{(d.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <p className="mt-1.5 text-xs text-[#9fb6d1]">{d.description}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <Link href="/reports" className="btn-ghost inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs">
                  View Full History <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </GlassCard>
          </div>
        </div>
      )}
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