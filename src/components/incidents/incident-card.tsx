"use client";

import Link from "next/link";
import { MapPin, Clock, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  STATUS_LABELS,
  STATUS_COLORS,
  SEVERITY_COLORS,
  SEVERITY_LABELS,
  getSlaStatus,
} from "@/lib/types";
import type { IncidentListItem } from "@/lib/types";
import { ThumbsUp } from "lucide-react";

interface IncidentCardProps {
  incident: IncidentListItem;
  showReporter?: boolean;
}

export function IncidentCard({ incident, showReporter }: IncidentCardProps) {
  const category = incident.category as keyof typeof CATEGORY_LABELS;
  const status = incident.status as keyof typeof STATUS_LABELS;
  const severity = incident.severity as keyof typeof SEVERITY_LABELS;

  const sla = getSlaStatus({ status: incident.status, createdAt: incident.createdAt, updatedAt: incident.updatedAt });

  return (
    <Link href={`/incidents/${incident.id}`} className="block group">
      <div className={cn(
        "bg-card rounded-2xl border p-4 transition-all duration-150 hover:shadow-md active:scale-[0.99]",
        sla === "overdue" ? "border-red-300 bg-red-50/30" : sla === "warning" ? "border-amber-300 bg-amber-50/20" : "border-border hover:border-primary/20"
      )}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl shrink-0 mt-0.5">
            {CATEGORY_ICONS[category] || "📋"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                {incident.title}
              </h3>
              <span className={cn("shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border", STATUS_COLORS[status])}>
                {STATUS_LABELS[status]}
              </span>
            </div>

            <p className="text-xs text-muted-foreground mt-0.5">{CATEGORY_LABELS[category]}</p>

            <div className="flex items-center gap-3 mt-2.5 flex-wrap">
              <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", SEVERITY_COLORS[severity])}>
                {SEVERITY_LABELS[severity]}
              </span>

              {incident.locationText && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate max-w-[120px]">{incident.locationText}</span>
                </span>
              )}

              <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                <Clock className="h-3 w-3" />
                {formatRelativeTime(incident.createdAt)}
              </span>
            </div>

            {showReporter && (
              <p className="text-xs text-muted-foreground mt-1.5">
                Reported by {incident.reportedBy.name}
              </p>
            )}

            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {incident._count.events > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MessageSquare className="h-3 w-3" />
                  {incident._count.events} update{incident._count.events !== 1 ? "s" : ""}
                </span>
              )}
              {incident._count.votes > 0 && (
                <span className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                  <ThumbsUp className="h-3 w-3" />
                  {incident._count.votes} affected
                </span>
              )}
              {sla === "overdue" && (
                <span className="text-xs font-semibold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full">⏱ Overdue</span>
              )}
              {sla === "warning" && (
                <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">⏱ Needs attention</span>
              )}
            </div>
          </div>
        </div>

        {incident.images.length > 0 && (
          <div className="mt-3 ml-13">
            {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
              src={incident.images[0].url}
              alt="Incident"
              className="w-full h-32 object-cover rounded-xl"
            />
          </div>
        )}
      </div>
    </Link>
  );
}
