import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Sun, Moon, Volume2, VolumeX } from "lucide-react";
import { isAlertMuted, setAlertMuted, playAlertBeep } from "@/lib/alert-sound";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({ meta: [{ title: "Settings — Strategic Fusion Dashboard" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const [muted, setMuted] = useState(false);
  useEffect(() => {
    setMuted(isAlertMuted());
  }, []);
  const onMuteChange = (checked: boolean) => {
    // Switch shows "Sound on" — checked = sound on, so muted = !checked
    const nextMuted = !checked;
    setMuted(nextMuted);
    setAlertMuted(nextMuted);
    if (!nextMuted) playAlertBeep();
  };
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your analyst terminal.</p>
      </div>

      <div className="glass rounded-xl p-5 space-y-4">
        <h3 className="font-medium">Profile</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Email</Label>
            <div className="mt-1 rounded-md border border-border bg-card px-3 py-2 text-sm">{user?.email}</div>
          </div>
          <div>
            <Label>Analyst ID</Label>
            <div className="mt-1 rounded-md border border-border bg-card px-3 py-2 text-sm font-mono">
              {user?.id.slice(0, 8)}…
            </div>
          </div>
        </div>
      </div>

      <div className="glass rounded-xl p-5 space-y-4">
        <h3 className="font-medium">Appearance</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            Tactical {theme} mode
          </div>
          <Switch checked={theme === "dark"} onCheckedChange={toggle} />
        </div>
      </div>

      <div className="glass rounded-xl p-5 space-y-4">
        <h3 className="font-medium">Notifications</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            {muted ? (
              <VolumeX className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Volume2 className="h-4 w-4 text-primary" />
            )}
            High-risk alert sound
          </div>
          <Switch checked={!muted} onCheckedChange={onMuteChange} />
        </div>
        <p className="text-xs text-muted-foreground">
          Plays a subtle beep when a new high-risk intel node is ingested. Toggling on plays a preview.
        </p>
      </div>

      <div className="glass rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /><h3 className="font-medium">Security</h3></div>
        <p className="text-sm text-muted-foreground">
          Row-level security is enforced per analyst. Only your nodes are visible to you.
        </p>
        <Button variant="outline" onClick={() => signOut()}>End session</Button>
      </div>
    </div>
  );
}
