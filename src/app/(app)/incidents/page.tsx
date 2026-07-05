"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PlusCircle, Search, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/layout/top-bar";
import { IncidentCard } from "@/components/incidents/incident-card";
import { useSession } from "next-auth/react";
import type { IncidentListItem, IncidentStatus, Category, Severity } from "@/lib/types";
import { ALL_STATUSES, ALL_CATEGORIES, ALL_SEVERITIES, STATUS_LABELS, CATEGORY_LABELS, SEVERITY_LABELS } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface IncidentsResponse {
  items: IncidentListItem[];
  total: number;
  totalPages: number;
  page: number;
}

export default function IncidentsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "RESPONDER";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | "ALL">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<Category | "ALL">("ALL");
  const [severityFilter, setSeverityFilter] = useState<Severity | "ALL">("ALL");
  const [showFilters, setShowFilters] = useState(false);

  const params = new URLSearchParams();
  if (statusFilter !== "ALL") params.set("status", statusFilter);
  if (categoryFilter !== "ALL") params.set("category", categoryFilter);
  if (severityFilter !== "ALL") params.set("severity", severityFilter);
  if (search) params.set("search", search);

  const { data, isLoading } = useQuery<IncidentsResponse>({
    queryKey: ["incidents", statusFilter, categoryFilter, severityFilter, search],
    queryFn: async () => {
      const res = await fetch(`/api/incidents?${params}`);
      const json = await res.json();
      return json.data;
    },
  });

  const hasFilters = statusFilter !== "ALL" || categoryFilter !== "ALL" || severityFilter !== "ALL";

  const clearFilters = () => {
    setStatusFilter("ALL");
    setCategoryFilter("ALL");
    setSeverityFilter("ALL");
  };

  return (
    <div className="flex flex-col">
      <TopBar
        title={isAdmin ? "All Incidents" : "My Incidents"}
        actions={
          <Link href="/incidents/new">
            <Button size="sm" className="gap-1.5 hidden sm:flex">
              <PlusCircle className="h-4 w-4" />
              Report
            </Button>
          </Link>
        }
      />

      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search incidents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className="relative h-11 w-11"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {hasFilters && <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary" />}
          </Button>
        </div>

        {showFilters && (
          <div className="bg-card rounded-2xl border border-border p-4 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium">Filters</p>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <X className="h-3 w-3" /> Clear
                </button>
              )}
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as IncidentStatus | "ALL")}>
              <SelectTrigger label="Status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                {ALL_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as Category | "ALL")}>
              <SelectTrigger label="Category"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {ALL_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as Severity | "ALL")}>
              <SelectTrigger label="Severity"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Severities</SelectItem>
                {ALL_SEVERITIES.map((s) => <SelectItem key={s} value={s}>{SEVERITY_LABELS[s]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : data?.items?.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-foreground mb-1">No incidents found</h3>
            <p className="text-muted-foreground text-sm mb-6">
              {hasFilters || search ? "Try adjusting your filters" : "Be the first to report an issue"}
            </p>
            <Link href="/incidents/new">
              <Button className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Report an incident
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {data?.items?.map((incident) => (
              <IncidentCard key={incident.id} incident={incident} showReporter={isAdmin} />
            ))}
          </div>
        )}

        {(data?.totalPages ?? 0) > 1 && (
          <p className="text-center text-sm text-muted-foreground pt-2">
            Showing {data?.items.length} of {data?.total} incidents
          </p>
        )}
      </div>

      <Link href="/incidents/new" className="fixed bottom-20 right-4 md:hidden z-40">
        <Button size="lg" className="rounded-full shadow-lg h-14 w-14 p-0">
          <PlusCircle className="h-6 w-6" />
        </Button>
      </Link>
    </div>
  );
}
