import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Image as ImageIcon,
  Pencil,
  Trash2,
  MapPin,
  Calendar,
  Save,
  X as XIcon,
  Loader2,
  Copy,
} from "lucide-react";
import {
  RISK_LABEL,
  SOURCE_LABEL,
  type IntelNode,
  type RiskLevel,
  type SourceType,
} from "@/lib/intel-types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

const RISKS: RiskLevel[] = ["high", "medium", "low", "verified"];
const SOURCES: SourceType[] = ["OSINT", "HUMINT", "IMINT"];

interface Props {
  node: IntelNode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => void;
}

export function NodeDetailDrawer({ node, open, onOpenChange, onChanged }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draft, setDraft] = useState<IntelNode | null>(node);

  useEffect(() => {
    setDraft(node);
    setEditing(false);
  }, [node]);

  if (!node) return null;
  const n = editing && draft ? draft : node;

  function update<K extends keyof IntelNode>(key: K, value: IntelNode[K]) {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  }

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    const { error } = await supabase
      .from("intel_nodes")
      .update({
        title: draft.title,
        source_type: draft.source_type,
        risk_level: draft.risk_level,
        latitude: Number(draft.latitude),
        longitude: Number(draft.longitude),
        region: draft.region,
        description: draft.description,
        notes: draft.notes,
        image_url: draft.image_url,
      })
      .eq("id", draft.id);
    setSaving(false);
    if (error) {
      toast.error("Update failed", { description: error.message });
      return;
    }
    toast.success("Node updated");
    setEditing(false);
    onChanged?.();
  }

  async function handleDelete() {
    if (!node) return;
    const { error } = await supabase.from("intel_nodes").delete().eq("id", node.id);
    if (error) {
      toast.error("Delete failed", { description: error.message });
      return;
    }
    toast.success("Node deleted");
    setConfirmDelete(false);
    onOpenChange(false);
    onChanged?.();
  }

  function copyCoords() {
    navigator.clipboard.writeText(`${n.latitude}, ${n.longitude}`);
    toast.success("Coordinates copied");
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md overflow-y-auto p-0"
        >
          <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur px-5 py-4">
            <SheetHeader className="space-y-2 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{SOURCE_LABEL[n.source_type]}</Badge>
                <Badge
                  className="text-white"
                  style={{
                    background:
                      n.risk_level === "high"
                        ? "var(--color-risk-high)"
                        : n.risk_level === "medium"
                          ? "var(--color-risk-medium)"
                          : n.risk_level === "low"
                            ? "var(--color-risk-low)"
                            : "var(--color-risk-verified)",
                  }}
                >
                  {RISK_LABEL[n.risk_level]}
                </Badge>
              </div>
              <SheetTitle className="text-base leading-snug">
                {editing ? "Editing intel node" : n.title}
              </SheetTitle>
              <SheetDescription className="flex items-center gap-1.5 text-xs">
                <MapPin className="h-3 w-3" />
                {n.region ?? "Unknown region"} · {Number(n.latitude).toFixed(4)},{" "}
                {Number(n.longitude).toFixed(4)}
              </SheetDescription>
            </SheetHeader>
          </div>

          <div className="px-5 py-4 space-y-5">
            {/* Image */}
            {n.image_url ? (
              <img
                src={n.image_url}
                alt={n.title}
                className="w-full h-48 object-cover rounded-md border border-border"
              />
            ) : (
              <div className="w-full h-48 rounded-md border border-dashed border-border bg-muted/30 flex flex-col items-center justify-center text-muted-foreground gap-1">
                <ImageIcon className="h-6 w-6" />
                <span className="text-xs">No image</span>
              </div>
            )}

            {editing ? (
              <div className="space-y-4">
                <Field label="Title">
                  <Input value={n.title} onChange={(e) => update("title", e.target.value)} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Source">
                    <Select
                      value={n.source_type}
                      onValueChange={(v) => update("source_type", v as SourceType)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SOURCES.map((s) => (
                          <SelectItem key={s} value={s}>{SOURCE_LABEL[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Risk">
                    <Select
                      value={n.risk_level}
                      onValueChange={(v) => update("risk_level", v as RiskLevel)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {RISKS.map((r) => (
                          <SelectItem key={r} value={r}>{RISK_LABEL[r]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Latitude">
                    <Input
                      type="number"
                      step="0.0001"
                      value={n.latitude}
                      onChange={(e) => update("latitude", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Longitude">
                    <Input
                      type="number"
                      step="0.0001"
                      value={n.longitude}
                      onChange={(e) => update("longitude", Number(e.target.value))}
                    />
                  </Field>
                </div>
                <Field label="Region">
                  <Input
                    value={n.region ?? ""}
                    onChange={(e) => update("region", e.target.value || null)}
                  />
                </Field>
                <Field label="Image URL">
                  <Input
                    value={n.image_url ?? ""}
                    onChange={(e) => update("image_url", e.target.value || null)}
                    placeholder="https://…"
                  />
                </Field>
                <Field label="Description">
                  <Textarea
                    rows={3}
                    value={n.description ?? ""}
                    onChange={(e) => update("description", e.target.value || null)}
                  />
                </Field>
                <Field label="Analyst notes">
                  <Textarea
                    rows={3}
                    value={n.notes ?? ""}
                    onChange={(e) => update("notes", e.target.value || null)}
                  />
                </Field>
              </div>
            ) : (
              <div className="space-y-4 text-sm">
                <Section label="Description">{n.description || "—"}</Section>
                <Section label="Analyst notes">{n.notes || "—"}</Section>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Meta label="Source">{SOURCE_LABEL[n.source_type]}</Meta>
                  <Meta label="Risk">{RISK_LABEL[n.risk_level]}</Meta>
                  <Meta label="Region">{n.region ?? "—"}</Meta>
                  <Meta label="Coordinates">
                    <button
                      onClick={copyCoords}
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      {Number(n.latitude).toFixed(3)}, {Number(n.longitude).toFixed(3)}
                      <Copy className="h-3 w-3" />
                    </button>
                  </Meta>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                  <Calendar className="h-3 w-3" />
                  Ingested {format(new Date(n.created_at), "PPp")}
                </div>
                <div className="font-mono text-[10px] text-muted-foreground/70 break-all">
                  {n.id}
                </div>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 z-10 border-t border-border bg-background/95 backdrop-blur px-5 py-3 flex items-center gap-2">
            {editing ? (
              <>
                <Button size="sm" onClick={handleSave} disabled={saving} className="flex-1">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-1.5" /> Save</>}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setDraft(node);
                    setEditing(false);
                  }}
                  disabled={saving}
                >
                  <XIcon className="h-4 w-4 mr-1.5" /> Cancel
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="flex-1">
                  <Pencil className="h-4 w-4 mr-1.5" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmDelete(true)}
                  className="text-[color:var(--color-risk-high)] hover:text-[color:var(--color-risk-high)]"
                >
                  <Trash2 className="h-4 w-4 mr-1.5" /> Delete
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this intel node?</AlertDialogTitle>
            <AlertDialogDescription>
              "{node.title}" will be permanently removed from the operational picture. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-[color:var(--color-risk-high)] hover:bg-[color:var(--color-risk-high)]/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{label}</div>
      <p className="leading-relaxed whitespace-pre-wrap">{children}</p>
    </div>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm mt-0.5">{children}</div>
    </div>
  );
}
