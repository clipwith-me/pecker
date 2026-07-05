import { cn } from "@/lib/utils";
import { STATUS_LABELS, STATUS_COLORS, SEVERITY_LABELS, SEVERITY_COLORS } from "@/lib/types";
import type { IncidentStatus, Severity } from "@/lib/types";

export function StatusBadge({ status, className }: { status: IncidentStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border", STATUS_COLORS[status], className)}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  return (
    <span className={cn("inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full", SEVERITY_COLORS[severity], className)}>
      {SEVERITY_LABELS[severity]}
    </span>
  );
}
