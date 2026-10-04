"use client";
import { useEffect, useRef, useState } from "react";
import { ShieldCheck, Mail, MessageSquare, ArrowLeft, RefreshCw, Unplug } from "lucide-react";
import { providers, type Provider } from "@/lib/connectors/providers";
type Account = { id: string; provider: Provider; status: string };
type Finding = { id: string; title: string; sender: string; decision: string; score: number; explanation: string; incomplete: boolean; evidence: { title: string; detail: string; severity: string }[] };
type Report = { findings: Finding[]; scanned: number; checkedAt: string; coverage: string };
const button = "rounded-xl border border-white/15 px-4 py-2 text-sm transition hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed";
export default function Connections() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [ready, setReady] = useState<Provider[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [consent, setConsent] = useState(false);
  const [selected, setSelected] = useState("");
  const [channel, setChannel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [monitor, setMonitor] = useState(false);
  const active = useRef(false);
  const generation = useRef(0);
  async function refresh() {
    generation.current++; setMonitor(false); setReport(null);
    setError("");
    try {
      const r = await fetch("/api/connections", { cache: "no-store", signal: AbortSignal.timeout(15000) });
      const data = await r.json();
      if (r.status === 401) { setSignedIn(false); setAccounts([]); setReady([]); setReport(null); setMonitor(false); return; }
      if (!r.ok) throw new Error(data.error);
      setSignedIn(true); setAccounts(data.accounts); setReady(data.platforms.filter((p: { ready: boolean }) => p.ready).map((p: { id: Provider }) => p.id));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load connections."); }
    finally { setLoaded(true); }
  }
  useEffect(() => { void refresh(); const s = new URLSearchParams(window.location.search).get("connection");
    if (s) { setNotice(s === "connected" ? "Account connected. Select it to scan." : "Connection could not be verified. Start again from this page."); window.history.replaceState({}, "", "/connections"); }
    return () => { generation.current++; };
  }, []);
  async function action(body: Record<string, unknown>) {
    const r = await fetch("/api/connections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(55000) });
    const data = await r.json();
    if (!r.ok) { if (r.status === 401) { setSignedIn(false); setReport(null); } throw new Error(data.error || "Connection request failed."); }
    return data;
  }
  async function link(provider: Provider) {
    if (active.current) return; active.current = true; setBusy(true); setError("");
    try { const data = await action({ action: "link", provider, consent });
      const url = new URL(data.redirectUrl);
      if (url.protocol !== "https:" || url.hostname !== "connect.composio.dev" || url.username || url.password || url.port) throw new Error("Invalid authorization link.");
      window.location.assign(url.href);
    } catch (e) { setError(e instanceof Error ? e.message : "Connection failed."); }
    finally { active.current = false; setBusy(false); }
  }
  async function scan() {
    if (active.current || !selected || !consent || !signedIn) return;
    const run = generation.current; active.current = true; setBusy(true); setError("");
    try { const data = await action({ action: "scan", accountId: selected, channel, consent });
      if (run === generation.current) setReport(data);
    } catch (e) { if (run === generation.current) { setError(e instanceof Error ? e.message : "Scan failed."); setReport(null); setMonitor(false); } }
    finally { active.current = false; setBusy(false); }
  }
  useEffect(() => {
    if (!monitor || !consent || !selected) return;
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void scan(); }, 60000);
    return () => clearInterval(timer);
  }, [monitor, consent, selected, channel, signedIn]);
  function clear() { generation.current++; setReport(null); setMonitor(false); setError(""); }
  async function disconnect(accountId: string) {
    if (active.current) return; clear(); active.current = true; setBusy(true);
    try { await action({ action: "disconnect", accountId }); if (selected === accountId) setSelected("");
      setNotice("Connection revoked in Composio. You can also remove Composio in the platform’s authorized-app settings."); await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Disconnect failed."); }
    finally { active.current = false; setBusy(false); }
  }
  const selectedAccount = accounts.find(a => a.id === selected);
  return <main className="min-h-screen bg-[#080b0a] px-5 py-8 text-white">
    <div className="mx-auto max-w-5xl">
      <a href="/" className="inline-flex items-center gap-2 text-sm text-white/60"><ArrowLeft size={16} /> Back to Sentra</a>
      <div className="mt-12 flex items-center gap-3 text-lime-300"><ShieldCheck size={28} /><span className="text-xs uppercase tracking-[0.25em]">Connected protection</span></div>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">Catch threats where they arrive.</h1>
      <p className="mt-4 max-w-2xl text-white/65">Connect an account with Composio, then check recent messages for phishing, credential pressure and deceptive links. Sentra reads messages without sending, deleting or changing them.</p>
      <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/65">Composio handles authorization and stores the platform tokens. Sentra processes message text on its server and returns evidence. This scan does not save message bodies or send them to the AI Council. Review the platform’s permission screen before granting access.</div>
      {notice && <p role="status" className="mt-4 text-sm text-lime-200">{notice}</p>}
      {error && <p role="alert" className="mt-4 rounded-xl border border-red-400/30 p-4 text-red-200">{error}</p>}
      {!loaded ? <p className="mt-8">Loading connections…</p> : !signedIn ? <div className="mt-8 rounded-2xl border border-lime-300/20 p-6"><h2 className="text-xl">Sign in to connect your accounts</h2><p className="mt-2 text-white/60">Each connection belongs to your Sentra account.</p><a href="/auth" className={`${button} mt-4 inline-block`}>Sign in / Create account</a></div> : null}
      <label className="mt-8 flex items-start gap-3 text-sm text-white/75"><input type="checkbox" checked={consent} disabled={busy} onChange={e => { clear(); setConsent(e.target.checked); }} className="mt-1 accent-lime-300" />I agree to connect through Composio and let Sentra read recent messages from my selected account for threat detection.</label>
      <section aria-label="Available platforms" className="mt-6 grid gap-4 md:grid-cols-3">
        {providers.map(p => <article key={p.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          {p.id === "slack" ? <MessageSquare className="text-lime-300" /> : <Mail className="text-lime-300" />}
          <h2 className="mt-4 text-xl">{p.name}</h2><p className="mt-2 text-sm text-white/55">{p.detail}</p>
          <p className="mt-2 text-xs text-white/45">{ready.includes(p.id) ? "Ready to connect" : "Awaiting administrator setup"}</p>
          <button className={`${button} mt-4`} disabled={!signedIn || !consent || busy || !ready.includes(p.id)} onClick={() => link(p.id)}>Connect {p.name}</button>
        </article>)}
      </section>
      <section aria-label="Your connected accounts" className="mt-10 rounded-2xl border border-white/10 p-5">
        <div className="flex items-center justify-between gap-3"><h2 className="text-xl">Your connected accounts</h2><button aria-label="Refresh connections" className={button} disabled={busy} onClick={() => refresh()}><RefreshCw size={16} /></button></div>
        {accounts.length === 0 ? <p className="mt-4 text-sm text-white/55">No connected accounts yet.</p> : <ul className="mt-4 space-y-3">{accounts.map(a => <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/5 p-3"><span>{providers.find(p => p.id === a.provider)?.name} <span className="text-xs text-white/45">{a.id.slice(-8)} · {a.status}</span></span><button className={button} disabled={busy} onClick={() => disconnect(a.id)}><Unplug size={14} className="mr-2 inline" />Disconnect</button></li>)}</ul>}
        <label className="mt-6 block text-sm">Account to scan<select aria-label="Account to scan" value={selected} disabled={busy} onChange={e => { clear(); setSelected(e.target.value); }} className="mt-2 w-full rounded-xl border border-white/15 bg-[#101613] p-3"><option value="">Select an account</option>{accounts.filter(a => a.status === "ACTIVE").map(a => <option key={a.id} value={a.id}>{a.provider} · {a.id.slice(-8)}</option>)}</select></label>
        {selectedAccount?.provider === "slack" && <label className="mt-4 block text-sm">Slack channel ID<input placeholder="C0123456789" value={channel} disabled={busy} onChange={e => { clear(); setChannel(e.target.value); }} maxLength={32} className="mt-2 w-full rounded-xl border border-white/15 bg-transparent p-3" /></label>}
        <button className={`${button} mt-5 border-lime-300/30 text-lime-200`} disabled={busy || !selected || !consent || !signedIn || (selectedAccount?.provider === "slack" && !/^[CGD][A-Z0-9]{8,30}$/.test(channel))} onClick={() => scan()}>{busy ? "Working…" : "Scan recent messages"}</button>
        <label className="mt-5 flex items-start gap-3 text-sm text-white/65"><input type="checkbox" checked={monitor} disabled={!selected || !consent || busy || !signedIn || (selectedAccount?.provider === "slack" && !/^[CGD][A-Z0-9]{8,30}$/.test(channel))} onChange={e => { setMonitor(e.target.checked); if (e.target.checked) void scan(); }} className="mt-1 accent-lime-300" />Check every minute while this page is open and visible. Monitoring stops when you close the page or a scan fails.</label>
      </section>
      {report && <section aria-label="Connected scan results" className="mt-8"><h2 className="text-xl">{report.scanned} messages checked</h2><p className="mt-2 text-xs text-white/50">Last checked {new Date(report.checkedAt).toLocaleTimeString()}</p><p className="mt-3 text-sm text-white/60">{report.coverage}</p>
        {report.findings.length === 0 && <p className="mt-4">No recent messages returned. No messages were classified.</p>}
        <div className="mt-5 space-y-4">{report.findings.map((f, i) => <article key={`${f.id}-${i}`} className="rounded-2xl border border-white/10 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="break-words font-medium">{f.title}</h3><span className={f.decision === "BLOCK" ? "text-red-300" : f.decision === "HOLD" ? "text-amber-200" : "text-lime-200"}>{f.decision} · {f.score}/100</span></div><p className="mt-2 break-words text-xs text-white/45">{f.sender}</p><p className="mt-3 text-sm text-white/65">{f.explanation}</p>{f.incomplete && <p className="mt-3 text-sm text-amber-200">Partial content: this message exceeded the inspection limit. Review it manually.</p>}<ul className="mt-3 space-y-2">{f.evidence.map((e, j) => <li key={j} className="break-words text-sm"><span className="text-white/80">{e.title}</span><p className="text-white/45">{e.detail}</p></li>)}</ul></article>)}</div></section>}
    </div>
  </main>;
}
