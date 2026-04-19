import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Radar, Loader2, ShieldCheck, Zap } from "lucide-react";

const DEMO_EMAIL = "demo.analyst@fusion.ops";
const DEMO_PASSWORD = "demo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Analyst Login — Strategic Fusion Dashboard" },
      { name: "description", content: "Secure analyst sign-in for the Strategic Fusion Dashboard." },
    ],
  }),
  component: LoginPage,
});

const credSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(4, "Min 4 characters").max(128),
});

function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [nowIso, setNowIso] = useState<string>("");

  useEffect(() => {
    setNowIso(new Date().toISOString().slice(0, 19));
    const t = setInterval(() => setNowIso(new Date().toISOString().slice(0, 19)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = credSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) throw error;
        toast.success("Access granted. Loading dashboard...");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Authenticated.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function forgotPassword() {
    const parsed = z.string().email().safeParse(email.trim());
    if (!parsed.success) {
      toast.error("Enter your email above first, then tap Forgot password.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset link sent. Check your inbox.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send reset email");
    } finally {
      setBusy(false);
    }
  }

  async function demoLogin() {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setBusy(true);
    try {
      let { error } = await supabase.auth.signInWithPassword({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      });
      if (error) {
        // Auto-create the demo account on first run
        const { error: signUpErr } = await supabase.auth.signUp({
          email: DEMO_EMAIL,
          password: DEMO_PASSWORD,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (signUpErr) throw signUpErr;
        const retry = await supabase.auth.signInWithPassword({
          email: DEMO_EMAIL,
          password: DEMO_PASSWORD,
        });
        if (retry.error) throw retry.error;
      }
      toast.success("Demo analyst signed in.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Demo login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background text-foreground">
      <div className="relative hidden lg:flex flex-col justify-between p-10 overflow-hidden border-r border-border">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute inset-0" style={{ background: "var(--gradient-glow)" }} />
        <div className="relative flex items-center gap-2">
          <Radar className="h-5 w-5 text-primary" />
          <span className="font-semibold tracking-wide">FUSION</span>
        </div>
        <div className="relative">
          <h2 className="text-3xl font-semibold tracking-tight">
            Operational picture, <span className="text-gradient">in one view</span>.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground max-w-md">
            Sign in to access the multi-source intelligence dashboard. Your demo theatre
            preloads automatically on first sign-in.
          </p>
          <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" /> Secured by Lovable Cloud · RLS-enforced per analyst
          </div>
        </div>
        <div className="relative text-xs text-muted-foreground font-mono min-h-[1rem]">
          {nowIso ? `${nowIso}Z · classified-grade UI` : "\u00A0"}
        </div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center lg:hidden flex items-center justify-center gap-2">
            <Radar className="h-5 w-5 text-primary" />
            <span className="font-semibold">FUSION</span>
          </div>
          <h1 className="text-2xl font-semibold">Analyst access</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin" ? "Sign in to your terminal." : "Request analyst credentials."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="analyst@fusion.ops" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2">
                <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} /> Remember me
              </label>
              <button
                type="button"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                className="text-primary hover:underline text-xs"
              >
                {mode === "signin" ? "Request access" : "Have access? Sign in"}
              </button>
            </div>
            <div className="text-right">
              <button
                type="button"
                onClick={forgotPassword}
                disabled={busy}
                className="text-xs text-primary hover:underline disabled:opacity-50"
              >
                Forgot password?
              </button>
            </div>
            <Button type="submit" className="w-full glow-primary" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Analyst Login" : "Request access"}
            </Button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={demoLogin}
              disabled={busy}
            >
              <Zap className="mr-2 h-4 w-4 text-primary" />
              One-click Demo analyst
            </Button>
          </form>

          <p className="mt-6 text-xs text-muted-foreground text-center">
            By continuing you accept analyst-tier acceptable use.
          </p>
        </div>
      </div>
    </div>
  );
}
