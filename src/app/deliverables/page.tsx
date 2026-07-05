import Link from "next/link";
import { PeckerLogo } from "@/components/ui/pecker-logo";
import { ExternalLink, FileText, BarChart2, Globe, Github } from "lucide-react";

const cards = [
  {
    icon: FileText,
    title: "System Architecture",
    description: "Stack, DB schema, 20 API endpoints, MapLibre map architecture, security, 27-feature checklist, key decisions.",
    href: "/deliverables/architecture.html",
    external: true,
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: BarChart2,
    title: "Business Design & GTM",
    description: "Market opportunity, competitor analysis, SaaS tiers, revenue projections, 3-phase GTM strategy, growth flywheel.",
    href: "/deliverables/business-gtm.html",
    external: true,
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: Globe,
    title: "Live Prototype",
    description: "Fully functional — report incidents, public map, upvoting, video recording, SLA timers, CSV export, anonymous reporting.",
    href: "/",
    external: false,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: Github,
    title: "GitHub Repository",
    description: "Full source code, documented architecture, seed data, 37+ passing tests.",
    href: "https://github.com/clipwith-me/pecker",
    external: true,
    color: "bg-gray-100 text-gray-600",
  },
];

const testAccounts = [
  { role: "Admin", email: "admin@pecker.com", password: "Admin@1234", color: "bg-purple-100 text-purple-700" },
  { role: "Responder", email: "responder@pecker.com", password: "Resp@1234", color: "bg-blue-100 text-blue-700" },
  { role: "Resident", email: "jane@example.com", password: "User@1234", color: "bg-gray-100 text-gray-700" },
];

export default function DeliverablesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col items-center text-center mb-10 pt-6">
          <PeckerLogo variant="white" size="xl" showTagline className="flex-col items-center mb-4" />
          <p className="text-blue-200 text-sm max-w-md">
            Community Incident Management Platform
          </p>
        </div>

        <div className="space-y-3 mb-8">
          {cards.map(({ icon: Icon, title, description, href, external, color }) => (
            <Link
              key={title}
              href={href}
              target={external ? "_blank" : undefined}
              className="flex items-center gap-4 bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-colors group"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white">{title}</p>
                <p className="text-xs text-blue-200 leading-snug mt-0.5">{description}</p>
              </div>
              <ExternalLink className="h-4 w-4 text-white/40 shrink-0 group-hover:text-white/80 transition-colors" />
            </Link>
          ))}
        </div>

        <div className="bg-white/10 backdrop-blur rounded-2xl border border-white/20 p-5">
          <h3 className="font-semibold text-white mb-3">🔑 Test Accounts</h3>
          <div className="space-y-2">
            {testAccounts.map(({ role, email, password, color }) => (
              <div key={role} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${color}`}>{role}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{email}</p>
                  <p className="text-blue-200 text-xs font-mono">{password}</p>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/login"
            className="mt-4 w-full flex items-center justify-center h-11 bg-white text-blue-900 font-semibold rounded-xl hover:bg-white/90 transition-colors"
          >
            Launch App →
          </Link>
        </div>

        <p className="text-center text-blue-300/50 text-xs mt-6">
          Pecker · Community Incident Management · 2026
        </p>
      </div>
    </div>
  );
}
