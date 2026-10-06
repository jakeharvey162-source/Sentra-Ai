"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ShieldCheck, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type SavedCase = { id: string; case_ref: string; kind: string; input_preview: string; risk_score: number; decision: string; explanation: string; created_at: string };
type Evidence = { id: string; title: string; detail: string; severity: string };
const button = "rounded-xl border border-white/20 px-4 py-2 text-sm hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40";
export default function CasesPage() {
  const [cases, setCases] = useState<SavedCase[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [detail, setDetail] = useState<{ case: SavedCase; evidence: Evidence[] } | null>(null);
  const [pending, setPending] = useState<SavedCase | "all" | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const generation = useRef(0);
  const active = useRef(false);
  function clearPrivateData() {
    generation.current++; setCases([]); setDetail(null); setPending(null); setConfirmation("");
    setEmail(""); setSignedIn(false); setHasMore(false); setNotice("");
  }
  async function api(path = "", body?: Record<string, unknown>) {
    const response = await fetch(`/api/cases${path}`, { cache: "no-store", signal: AbortSignal.timeout(15000),
      ...(body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}) });
    const data = await response.json();
    if (response.status === 401) clearPrivateData();
    if (!response.ok) throw new Error(data.error || "Account request failed. Please try again.");
    return data;
  }
  async function refresh(target = 0) {
    const run = ++generation.current;
    setError(""); setDetail(null); setPending(null); setConfirmation("");
    try {
      const data = await api(`?page=${target}`);
      if (run !== generation.current) return;
      setCases(data.cases); setPage(data.page); setHasMore(data.hasMore); setEmail(data.email); setSignedIn(true);
    } catch (e) { if (run === generation.current) { setCases([]); setHasMore(false); setError(e instanceof Error ? e.message : "History unavailable."); } }
    finally { setLoaded(true); }
  }
  useEffect(() => {
    void refresh();
    const client = createClient();
    const subscription = client?.auth.onAuthStateChange(event => {
      if (event === "SIGNED_OUT") clearPrivateData();
      if (event === "SIGNED_IN") { clearPrivateData(); void refresh(); }
    });
    return () => { generation.current++; subscription?.data.subscription.unsubscribe(); };
  }, []);
  async function work(task: () => Promise<void>) {
    if (active.current) return;
    active.current = true; setBusy(true); setError(""); setNotice("");
    try { await task(); } catch (e) { setError(e instanceof Error ? e.message : "Request failed. Please try again."); }
    finally { active.current = false; setBusy(false); }
  }
  async function open(saved: SavedCase) {
    const run = ++generation.current; setDetail(null);
    await work(async () => { const data = await api(`?id=${encodeURIComponent(saved.id)}`); if (run === generation.current) setDetail(data); });
  }
  async function remove() {
    if (!pending) return;
    const all = pending === "all";
    await work(async () => {
      await api("", all ? { action: "deleteAll", confirmation } : { action: "delete", id: pending.id });
      setDetail(null); setPending(null); setConfirmation(""); await refresh();
      setNotice(all ? "All saved cases and their evidence were deleted." : "Saved case and its evidence were deleted.");
    });
  }
  async function signOut() {
    await work(async () => { await api("", { action: "signOut" }); clearPrivateData(); window.location.replace("/"); });
  }
  return <main className="min-h-screen bg-[#080b0a] px-5 py-8 text-white">
    <div className="mx-auto max-w-5xl">
      <a href="/" className="inline-flex items-center gap-2 text-sm text-white/70"><ArrowLeft size={16} /> Back to Sentra</a>
      <div className="mt-10 flex items-center gap-3 text-lime-300"><ShieldCheck size={26} /><span className="text-xs uppercase tracking-[0.2em]">Your account</span></div>
      <h1 className="mt-4 text-4xl font-semibold">Your saved investigations</h1>
      <p className="mt-4 max-w-2xl text-white/70">Review cases you chose to save, or delete them with their evidence. History contains a short input preview, not the full message. Results describe the checks at the time of investigation and can become outdated.</p>
      <a href="/privacy" className="mt-3 inline-block text-sm text-lime-200 underline">How Sentra handles your data</a>
      {error && <p role="alert" className="mt-5 rounded-xl border border-red-400/30 p-4 text-red-200">{error}</p>}
      {notice && <p role="status" className="mt-5 text-lime-200">{notice}</p>}
      {!loaded ? <p className="mt-8">Loading your history…</p> : !signedIn ? <section className="mt-8 rounded-2xl border border-white/15 p-6">
        <h2 className="text-xl">Sign in to view your saved cases</h2><p className="mt-3 text-white/70">You can still investigate a message without an account. Saving is optional.</p>
        <a href="/auth?next=/cases" className={`${button} mt-4 inline-block`}>Sign in / Create account</a>
      </section> : <>
        <div className="mt-8 flex flex-wrap items-center gap-3"><span className="mr-auto break-all text-sm text-white/70">{email}</span>
          <button disabled={busy} className={button} onClick={() => work(() => refresh(page))}>Refresh history</button>
          <button disabled={busy} className={button} onClick={signOut}>Sign out of this session</button>
          <button disabled={busy || cases.length === 0} className={button} onClick={() => { setPending("all"); setConfirmation(""); }}>Delete all saved cases</button>
        </div>
        {pending && <section role="region" aria-label="Confirm case deletion" className="mt-6 rounded-2xl border border-red-300/30 p-5">
          <h2 className="text-xl">{pending === "all" ? "Delete every saved case?" : `Delete ${pending.case_ref}?`}</h2>
          <p className="mt-2 text-sm text-white/75">This removes the saved {pending === "all" ? "cases" : "case"} and associated evidence from Sentra’s active database. This cannot be undone in the app.</p>
          {pending === "all" && <label className="mt-4 block text-sm">Type DELETE ALL SAVED CASES to confirm
            <input aria-label="Deletion confirmation" autoComplete="off" value={confirmation} disabled={busy} onChange={e => setConfirmation(e.target.value)} className="mt-2 block w-full max-w-md rounded-xl border border-white/20 bg-white/5 px-3 py-2" />
          </label>}
          <div className="mt-4 flex gap-3"><button disabled={busy || (pending === "all" && confirmation !== "DELETE ALL SAVED CASES")} className={`${button} border-red-300/40`} onClick={remove}>Confirm deletion</button>
            <button disabled={busy} className={button} onClick={() => { setPending(null); setConfirmation(""); }}>Cancel</button></div>
        </section>}
        {cases.length === 0 ? <p className="mt-8 rounded-2xl border border-white/10 p-6">No saved cases on this page. Investigations are not saved unless you choose Save this case.</p> :
          <section aria-label="Saved cases" className="mt-6 grid gap-4">
            {cases.map(saved => <article key={saved.id} className="rounded-2xl border border-white/15 bg-white/[0.02] p-5">
              <div className="flex flex-wrap items-center gap-3"><h2 className="mr-auto text-lg">{saved.case_ref}</h2><span className="text-sm text-lime-100">{saved.decision} · {saved.risk_score}/100</span></div>
              <p className="mt-2 text-xs text-white/60">{new Date(saved.created_at).toLocaleString()} · {saved.kind}</p>
              <p className="mt-4 break-words text-sm text-white/80">Saved preview: {saved.input_preview}</p>
              <div className="mt-4 flex flex-wrap gap-3"><button disabled={busy} className={button} onClick={() => open(saved)}>View evidence for {saved.case_ref}</button>
                <button disabled={busy} className={`${button} inline-flex items-center gap-2`} onClick={() => setPending(saved)}><Trash2 size={15} /> Delete {saved.case_ref}</button></div>
            </article>)}
          </section>}
        <div className="mt-6 flex items-center gap-4"><button disabled={busy || page === 0} className={button} onClick={() => work(() => refresh(page - 1))}>Newer cases</button>
          <span className="text-sm text-white/65">Page {page + 1}</span><button disabled={busy || !hasMore} className={button} onClick={() => work(() => refresh(page + 1))}>Older cases</button></div>
        {detail && <section aria-label="Saved case evidence" className="mt-8 rounded-2xl border border-lime-200/20 p-6">
          <h2 className="text-xl">Evidence for {detail.case.case_ref}</h2><p className="mt-4 whitespace-pre-wrap break-words text-white/80">{detail.case.explanation}</p>
          {detail.evidence.length === 0 && <p className="mt-4 text-white/70">No evidence was saved for this case.</p>}
          {detail.evidence.map(item => <article key={item.id} className="mt-4 border-t border-white/10 pt-4"><h3 className="font-semibold">{item.title}</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm text-white/75">{item.detail}</p><p className="mt-2 text-xs text-white/60">Severity: {item.severity}</p></article>)}
          <button className={`${button} mt-5`} onClick={() => setDetail(null)}>Close evidence</button>
        </section>}
      </>}
    </div>
  </main>;
}
