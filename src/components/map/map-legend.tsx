"use client";

const SEVERITY_PIN_COLORS: Record<string, string> = {
  LOW: "#10b981",
  MEDIUM: "#f59e0b",
  HIGH: "#f97316",
  CRITICAL: "#ef4444",
};

export function MapLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
      {Object.entries(SEVERITY_PIN_COLORS).map(([sev, color]) => (
        <span key={sev} className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: color }} />
          {sev.charAt(0) + sev.slice(1).toLowerCase()}
        </span>
      ))}
    </div>
  );
}
