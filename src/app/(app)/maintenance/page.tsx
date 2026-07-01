"use client";

import { useEffect, useState } from "react";
import { Wrench, ClipboardList, Plus, Loader2, Trash2, CheckCircle2 } from "lucide-react";
import { GlassCard, SectionTitle, EmptyState, SeverityBadge } from "@/components/Primitives";
import { AIRCRAFT_TYPES, COMPONENTS } from "@/lib/constants";

interface Task {
  id: string;
  inspectionId: string | null;
  component: string;
  aircraftType: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueDate: string | null;
  createdAt: string;
}

export default function MaintenancePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [component, setComponent] = useState(COMPONENTS[0]);
  const [aircraftType, setAircraftType] = useState(AIRCRAFT_TYPES[0]);
  const [priority, setPriority] = useState("WARNING");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/maintenance", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to load tasks.");
      setTasks(data.tasks ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createTask() {
    if (!title.trim()) return setError("Task title is required.");
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, component, aircraftType, priority }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to create task.");
      setTitle("");
      setDescription("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create task.");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/maintenance/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
  }

  async function removeTask(id: string) {
    await fetch(`/api/maintenance/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#5f7a99]">Maintenance Operations</p>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Maintenance Queue</h1>
        <p className="mt-1 text-sm text-[#9fb6d1]">Create and track remediation tasks linked to inspection operations.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="p-5 lg:col-span-1">
          <SectionTitle title="Create Task" subtitle="Add a maintenance action" />
          <div className="space-y-3">
            <Input label="Title" value={title} onChange={setTitle} placeholder="Corrosion treatment required" />
            <TextArea label="Description" value={description} onChange={setDescription} placeholder="Recommended structural or surface remediation..." />
            <Select label="Component" value={component} onChange={setComponent} options={COMPONENTS} />
            <Select label="Aircraft Type" value={aircraftType} onChange={setAircraftType} options={AIRCRAFT_TYPES} />
            <Select label="Priority" value={priority} onChange={setPriority} options={["CRITICAL", "WARNING", "INFO"]} />
            {error && <div className="rounded-xl border border-[#FF3B5C]/30 bg-[#FF3B5C]/[0.08] px-3 py-2 text-xs text-[#FF3B5C]">{error}</div>}
            <button onClick={createTask} disabled={saving} className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create Task
            </button>
          </div>
        </GlassCard>

        <GlassCard className="p-5 lg:col-span-2">
          <SectionTitle title="Open Queue" subtitle="Database-backed maintenance tasks" />
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-[#9fb6d1]"><Loader2 className="h-4 w-4 animate-spin" /> Loading tasks…</div>
          ) : tasks.length === 0 ? (
            <EmptyState icon={<ClipboardList className="h-7 w-7" />} title="No maintenance tasks" subtitle="Create a task or generate one from inspection workflow." />
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="rounded-xl border border-[#0e2540] bg-[#07121f]/60 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white">{task.title}</p>
                        <SeverityBadge level={task.priority} size="sm" />
                      </div>
                      <p className="mt-1 text-xs text-[#9fb6d1]">{task.description || "No description provided."}</p>
                      <div className="mt-2 flex flex-wrap gap-2 font-mono text-[10px] text-[#5f7a99]">
                        <span>{task.component}</span>
                        <span>•</span>
                        <span>{task.aircraftType}</span>
                        <span>•</span>
                        <span>{new Date(task.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {task.status !== "COMPLETED" && (
                        <button onClick={() => updateStatus(task.id, "COMPLETED")} className="btn-ghost flex items-center gap-2 rounded-xl px-3 py-2 text-xs">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                        </button>
                      )}
                      {task.status !== "IN_PROGRESS" && (
                        <button onClick={() => updateStatus(task.id, "IN_PROGRESS")} className="btn-ghost rounded-xl px-3 py-2 text-xs">In Progress</button>
                      )}
                      <button onClick={() => removeTask(task.id)} className="rounded-xl border border-[#FF3B5C]/30 bg-[#FF3B5C]/[0.08] px-3 py-2 text-xs text-[#FF3B5C] hover:bg-[#FF3B5C]/[0.14]">
                        <span className="inline-flex items-center gap-1"><Trash2 className="h-3.5 w-3.5" /> Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[#7d96b3]">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-[#0e2540] bg-[#07121f]/70 px-3.5 py-3 text-sm text-white outline-none focus:border-[#00E5FF]/50" />
    </label>
  );
}

function TextArea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[#7d96b3]">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={4} className="w-full rounded-xl border border-[#0e2540] bg-[#07121f]/70 px-3.5 py-3 text-sm text-white outline-none focus:border-[#00E5FF]/50" />
    </label>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[#7d96b3]">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-[#0e2540] bg-[#07121f]/70 px-3.5 py-3 text-sm text-white outline-none focus:border-[#00E5FF]/50">
        {options.map((o) => <option key={o} value={o} className="bg-[#07121f]">{o}</option>)}
      </select>
    </label>
  );
}
