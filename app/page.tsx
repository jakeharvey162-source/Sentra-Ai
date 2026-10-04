"use client";

import { Activity, ArrowRight, Bot, FileSearch, Fingerprint, GitBranch, Radar, ScanSearch, ShieldCheck, ShieldQuestion, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const agents = [
  ["Phishing Investigator", "Message, sender and social-engineering analysis"],
  ["URL Investigator", "Domain, redirect and reputation evidence"],
  ["Identity Investigator", "Impersonation and identity inconsistencies"],
  ["Media Investigator", "Provenance and synthetic-media signals"],
  ["Threat Intel Agent", "MITRE and external threat-intelligence context"],
  ["Scam DNA Agent", "Attack-family and campaign similarity"]
];

const findings = [
  { label: "Domain reputation", value: "Malicious indicators", state: "high" },
  { label: "Sender identity", value: "Mismatch detected", state: "high" },
  { label: "Threat intelligence", value: "2 corroborating sources", state: "warn" },
  { label: "Provenance", value: "Unknown — not treated as fake", state: "neutral" }
];

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
      {children}
    </span>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 bg-grid-dark bg-[size:32px_32px] opacity-60" />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl border border-blue-400/20 bg-blue-500/10 shadow-glow">
            <ShieldCheck className="size-5 text-blue-300" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-[0.24em] text-slate-100">SENTRA</div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">AI Cyber Defense Team</div>
          </div>
        </div>
        <nav className="hidden items-center gap-7 text-sm text-slate-400 md:flex">
          <a href="#investigate" className="hover:text-white">Investigate</a>
          <a href="#protect" className="hover:text-white">Protect My App</a>
          <a href="#team" className="hover:text-white">Cyber Team</a>
        </nav>
        <button className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white backdrop-blur hover:bg-white/[0.08]">
          Launch Sentra
        </button>
      </header>

      <section id="investigate" className="relative z-10 mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-16 lg:grid-cols-[1.05fr_.95fr] lg:pt-24">
        <div className="flex flex-col justify-center">
          <div className="mb-5 flex flex-wrap gap-2">
            <Badge>ForgeHacks 2026</Badge>
            <Badge>AI + Cybersecurity</Badge>
            <Badge>Evidence-driven decisions</Badge>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-0.045em] text-white md:text-7xl"
          >
            Don&apos;t trust blindly.
            <span className="block bg-gradient-to-r from-blue-300 via-sky-200 to-emerald-300 bg-clip-text text-transparent">
              Investigate intelligently.
            </span>
          </motion.h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-400 md:text-lg">
            Sentra turns suspicious links, messages, files and applications into evidence-backed cyber investigations.
            Multiple AI specialists disagree, verify and reach a safer decision together.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-200">
              Investigate a threat <ArrowRight className="size-4" />
            </button>
            <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white hover:bg-white/[0.07]">
              <GitBranch className="size-4" /> Protect my app
            </button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative"
        >
          <div className="absolute -inset-6 rounded-[36px] bg-blue-500/10 blur-3xl" />
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0f17]/90 p-5 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Live investigation</div>
                <div className="mt-1 font-medium">CASE S-0019281</div>
              </div>
              <span className="rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-300">
                HIGH RISK
              </span>
            </div>

            <div className="grid gap-4 py-5 md:grid-cols-[130px_1fr]">
              <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                <div className="grid size-20 place-items-center rounded-full border-[7px] border-red-400/20 text-2xl font-bold text-red-300">91</div>
                <div className="mt-3 text-xs text-slate-500">Risk / 100</div>
              </div>
              <div className="space-y-2">
                {findings.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
                    <div>
                      <div className="text-xs text-slate-500">{item.label}</div>
                      <div className="mt-1 text-sm text-slate-200">{item.value}</div>
                    </div>
                    <div className={item.state === "high" ? "size-2 rounded-full bg-red-400" : item.state === "warn" ? "size-2 rounded-full bg-amber-300" : "size-2 rounded-full bg-slate-500"} />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-blue-400/15 bg-blue-500/[0.06] p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-200">
                <ShieldQuestion className="size-4" /> Cyber Jury decision
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Block and independently verify. Multiple independent signals conflict with the claimed sender identity.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      <section id="team" className="relative z-10 mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 max-w-2xl">
          <div className="text-xs uppercase tracking-[0.24em] text-blue-300">Cyber Team</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Different agents. Different evidence. One defensible decision.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map(([name, desc], index) => {
            const Icon = [ScanSearch, Radar, Fingerprint, FileSearch, Activity, Bot][index];
            return (
              <motion.div key={name} whileHover={{ y: -4 }} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                <div className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04]">
                  <Icon className="size-5 text-slate-200" />
                </div>
                <div className="mt-5 font-medium">{name}</div>
                <div className="mt-2 text-sm leading-6 text-slate-500">{desc}</div>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section id="protect" className="relative z-10 mx-auto max-w-7xl px-6 py-16">
        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.015] p-7 md:p-10">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-emerald-300">Protect My App</div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Give Sentra something you own. Get a defensive cyber team.</h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
                Connect an authorised repository, API or deployed app. Sentra maps the defensive attack surface,
                prioritises findings, explains impact and creates a remediation plan without pretending uncertainty does not exist.
              </p>
              <button className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white px-5 py-3 text-sm font-semibold text-slate-950">
                Add protected asset <ArrowRight className="size-4" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Code Guardian", "Secrets, dependencies and risky patterns", "3 critical"],
                ["App Guardian", "Auth, headers, APIs and configuration", "7 high"],
                ["AI Guardian", "Prompt injection, tools and data leakage", "2 high"],
                ["Privacy Guardian", "PII exposure and unsafe data flows", "4 medium"]
              ].map(([name, text, count]) => (
                <div key={name} className="rounded-2xl border border-white/10 bg-[#080c13]/70 p-5">
                  <div className="flex items-center justify-between">
                    <Sparkles className="size-4 text-blue-300" />
                    <span className="text-xs text-slate-500">{count}</span>
                  </div>
                  <div className="mt-6 font-medium">{name}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-500">{text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 mx-auto max-w-7xl border-t border-white/10 px-6 py-8 text-xs text-slate-600">
        Sentra AI — evidence before confidence.
      </footer>
    </main>
  );
}
