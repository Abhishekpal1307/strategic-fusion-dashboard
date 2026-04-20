// Subtle beep used for high-risk alerts. Uses WebAudio so no asset is needed.
const MUTE_KEY = "fusion.alerts.muted";

export function isAlertMuted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(MUTE_KEY) === "1";
}

export function setAlertMuted(muted: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  window.dispatchEvent(new CustomEvent("fusion:alert-muted-changed"));
}

let ctx: AudioContext | null = null;

export function playAlertBeep() {
  if (typeof window === "undefined") return;
  if (isAlertMuted()) return;
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return;
    if (!ctx) ctx = new AC();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    // Two-tone tactical chirp
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(1180, now + 0.09);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.24);
  } catch {
    // ignore audio failures (autoplay policy, etc.)
  }
}
