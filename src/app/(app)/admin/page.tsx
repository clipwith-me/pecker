"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowRight,
  Download,
  Flag,
} from "lucide-react";
import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IncidentCard } from "@/components/incidents/incident-card";
import type { DashboardStats, IncidentListItem } from "@/lib/types";
import { CATEGORY_LABELS, STATUS_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_BAR_COLORS: Record<string, string> = {
  NEW: "bg-indigo-500",
  ACKNOWLEDGED: "bg-amber-500",
  IN_PROGRESS: "bg-blue-500",
  RESOLVED: "bg-emerald-500",
  CLOSED: "bg-gray-400",
  REJECTED: "bg-red-500",
};

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();

  const { data: flaggedData } = useQuery<IncidentListItem[]>({
    queryKey: ["flagged-incidents"],
    queryFn: async () => {
      const res = await fetch("/api/incidents?flagged=true&pageSize=10");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data.items ?? [];
    },
    enabled: !!session && session.user.role === "ADMIN",
  });

  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/stats");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    enabled: !!session,
    refetchInterval: 60000,
  });

  if (status === "loading") return null;
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "RESPONDER")) {
    return <div className="p-8 text-center text-muted-foreground">Access denied</div>;
  }

  const exportCSV = () => {
    window.open("/api/incidents/export", "_blank");
  };

  const stats = [
    {
      label: "Open Incidents",
      value: data?.totalOpen ?? "-",
      icon: AlertTriangle,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
    {
      label: "Resolved Today",
      value: data?.resolvedToday ?? "-",
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
    },
    {
      label: "Avg Resolution",
      value: data ? `${data.averageResolutionHours}h` : "-",
      icon: Clock,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
  ];

  const maxStatusCount = Math.max(...(data?.byStatus.map((s) => s.count) ?? [1]));
  const maxCatCount = Math.max(...(data?.byCategory.map((c) => c.count) ?? [1]));

  return (
    <div>
      <TopBar title="Dashboard" />
      <div className="px-4 pt-3 flex justify-end">
        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground border border-border rounded-xl px-3 py-1.5 hover:text-primary hover:border-primary/40 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
      </div>

      <div className="p-4 space-y-5">
        <div className="grid grid-cols-3 gap-3">
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="text-center">
              <CardContent className="p-3">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2", bg)}>
                  <Icon className={cn("h-5 w-5", color)} />
                </div>
                <p className="text-2xl font-bold">{isLoading ? "..." : value}</p>
                <p className="text-xs text-muted-foreground leading-tight mt-0.5">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {data && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" /> By Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.byStatus.map(({ status, count }) => (
                  <div key={status} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-24 shrink-0">{STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", STATUS_BAR_COLORS[status] || "bg-gray-400")}
                        style={{ width: `${(count / maxStatusCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium w-6 text-right">{count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">By Category</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.byCategory.slice(0, 6).map(({ category, count }) => (
                  <div key={category} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-32 shrink-0 truncate">
                      {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}
                    </span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${(count / maxCatCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium w-6 text-right">{count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {flaggedData && flaggedData.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Flag className="h-4 w-4 text-red-500" />
                  <h3 className="font-semibold text-red-700">Flagged Reports ({flaggedData.length})</h3>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-3 mb-1">
                  <p className="text-xs text-red-600">These incidents were flagged by community members as potentially false. Review and reject if confirmed.</p>
                </div>
                <div className="space-y-3">
                  {flaggedData.map((incident) => (
                    <IncidentCard key={incident.id} incident={incident as IncidentListItem} showReporter />
                  ))}
                </div>
              </div>
            )}

            {data.recentIncidents.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Recent Incidents</h3>
                  <Link href="/incidents" className="text-sm text-primary flex items-center gap-1 hover:underline">
                    View all <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {data.recentIncidents.slice(0, 5).map((incident) => (
                    <IncidentCard key={incident.id} incident={incident as IncidentListItem} showReporter />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
