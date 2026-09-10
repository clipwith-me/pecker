"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import lazyLoad from "next/dynamic";
import { PeckerLogo } from "@/components/ui/pecker-logo";
import Link from "next/link";
import { ArrowLeft, ExternalLink, LayoutDashboard, PlusCircle } from "lucide-react";
import type { MapIncident } from "@/components/map/incident-map";

const IncidentMap = lazyLoad(() => import("@/components/map/incident-map"), { ssr: false });

export default function PublicMapPage() {
  const { data: session } = useSession();
  const [incidents, setIncidents] = useState<MapIncident[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIncidents = () =>
    fetch("/api/map")
      .then((r) => r.json())
      .then((json) => { if (json.success) setIncidents(json.data); })
      .finally(() => setLoading(false));

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 30_000); // refresh every 30 s
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Default to world view (Africa-centered) so anyone can search any location
  const center = incidents.length > 0
    ? [
        incidents.reduce((s, i) => s + i.locationLat, 0) / incidents.length,
        incidents.reduce((s, i) => s + i.locationLng, 0) / incidents.length,
      ] as [number, number]
    : [8.6753, 9.0820] as [number, number]; // Nigeria center, zoom out for global discovery

  const counts = {
    total: incidents.length,
    critical: incidents.filter((i) => i.severity === "CRITICAL").length,
  };

  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "RESPONDER";
  const dashboardHref = isAdmin ? "/admin" : "/incidents";

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header — 3-column grid so nothing overlaps */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 grid grid-cols-3 items-center shrink-0 z-10 gap-2">
        {/* Col 1 — left */}
        <div className="flex items-center">
          {session ? (
            <Link
              href={dashboardHref}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <span>Dashboard</span>
            </Link>
          ) : (
            <PeckerLogo variant="default" size="sm" />
          )}
        </div>

        {/* Col 2 — centre: incident count */}
        <div className="flex flex-col items-center text-center min-w-0">
          <span className="text-xs font-medium text-gray-700 truncate">
            {loading ? "Loading…" : `${counts.total} active`}
          </span>
          <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Live
          </span>
          {counts.critical > 0 && (
            <span className="text-xs text-red-600 font-semibold">{counts.critical} critical</span>
          )}
        </div>

        {/* Col 3 — right */}
        <div className="flex items-center justify-end gap-2">
          {session ? (
            <>
              <Link
                href="/incidents/new"
                className="flex items-center gap-1 text-xs font-semibold bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap"
              >
                <PlusCircle className="h-3.5 w-3.5 shrink-0" />
                Report
              </Link>
              <Link
                href={dashboardHref}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                title="Go to dashboard"
              >
                <LayoutDashboard className="h-4 w-4" />
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline whitespace-nowrap"
            >
              Sign in <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>

      {/* Hint bar */}
      {!loading && incidents.length > 0 && (
        <div className="bg-white border-b border-gray-100 px-4 py-1.5 flex items-center shrink-0">
          <span className="text-xs text-gray-400 ml-auto">
            Click any pin for details · 🗺️ to switch styles
          </span>
        </div>
      )}

      {/* Map */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-500">Loading incident map…</p>
            </div>
          </div>
        ) : incidents.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <p className="text-gray-500 text-sm">No active incidents with location data.</p>
          </div>
        ) : (
          <IncidentMap incidents={incidents} center={center} zoom={incidents.length > 0 ? 13 : 4} height="100%" />
        )}
      </div>

      {/* Footer — different for logged-in vs guest */}
      <div className="bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between shrink-0">
        <Link href="/support" className="text-xs text-rose-500 font-medium hover:text-rose-700 transition-colors">
          ♥ Support Pecker
        </Link>
        {session ? (
          <Link href={dashboardHref} className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" />
            Back to {isAdmin ? "admin" : "my incidents"}
          </Link>
        ) : (
          <Link href="/register" className="text-xs font-semibold text-blue-700 hover:underline">
            Report an incident →
          </Link>
        )}
      </div>
    </div>
  );
}
