import { PeckerLogo } from "@/components/ui/pecker-logo";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AboutPage() {
  return (
    <div>
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center h-14 px-4 gap-3">
          <Link href="/" className="p-2 rounded-xl hover:bg-accent transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-semibold">About Pecker</h1>
        </div>
      </header>
      <div className="p-4 max-w-2xl mx-auto space-y-6 pb-8">
        <div className="flex flex-col items-center py-6 text-center">
          <PeckerLogo size="xl" showTagline className="flex-col items-center mb-3" />
          <p className="text-muted-foreground text-sm mt-2 max-w-sm">
            Community Incident Management Platform — transforming fragmented complaints into structured, trackable, accountable workflows.
          </p>
        </div>

        <section className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <h2 className="font-bold text-base text-foreground">Problem Statement</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Communities frequently face informal incident reporting through calls, group chats, and manual follow-ups — leading to persistent frustration, poor accountability, and long response times. A structured incident workflow is what&apos;s missing: one that makes it simple for residents to report problems and for response teams to prioritise and address them.
          </p>
        </section>

        <section className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <h2 className="font-bold text-base text-foreground">Solution</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {[
              "Report any incident in under 60 seconds from a mobile device",
              "Attach photos, select issue type, and capture GPS location",
              "Automatic severity tagging and smart routing to response teams",
              "Live status tracking: New → Acknowledged → In Progress → Resolved → Closed",
              "Escalation controls for urgent or unresolved incidents",
              "Full audit trail — every action, who did it, and when",
              "Admin dashboard with KPIs, category analytics, and backlog management",
              "Notification system for status updates and assignments",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <h2 className="font-bold text-base text-foreground">Target Markets</h2>
          <div className="grid grid-cols-2 gap-2">
            {["Residential Estates", "University Campuses", "Municipal Services", "Infrastructure Teams"].map((m) => (
              <div key={m} className="bg-primary/5 rounded-xl px-3 py-2 text-sm font-medium text-primary text-center">
                {m}
              </div>
            ))}
          </div>
        </section>

        <section className="bg-card rounded-2xl border border-border p-5 space-y-2">
          <h2 className="font-bold text-base text-foreground">Tech Stack</h2>
          <div className="grid grid-cols-2 gap-y-1.5 text-sm">
            {[
              ["Frontend", "Next.js 15 + TypeScript"],
              ["Styling", "Tailwind CSS + Radix UI"],
              ["Auth", "NextAuth.js v5 (JWT/RBAC)"],
              ["Database", "Prisma ORM + SQLite/PostgreSQL"],
              ["State", "TanStack Query + Zustand"],
              ["Testing", "Jest + Testing Library"],
            ].map(([k, v]) => (
              <div key={k}>
                <span className="text-muted-foreground">{k}: </span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="text-center text-xs text-muted-foreground pt-2">
          Community Incident Management · {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
