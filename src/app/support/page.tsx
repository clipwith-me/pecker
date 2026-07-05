"use client";

import { useRouter } from "next/navigation";
import { ExternalLink, ArrowLeft } from "lucide-react";
import { PeckerLogo } from "@/components/ui/pecker-logo";

const supporters = [
  {
    emoji: "☕",
    name: "Ko-fi",
    description: "One-time or monthly support via card or PayPal — as little as $3. Fast and simple.",
    href: "https://ko-fi.com/Pecker",
    color: "bg-sky-100 text-sky-700",
    cta: "Support on Ko-fi",
  },
  {
    emoji: "🌍",
    name: "Open Collective",
    description: "Transparent, community-backed giving. Every dollar received and spent is publicly tracked.",
    href: "https://opencollective.com/peckersolve",
    color: "bg-indigo-100 text-indigo-700",
    cta: "Support on Open Collective",
  },
];

const uses = [
  "Server & database hosting (Neon, Vercel)",
  "File storage for incident photos and videos",
  "SMS & push notification delivery",
  "Building new features and mobile apps",
];

export default function SupportPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-[#0D1F52] px-5 py-10 text-white">
      <div className="max-w-lg mx-auto">

        {/* Back */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-indigo-300 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* Hero */}
        <div className="text-center mb-10">
          <PeckerLogo variant="white" size="xl" showTagline className="flex-col items-center mb-6" />
          <h1 className="text-2xl font-bold mb-3">Help keep Pecker free</h1>
          <p className="text-indigo-200 text-sm leading-relaxed max-w-sm mx-auto">
            Pecker is free to use for every resident, responder, and community — forever.
            Your support covers the infrastructure that makes it possible.
          </p>
        </div>

        {/* Support options */}
        <div className="space-y-3 mb-10">
          {supporters.map(({ emoji, name, description, href, color, cta }) => (
            <a
              key={name}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-colors group"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-2xl ${color}`}>
                {emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white">{name}</p>
                <p className="text-xs text-indigo-200 leading-snug mt-0.5">{description}</p>
                <p className="text-xs font-semibold text-indigo-300 group-hover:text-white mt-1 transition-colors">
                  {cta} →
                </p>
              </div>
              <ExternalLink className="h-4 w-4 text-white/30 shrink-0 group-hover:text-white/70 transition-colors" />
            </a>
          ))}
        </div>

        {/* What money goes towards */}
        <div className="bg-white/10 backdrop-blur rounded-2xl border border-white/20 p-5 mb-8">
          <h2 className="font-bold text-sm text-white mb-3 uppercase tracking-wide">Where your support goes</h2>
          <ul className="space-y-2">
            {uses.map((use) => (
              <li key={use} className="flex items-start gap-2 text-sm text-indigo-200">
                <span className="text-indigo-400 mt-0.5">✓</span>
                {use}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-center text-indigo-400/60 text-xs">
          Pecker is open source — no subscriptions, no paywalls, no ads.
        </p>
      </div>
    </div>
  );
}
