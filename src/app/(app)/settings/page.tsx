"use client";

import { useState, useEffect } from "react";
import { Settings, ShieldCheck, Database, Cpu, Clock3, Sliders, Upload } from "lucide-react";
import { GlassCard, SectionTitle } from "@/components/Primitives";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [confidence, setConfidence] = useState(0.70);
  const [mode, setMode] = useState<"auto" | "yolo" | "cv">("auto");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setUser(data.user);
        if (data.confidenceThreshold) setConfidence(data.confidenceThreshold);
        if (data.detectionMode) setMode(data.detectionMode);
      })
      .catch(() => {});
  }, []);

  async function saveSettings() {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confidenceThreshold: confidence, detectionMode: mode }),
      });
      alert("Settings saved");
    } catch (e) {
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function uploadModel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("model", file);
    setSaving(true);
    try {
      const res = await fetch("/api/settings/model", { method: "POST", body: form });
      if (res.ok) alert("Model uploaded. Restart server to apply.");
      else alert("Upload failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#5f7a99]">System Settings</p>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Operator Profile & Runtime</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard className="p-5">
          <SectionTitle title="Identity" subtitle="Authenticated operator profile" />
          <div className="space-y-3 text-sm text-[#9fb6d1]">
            <Row icon={<ShieldCheck className="h-4 w-4 text-[#00E5FF]" />} label="Name" value={user?.name ?? "—"} />
            <Row icon={<ShieldCheck className="h-4 w-4 text-[#00E5FF]" />} label="Email" value={user?.email ?? "—"} />
            <Row icon={<ShieldCheck className="h-4 w-4 text-[#00E5FF]" />} label="Role" value={user?.role ?? "—"} />
            <Row icon={<ShieldCheck className="h-4 w-4 text-[#00E5FF]" />} label="Organization" value={user?.organization ?? "—"} />
            <Row icon={<Clock3 className="h-4 w-4 text-[#00E5FF]" />} label="Account Created" value={user?.createdAt ? new Date(user.createdAt).toLocaleString() : "—"} />
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <SectionTitle title="Runtime Configuration" subtitle="Current application stack" />
          <div className="space-y-3 text-sm text-[#9fb6d1]">
            <Row icon={<Database className="h-4 w-4 text-[#00E5FF]" />} label="Database" value="PostgreSQL via Drizzle ORM" />
            <Row icon={<Cpu className="h-4 w-4 text-[#00E5FF]" />} label="Inference" value="Edge CV / YOLOv8 ONNX" />
            <Row icon={<ShieldCheck className="h-4 w-4 text-[#00E5FF]" />} label="Authentication" value="JWT cookie session" />
            <Row icon={<Settings className="h-4 w-4 text-[#00E5FF]" />} label="UI Mode" value="Premium aerospace dark mode" />
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-5">
        <SectionTitle title="Detection Settings" subtitle="Configure inference behavior" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-[#9fb6d1]">
              <Sliders className="h-4 w-4 text-[#00E5FF]" />
              Confidence Threshold: {(confidence * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0.1"
              max="0.95"
              step="0.05"
              value={confidence}
              onChange={(e) => setConfidence(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-[#9fb6d1]">
              <Cpu className="h-4 w-4 text-[#00E5FF]" />
              Detection Mode
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as any)}
              className="w-full rounded-xl border border-[#0e2540] bg-[#07121f]/60 px-3 py-2 text-sm text-white"
            >
              <option value="auto">Auto (YOLO if available, else CV)</option>
              <option value="yolo">YOLO Only</option>
              <option value="cv">CV Fallback Only</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button onClick={saveSettings} disabled={saving} className="btn-primary px-4 py-2 text-sm">
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <SectionTitle title="Model Management" subtitle="Upload a custom ONNX model" />
        <label className="flex items-center gap-2 rounded-xl border border-dashed border-[#0e2540] bg-[#07121f]/40 px-4 py-3 text-sm text-[#9fb6d1] cursor-pointer">
          <Upload className="h-4 w-4 text-[#00E5FF]" />
          <span>Click to upload aircraft_defect.onnx</span>
          <input type="file" accept=".onnx" className="hidden" onChange={uploadModel} />
        </label>
        <p className="mt-2 text-xs text-[#5f7a99]">Replace the current model. Restart server after upload.</p>
      </GlassCard>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#0e2540] bg-[#07121f]/60 px-4 py-3">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-[#5f7a99]">{label}</p>
        <p className="mt-0.5 text-white">{value}</p>
      </div>
    </div>
  );
}
