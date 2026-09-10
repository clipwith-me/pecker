import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PeckerLogo } from "@/components/ui/pecker-logo";
import {
  MapPin, Shield, Bell, BarChart2, ThumbsUp, Video,
  Map, FileDown, EyeOff, Clock, Zap, ArrowRight, CheckCircle2, Heart, Github,
} from "lucide-react";

export default async function RootPage() {
  const session = await auth();
  if (session) {
    const role = session.user.role;
    if (role === "ADMIN" || role === "RESPONDER") redirect("/admin");
    redirect("/incidents");
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── NAV ─────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <PeckerLogo variant="default" size="sm" />
          <div className="flex items-center gap-3">
            <Link href="/map" className="hidden sm:flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
              <Map className="h-4 w-4" /> Live Map
            </Link>
            <Link href="/support" className="hidden sm:flex items-center gap-1.5 text-sm text-rose-500 hover:text-rose-700 font-medium transition-colors">
              <Heart className="h-4 w-4" /> Support
            </Link>
<Link href="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
              Sign in
            </Link>
            <Link href="/register" className="text-sm font-semibold bg-[#0D1F52] text-white px-4 py-2 rounded-xl hover:bg-[#0D1F52]/90 transition-colors">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────── */}
      <section className="bg-gradient-to-b from-[#0D1F52] to-[#1a3580] text-white px-5 pt-20 pb-24 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live product · Now in Beta
          </div>
          <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-5">
            Know what&apos;s happening<br />
            <span className="text-blue-300">anywhere in Nigeria.</span>
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed mb-8 max-w-xl mx-auto">
            Check the live incident map before you travel — across any state, city, or road in Nigeria. Report security threats, flooding, infrastructure failures, and hazards — tracked, assigned, and resolved. Not buried in a WhatsApp group.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-white text-[#0D1F52] font-bold px-7 py-3.5 rounded-2xl hover:bg-blue-50 transition-colors text-sm">
              Get started free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/map" className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/30 text-white font-semibold px-7 py-3.5 rounded-2xl hover:bg-white/20 transition-colors text-sm">
              <Map className="h-4 w-4" /> Check live incident map
            </Link>
          </div>
        </div>
      </section>

      {/* ── METRICS STRIP ───────────────────────── */}
      <section className="border-b border-gray-100 bg-gray-50">
        <div className="max-w-4xl mx-auto px-5 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { num: "60s", label: "Max reporting time" },
            { num: "27+", label: "Features shipped" },
            { num: "6", label: "Lifecycle states" },
            { num: "100%", label: "Audit trail coverage" },
          ].map(({ num, label }) => (
            <div key={label}>
              <p className="text-3xl font-black text-[#0D1F52]">{num}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROBLEM ─────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-5 py-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4">
          WhatsApp groups are not an incident management system.
        </h2>
        <p className="text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Complaints get buried. Nothing gets resolved. Nobody knows who is responsible. Residents lose trust. Managers lose sleep.
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: "😤", title: "No tracking", body: "Messages disappear in group chats. No one knows the status of their report." },
            { icon: "🤷", title: "No accountability", body: "Incidents with no owner get ignored. Urgent issues compete with trivial ones." },
            { icon: "🔁", title: "Recurring problems", body: "The same drain floods every rainy season. Nobody connects the dots." },
          ].map(({ icon, title, body }) => (
            <div key={title} className="bg-red-50 border border-red-100 rounded-2xl p-5 text-left">
              <span className="text-3xl">{icon}</span>
              <h3 className="font-bold text-gray-900 mt-3 mb-1">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── MAP SAFETY SECTION ──────────────────── */}
      <section className="bg-[#0D1F52] text-white px-5 py-16 overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left — text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-400/30 rounded-full px-3 py-1 text-xs font-semibold text-red-300 mb-5">
                🔴 Live · Updated in real time
              </div>
              <h2 className="text-3xl sm:text-4xl font-black leading-tight mb-5">
                Check before you go.<br />
                <span className="text-blue-300">Stay safe, stay informed.</span>
              </h2>
              <p className="text-blue-100 leading-relaxed mb-6">
                Travelling to a new estate, campus, or city? Open the Pecker map first. See every reported incident — armed robbery, road blockage, flooding, power outage — pinned to the exact street it happened on. No sign-up required.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  { icon: "📍", text: "Incidents pinned to exact GPS coordinates" },
                  { icon: "🔴", text: "Critical threats highlighted in red — visible at a glance" },
                  { icon: "🌍", text: "Search any city, estate, or campus worldwide" },
                  { icon: "🕐", text: "See how recent each incident is and its current status" },
                  { icon: "👍", text: "Community-verified — upvoted by multiple residents" },
                ].map(({ icon, text }) => (
                  <li key={text} className="flex items-start gap-3 text-sm text-blue-100">
                    <span className="text-lg shrink-0 leading-tight">{icon}</span>
                    {text}
                  </li>
                ))}
              </ul>
              <Link
                href="/map"
                className="inline-flex items-center gap-2 bg-white text-[#0D1F52] font-bold px-6 py-3 rounded-2xl hover:bg-blue-50 transition-colors text-sm"
              >
                <Map className="h-4 w-4" /> Open the live map →
              </Link>
            </div>

            {/* Right — map mockup */}
            <div className="relative">
              <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                {/* Fake browser bar */}
                <div className="flex items-center gap-2 px-4 py-3 bg-white/10 border-b border-white/10">
                  <span className="w-3 h-3 rounded-full bg-red-400/60" />
                  <span className="w-3 h-3 rounded-full bg-yellow-400/60" />
                  <span className="w-3 h-3 rounded-full bg-emerald-400/60" />
                  <div className="flex-1 mx-3 bg-white/10 rounded-lg px-3 py-1 text-xs text-white/50">
                    pecker-app.vercel.app/map
                  </div>
                </div>
                {/* Map illustration */}
                <div className="relative bg-[#1a2f5a] h-72 overflow-hidden">
                  {/* Grid lines mimicking map tiles */}
                  <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="mapgrid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#mapgrid)" />
                  </svg>
                  {/* Road-like lines */}
                  <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                    <line x1="0" y1="120" x2="100%" y2="100" stroke="white" strokeWidth="6" />
                    <line x1="0" y1="200" x2="100%" y2="220" stroke="white" strokeWidth="3" />
                    <line x1="180" y1="0" x2="160" y2="100%" stroke="white" strokeWidth="8" />
                    <line x1="320" y1="0" x2="340" y2="100%" stroke="white" strokeWidth="3" />
                    <line x1="0" y1="60" x2="160" y2="120" stroke="white" strokeWidth="2" />
                    <line x1="160" y1="120" x2="100%" y2="140" stroke="white" strokeWidth="2" />
                  </svg>
                  {/* Incident pins */}
                  {[
                    { x: "22%", y: "35%", color: "#ef4444", label: "Armed Robbery", size: "14" },
                    { x: "52%", y: "25%", color: "#f97316", label: "Road Blockage", size: "12" },
                    { x: "68%", y: "58%", color: "#ef4444", label: "Security Alert", size: "14" },
                    { x: "38%", y: "65%", color: "#f59e0b", label: "Power Outage", size: "11" },
                    { x: "80%", y: "30%", color: "#10b981", label: "Pothole Filled", size: "10" },
                    { x: "12%", y: "72%", color: "#f97316", label: "Flooding", size: "12" },
                  ].map(({ x, y, color, label, size }) => (
                    <div key={label} className="absolute" style={{ left: x, top: y, transform: "translate(-50%,-50%)" }}>
                      <div
                        className="rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold animate-pulse"
                        style={{ width: `${size}px`, height: `${size}px`, backgroundColor: color, fontSize: "7px", animationDuration: `${2 + Math.random() * 2}s` }}
                      />
                      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 bg-gray-900/90 text-white text-[8px] whitespace-nowrap px-1.5 py-0.5 rounded shadow">
                        {label}
                      </div>
                    </div>
                  ))}
                  {/* Search bar overlay */}
                  <div className="absolute top-3 left-3 right-3">
                    <div className="bg-white/95 rounded-xl px-3 py-2 flex items-center gap-2 shadow-lg">
                      <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span className="text-gray-400 text-xs">Search any city or location worldwide…</span>
                    </div>
                  </div>
                  {/* Legend */}
                  <div className="absolute bottom-3 left-3 bg-white/90 rounded-xl px-2.5 py-1.5 flex gap-2.5">
                    {[["#10b981","Low"],["#f59e0b","Medium"],["#f97316","High"],["#ef4444","Critical"]].map(([c,l]) => (
                      <span key={l} className="flex items-center gap-1 text-[9px] text-gray-700 font-medium">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c }} />{l}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-4 -right-4 bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-2xl shadow-lg rotate-2">
                No sign-up needed →
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SAFETY USE CASE ─────────────────────── */}
      <section className="max-w-4xl mx-auto px-5 py-16">
        <p className="text-[#0D1F52] text-xs font-bold uppercase tracking-widest text-center mb-2">Safety intelligence</p>
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 text-center mb-4">
          Insecurity is a national problem.<br className="hidden sm:block" /> Pecker makes it visible across Nigeria.
        </h2>
        <p className="text-gray-500 text-center max-w-2xl mx-auto mb-10 leading-relaxed">
          When incidents are reported openly and tracked publicly, communities become harder targets. People plan smarter, respond faster, and hold authorities accountable.
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              icon: "🏘️",
              title: "Before you move in",
              body: "Check incident history in any estate or neighbourhood. Know if armed robbery, street crime, or flooding is a recurring problem before signing a lease.",
            },
            {
              icon: "🚗",
              title: "Before you travel",
              body: "Search any route, estate, or city. See live security alerts, road blockages, and critical incidents pinned to the exact location they were reported.",
            },
            {
              icon: "📢",
              title: "After something happens",
              body: "Report it immediately. Your report notifies response teams, alerts neighbours, and creates a permanent record no authority can ignore or erase.",
            },
          ].map(({ icon, title, body }) => (
            <div key={title} className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
              <span className="text-3xl">{icon}</span>
              <h3 className="font-bold text-gray-900 mt-3 mb-2">{title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/map" className="inline-flex items-center gap-2 bg-[#0D1F52] text-white font-bold px-7 py-3.5 rounded-2xl hover:bg-[#0D1F52]/90 transition-colors text-sm">
            <Map className="h-4 w-4" /> Check your area now
          </Link>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────── */}
      <section className="bg-[#0D1F52] text-white px-5 py-16">
        <div className="max-w-4xl mx-auto">
          <p className="text-blue-300 text-xs font-bold uppercase tracking-widest text-center mb-2">What Pecker gives you</p>
          <h2 className="text-2xl sm:text-3xl font-black text-center mb-10">
            Everything Nigeria needs. Nothing it doesn&apos;t.
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: MapPin, title: "5-step mobile reporting", body: "Category → describe → GPS location → photo/video → submit. Done in 60 seconds." },
              { icon: Map, title: "Public incident map", body: "Anyone can view active incidents without logging in. Schools, roads, and landmarks visible at every zoom level." },
              { icon: Video, title: "Video recording", body: "Record up to 30s directly in the browser with a live camera preview. No app download needed." },
              { icon: ThumbsUp, title: "Community upvoting", body: "Residents +1 incidents they're also affected by. Real priorities surface without admin effort." },
              { icon: Clock, title: "SLA / overdue timers", body: "Every incident card shows if it's on-track, at risk, or overdue. Nothing hides in a backlog." },
              { icon: Shield, title: "Full lifecycle tracking", body: "NEW → ACKNOWLEDGED → IN PROGRESS → RESOLVED → CLOSED. Server-validated at every step." },
              { icon: Bell, title: "Real-time notifications", body: "Admins notified on new reports. All responders alerted on escalations. Badge counter in-app." },
              { icon: EyeOff, title: "Anonymous reporting", body: "Report sensitive incidents without your name attached. Lowers the barrier for security and social issues." },
              { icon: Zap, title: "AI category suggestion", body: "Type your incident title and Pecker suggests the right category automatically." },
              { icon: BarChart2, title: "Admin dashboard", body: "KPIs, open count, resolution rate, average time to resolve, critical incidents at a glance." },
              { icon: FileDown, title: "CSV export", body: "Download every incident as a spreadsheet for reporting, compliance, or council meetings." },
              { icon: CheckCircle2, title: "Immutable audit trail", body: "Every action logged — who did what and when. Responders, admins, and residents all accountable." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-white/8 border border-white/10 rounded-2xl p-5 hover:bg-white/12 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center mb-3">
                  <Icon className="h-4 w-4 text-blue-300" />
                </div>
                <h3 className="font-bold text-white mb-1 text-sm">{title}</h3>
                <p className="text-xs text-blue-200 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────── */}
      <section className="max-w-4xl mx-auto px-5 py-16">
        <p className="text-[#0D1F52] text-xs font-bold uppercase tracking-widest text-center mb-2">How it works</p>
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 text-center mb-10">
          From complaint to resolved in 3 roles
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              role: "Resident",
              color: "bg-emerald-50 border-emerald-200",
              badge: "bg-emerald-100 text-emerald-700",
              steps: ["Open the app or public map", "Report an incident in 60s", "Track status in real time", "Get notified when resolved"],
            },
            {
              role: "Responder",
              color: "bg-blue-50 border-blue-200",
              badge: "bg-blue-100 text-blue-700",
              steps: ["View all incoming incidents", "Acknowledge and prioritise", "Assign to team members", "Update status + add notes"],
            },
            {
              role: "Admin",
              color: "bg-purple-50 border-purple-200",
              badge: "bg-purple-100 text-purple-700",
              steps: ["Monitor KPI dashboard", "Escalate critical incidents", "Manage responder roles", "Export data for reporting"],
            },
          ].map(({ role, color, badge, steps }) => (
            <div key={role} className={`border rounded-2xl p-5 ${color}`}>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${badge}`}>{role}</span>
              <ul className="mt-4 space-y-2">
                {steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-gray-400 font-bold mt-0.5 shrink-0">{i + 1}.</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── VS COMPETITION ──────────────────────── */}
      <section className="bg-gray-50 border-y border-gray-100 px-5 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-gray-900 text-center mb-8">Why not just use WhatsApp?</h2>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Feature</th>
                  <th className="px-5 py-3 text-gray-500 font-medium text-center">WhatsApp</th>
                  <th className="px-5 py-3 text-gray-500 font-medium text-center">SeeClickFix</th>
                  <th className="px-5 py-3 text-[#0D1F52] font-bold text-center bg-blue-50">Pecker</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Incident tracking", "✗", "✓", "✓"],
                  ["Video evidence", "✗", "✗", "✓"],
                  ["Public map", "✗", "✓", "✓"],
                  ["Anonymous reporting", "✗", "✗", "✓"],
                  ["Community upvoting", "✗", "✗", "✓"],
                  ["SLA timers", "✗", "✗", "✓"],
                  ["Africa-first / affordable", "✓", "✗", "✓"],
                  ["Mobile reporting in 60s", "✗", "✗", "✓"],
                  ["AI category suggestion", "✗", "✗", "✓"],
                ].map(([feat, wa, scf, pec]) => (
                  <tr key={feat} className="border-b border-gray-50 last:border-0">
                    <td className="px-5 py-3 text-gray-700">{feat}</td>
                    <td className={`px-5 py-3 text-center ${wa === "✓" ? "text-emerald-600" : "text-red-400"}`}>{wa}</td>
                    <td className={`px-5 py-3 text-center ${scf === "✓" ? "text-emerald-600" : "text-red-400"}`}>{scf}</td>
                    <td className={`px-5 py-3 text-center font-bold bg-blue-50 ${pec === "✓" ? "text-emerald-600" : "text-red-400"}`}>{pec}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── OPEN SOURCE ─────────────────────────── */}
      <section className="bg-gray-50 border-y border-gray-100 px-5 py-14">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 text-xs font-semibold text-gray-600 mb-5">
            <Github className="h-3.5 w-3.5" /> Open Source · MIT License
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4">
            Built in the open. Free forever.
          </h2>
          <p className="text-gray-500 leading-relaxed mb-8 max-w-xl mx-auto">
            Pecker is fully open source — the entire codebase is publicly available on GitHub. No subscriptions, no paywalls, no hidden fees. If Pecker helps keep Nigerians safe, consider supporting the infrastructure that keeps it running.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://github.com/clipwith-me/pecker"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white font-semibold px-7 py-3 rounded-2xl hover:bg-gray-800 transition-colors text-sm"
            >
              <Github className="h-4 w-4" /> View on GitHub
            </a>
            <Link
              href="/support"
              className="inline-flex items-center justify-center gap-2 bg-rose-50 border border-rose-200 text-rose-600 font-semibold px-7 py-3 rounded-2xl hover:bg-rose-100 transition-colors text-sm"
            >
              <Heart className="h-4 w-4" /> Support the project
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-5 py-16 text-center">
        <h2 className="text-2xl font-black text-gray-900 mb-3">Ready to get started?</h2>
        <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto">Join Nigerians across all 36 states on Pecker — free for every resident, responder, and administrator.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-[#0D1F52] text-white font-bold px-8 py-3.5 rounded-2xl hover:bg-[#0D1F52]/90 transition-colors text-sm">
            Create free account <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/map" className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-semibold px-8 py-3.5 rounded-2xl hover:bg-gray-50 transition-colors text-sm">
            <Map className="h-4 w-4" /> View public map
          </Link>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────── */}
      <footer className="border-t border-gray-100 bg-gray-50 px-5 py-8 text-center">
        <PeckerLogo variant="default" size="sm" className="justify-center mb-3" />
        <p className="text-xs text-gray-400">Nigeria&apos;s Nationwide Incident Reporting Platform · Report. Resolve. Improve.</p>
        <div className="flex justify-center gap-4 mt-3 flex-wrap">
          <Link href="/map" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">Public Map</Link>
          <Link href="/support" className="text-xs text-rose-400 hover:text-rose-600 transition-colors">♥ Support</Link>
          <a href="https://github.com/clipwith-me/pecker" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">GitHub</a>
          <Link href="/register" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">Register</Link>
          <Link href="/login" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">Sign in</Link>
        </div>
      </footer>

    </div>
  );
}
