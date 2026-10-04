"use client";

import { FormEvent, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function AuthPage() {
  const configured = isSupabaseConfigured();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    if (!supabase) {
      setMessage("Supabase is not configured for this deployment yet.");
      setBusy(false);
      return;
    }

    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (result.error) {
      setMessage(result.error.message);
    } else if (mode === "login") {
      window.location.href = "/";
    } else {
      setMessage("Account created. Check your email if confirmation is enabled.");
    }
    setBusy(false);
  }

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#0a0f17]/90 p-7 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl border border-blue-400/20 bg-blue-500/10">
            <ShieldCheck className="size-5 text-blue-300" />
          </div>
          <div>
            <div className="font-semibold tracking-[0.18em]">SENTRA</div>
            <div className="text-xs text-slate-500">Secure case history</div>
          </div>
        </div>

        <h1 className="mt-8 text-2xl font-semibold">{mode === "login" ? "Sign in" : "Create account"}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Signing in lets Sentra save your investigations behind owner-only database policies.
        </p>

        {!configured && (
          <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-sm text-amber-200">
            Authentication is temporarily unavailable because Supabase environment variables are not configured on this deployment.
          </div>
        )}

        <form onSubmit={submit} className="mt-6 space-y-3">
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Email" className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none focus:border-blue-400/40" />
          <input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Password" className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none focus:border-blue-400/40" />
          <button disabled={busy || !configured} className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50">
            {busy ? "Working..." : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        {message && <p className="mt-4 text-sm text-slate-300">{message}</p>}

        <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="mt-5 text-sm text-blue-300">
          {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}
