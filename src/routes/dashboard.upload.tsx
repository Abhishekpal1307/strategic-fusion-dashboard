import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import {
  FileJson,
  FileSpreadsheet,
  Image as ImageIcon,
  UploadCloud,
  Database as DbIcon,
  Cloud,
  Loader2,
} from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { RiskLevel, SourceType } from "@/lib/intel-types";

export const Route = createFileRoute("/dashboard/upload")({
  head: () => ({ meta: [{ title: "Upload Center — Strategic Fusion Dashboard" }] }),
  component: UploadCenter,
});

const nodeSchema = z.object({
  title: z.string().min(1).max(200),
  source_type: z.enum(["OSINT", "HUMINT", "IMINT"]),
  risk_level: z.enum(["high", "medium", "low", "verified"]),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  region: z.string().max(120).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  image_url: z.string().url().nullable().optional(),
});

function UploadCenter() {
  const { user } = useAuth();

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Data ingestion center</h1>
        <p className="text-sm text-muted-foreground">Drag & drop multi-source intel directly into the operational picture.</p>
      </div>

      <Tabs defaultValue="osint" className="w-full">
        <TabsList>
          <TabsTrigger value="osint">OSINT</TabsTrigger>
          <TabsTrigger value="humint">HUMINT</TabsTrigger>
          <TabsTrigger value="imint">IMINT</TabsTrigger>
        </TabsList>

        <TabsContent value="osint" className="grid gap-4 md:grid-cols-3 mt-4">
          <DropCard
            title="JSON upload"
            hint="Array of intel nodes, drag a .json file"
            icon={FileJson}
            accept="application/json,.json"
            onFile={async (file) => importJson(file, user?.id)}
          />
          <SimCard
            title="MongoDB import"
            hint="Simulate a Mongo collection import"
            icon={DbIcon}
            onRun={() => simulateImport(user?.id, "MongoDB")}
          />
          <SimCard
            title="AWS S3 fetch"
            hint="Simulate fetching latest object"
            icon={Cloud}
            onRun={() => simulateImport(user?.id, "S3")}
          />
        </TabsContent>

        <TabsContent value="humint" className="grid gap-4 lg:grid-cols-2 mt-4">
          <div className="space-y-4">
            <DropCard
              title="CSV upload"
              hint="title,source_type,risk_level,latitude,longitude,region,description,notes"
              icon={FileSpreadsheet}
              accept=".csv,text/csv"
              onFile={(f) => importCsv(f, user?.id)}
            />
            <DropCard
              title="Excel upload"
              hint="First sheet, same columns as CSV"
              icon={FileSpreadsheet}
              accept=".xlsx,.xls"
              onFile={(f) => importExcel(f, user?.id)}
            />
          </div>
          <ManualForm userId={user?.id} />
        </TabsContent>

        <TabsContent value="imint" className="mt-4">
          <ImintUpload userId={user?.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DropCard({
  title,
  hint,
  icon: Icon,
  accept,
  onFile,
}: {
  title: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  accept: string;
  onFile: (f: File) => Promise<void> | void;
}) {
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);

  const handle = useCallback(
    async (file?: File | null) => {
      if (!file) return;
      setBusy(true);
      try {
        await onFile(file);
      } finally {
        setBusy(false);
      }
    },
    [onFile],
  );

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        handle(e.dataTransfer.files?.[0]);
      }}
      className={`glass rounded-xl p-5 cursor-pointer transition-colors ${over ? "ring-2 ring-primary" : ""}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-primary border border-border">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="font-medium text-sm">{title}</div>
          <div className="text-xs text-muted-foreground">{hint}</div>
        </div>
      </div>
      <div className="mt-4 rounded-md border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
        {busy ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Processing…
          </span>
        ) : (
          <>
            <UploadCloud className="mx-auto h-5 w-5 mb-1" />
            Drop file or click to browse
          </>
        )}
      </div>
      <input
        hidden
        type="file"
        accept={accept}
        onChange={(e) => handle(e.target.files?.[0])}
      />
    </label>
  );
}

function SimCard({
  title,
  hint,
  icon: Icon,
  onRun,
}: {
  title: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  onRun: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-primary border border-border">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="font-medium text-sm">{title}</div>
          <div className="text-xs text-muted-foreground">{hint}</div>
        </div>
      </div>
      <Button
        size="sm"
        className="mt-4 w-full"
        variant="outline"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await onRun();
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
        Run import
      </Button>
    </div>
  );
}

function ManualForm({ userId }: { userId?: string }) {
  const [form, setForm] = useState({
    title: "",
    source_type: "HUMINT" as SourceType,
    risk_level: "medium" as RiskLevel,
    latitude: "",
    longitude: "",
    region: "",
    description: "",
  });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    const payload = {
      title: form.title,
      source_type: form.source_type,
      risk_level: form.risk_level,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      region: form.region || null,
      description: form.description || null,
      notes: null,
      image_url: null,
    };
    const parsed = nodeSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("intel_nodes").insert({ ...parsed.data, user_id: userId });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Field report logged");
      setForm({ ...form, title: "", description: "", latitude: "", longitude: "", region: "" });
    }
  }

  return (
    <form onSubmit={submit} className="glass rounded-xl p-5 space-y-3">
      <div className="font-medium text-sm">Manual field report</div>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>Title / source name</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </div>
        <div>
          <Label>Source</Label>
          <Select value={form.source_type} onValueChange={(v) => setForm({ ...form, source_type: v as SourceType })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="OSINT">OSINT</SelectItem>
              <SelectItem value="HUMINT">HUMINT</SelectItem>
              <SelectItem value="IMINT">IMINT</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Risk level</Label>
          <Select value={form.risk_level} onValueChange={(v) => setForm({ ...form, risk_level: v as RiskLevel })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Latitude</Label>
          <Input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} required />
        </div>
        <div>
          <Label>Longitude</Label>
          <Input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} required />
        </div>
        <div className="col-span-2">
          <Label>Region</Label>
          <Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
        </div>
        <div className="col-span-2">
          <Label>Description</Label>
          <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
      </div>
      <Button type="submit" disabled={busy} className="w-full glow-primary">
        {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Log field report
      </Button>
    </form>
  );
}

function ImintUpload({ userId }: { userId?: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({ title: "", latitude: "", longitude: "", notes: "", risk_level: "medium" as RiskLevel });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !file) {
      toast.error("Pick an image first");
      return;
    }
    setBusy(true);
    try {
      const path = `${userId}/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("intel-images").upload(path, file);
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("intel-images").getPublicUrl(path);
      const payload = {
        title: form.title,
        source_type: "IMINT" as SourceType,
        risk_level: form.risk_level,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        region: null,
        description: null,
        notes: form.notes || null,
        image_url: data.publicUrl,
      };
      const parsed = nodeSchema.safeParse(payload);
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      const { error } = await supabase.from("intel_nodes").insert({ ...parsed.data, user_id: userId });
      if (error) throw error;
      toast.success("IMINT node added");
      setFile(null);
      setForm({ title: "", latitude: "", longitude: "", notes: "", risk_level: "medium" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 lg:grid-cols-2">
      <label
        className="glass rounded-xl p-5 cursor-pointer flex flex-col items-center justify-center text-center min-h-[260px] border-dashed"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) setFile(f);
        }}
      >
        {file ? (
          <img src={URL.createObjectURL(file)} alt="preview" className="max-h-60 rounded-md border border-border" />
        ) : (
          <>
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
            <div className="mt-3 text-sm font-medium">Drop image (JPG / JPEG / PNG)</div>
            <div className="text-xs text-muted-foreground">Or click to browse</div>
          </>
        )}
        <input
          hidden
          type="file"
          accept="image/jpeg,image/png,image/jpg"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>

      <div className="glass rounded-xl p-5 space-y-3">
        <div className="font-medium text-sm">IMINT metadata</div>
        <div>
          <Label>Title</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Latitude</Label>
            <Input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} required />
          </div>
          <div>
            <Label>Longitude</Label>
            <Input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} required />
          </div>
        </div>
        <div>
          <Label>Risk level</Label>
          <Select value={form.risk_level} onValueChange={(v) => setForm({ ...form, risk_level: v as RiskLevel })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Observation notes</Label>
          <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <Button type="submit" disabled={busy} className="w-full glow-primary">
          {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Upload IMINT
        </Button>
      </div>
    </form>
  );
}

// ---------- helpers ----------

async function importJson(file: File, userId?: string) {
  if (!userId) return;
  try {
    const text = await file.text();
    const arr = JSON.parse(text);
    const list = Array.isArray(arr) ? arr : [arr];
    const rows = list
      .map((r) => coerceRow(r))
      .filter(Boolean) as ReturnType<typeof coerceRow>[];
    if (rows.length === 0) {
      toast.error("No valid rows in JSON");
      return;
    }
    const { error } = await supabase.from("intel_nodes").insert(rows.map((r) => ({ ...r!, user_id: userId })));
    if (error) throw error;
    toast.success(`Imported ${rows.length} OSINT nodes`);
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Import failed");
  }
}

async function importCsv(file: File, userId?: string) {
  if (!userId) return;
  Papa.parse(file, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: async (res) => {
      const rows = (res.data as Record<string, unknown>[])
        .map(coerceRow)
        .filter(Boolean) as ReturnType<typeof coerceRow>[];
      if (rows.length === 0) {
        toast.error("No valid rows");
        return;
      }
      const { error } = await supabase.from("intel_nodes").insert(rows.map((r) => ({ ...r!, user_id: userId })));
      if (error) toast.error(error.message);
      else toast.success(`Imported ${rows.length} HUMINT rows`);
    },
  });
}

async function importExcel(file: File, userId?: string) {
  if (!userId) return;
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  const rows = json.map(coerceRow).filter(Boolean) as ReturnType<typeof coerceRow>[];
  if (rows.length === 0) {
    toast.error("No valid rows");
    return;
  }
  const { error } = await supabase.from("intel_nodes").insert(rows.map((r) => ({ ...r!, user_id: userId })));
  if (error) toast.error(error.message);
  else toast.success(`Imported ${rows.length} rows from Excel`);
}

async function simulateImport(userId?: string, label = "Cloud") {
  if (!userId) return;
  const sample = [
    { title: `${label} feed item — encrypted chat surge`, source_type: "OSINT", risk_level: "medium", latitude: 28.6 + Math.random(), longitude: 77.2 + Math.random(), region: "Delhi-NCR", description: `Auto-ingested from ${label} simulation`, notes: null, image_url: null },
    { title: `${label} feed item — supply convoy reroute`, source_type: "OSINT", risk_level: "high", latitude: 26.9 + Math.random(), longitude: 75.7 + Math.random(), region: "Rajasthan", description: `Auto-ingested from ${label} simulation`, notes: null, image_url: null },
  ];
  const { error } = await supabase.from("intel_nodes").insert(sample.map((s) => ({ ...s, user_id: userId })));
  if (error) toast.error(error.message);
  else toast.success(`${label} import: ${sample.length} nodes`);
}

function coerceRow(r: Record<string, unknown> | null) {
  if (!r) return null;
  const out = {
    title: String(r.title ?? r.name ?? "").slice(0, 200),
    source_type: (String(r.source_type ?? r.source ?? "OSINT").toUpperCase() as SourceType) || "OSINT",
    risk_level: (String(r.risk_level ?? r.risk ?? "medium").toLowerCase() as RiskLevel) || "medium",
    latitude: Number(r.latitude ?? r.lat),
    longitude: Number(r.longitude ?? r.lng ?? r.lon),
    region: r.region ? String(r.region) : null,
    description: r.description ? String(r.description) : null,
    notes: r.notes ? String(r.notes) : null,
    image_url: r.image_url ? String(r.image_url) : null,
  };
  const parsed = nodeSchema.safeParse(out);
  return parsed.success ? parsed.data : null;
}
