// Optional Cloudflare Turnstile bot challenge. Off unless VITE_TURNSTILE_SITE_KEY is set.
const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

type TurnstileApi = { render: (el: HTMLElement, opts: Record<string, unknown>) => string; remove: (id: string) => void };
declare global { interface Window { turnstile?: TurnstileApi } }

let loading: Promise<void> | null = null;
const load = () =>
  (loading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("challenge script blocked"));
    document.head.append(s);
  }));

/** Returns a one-time token, or undefined when no challenge is configured. */
export async function getTurnstileToken(): Promise<string | undefined> {
  if (!siteKey) return undefined;
  await load();
  return new Promise((resolve, reject) => {
    const box = document.createElement("div");
    box.style.cssText = "position:fixed;bottom:16px;right:16px;z-index:200";
    document.body.append(box);
    const id = window.turnstile!.render(box, {
      sitekey: siteKey,
      callback: (t: string) => { window.turnstile?.remove(id); box.remove(); resolve(t); },
      "error-callback": () => { box.remove(); reject(new Error("challenge failed")); },
    });
  });
}
