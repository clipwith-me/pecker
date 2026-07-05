import type { User, Incident, IncidentImage, IncidentEvent } from "@prisma/client";

export type Role = "RESIDENT" | "RESPONDER" | "ADMIN";
export type IncidentStatus = "NEW" | "ACKNOWLEDGED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "REJECTED";
export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type Category =
  | "BROKEN_STREETLIGHT"
  | "FLOODING"
  | "GARBAGE_OVERFLOW"
  | "DRAINAGE_ISSUE"
  | "ROAD_DAMAGE"
  | "SAFETY_SECURITY"
  | "VANDALISM"
  | "OTHER";
export type NotificationType =
  | "STATUS_CHANGED"
  | "INCIDENT_ASSIGNED"
  | "INCIDENT_ESCALATED"
  | "COMMENT_ADDED";

export type SafeUser = Omit<User, "passwordHash">;

export type IncidentMedia = IncidentImage & { mediaType: string };

export type IncidentWithRelations = Incident & {
  reportedBy: SafeUser;
  assignedTo: SafeUser | null;
  images: IncidentMedia[];
  events: (IncidentEvent & { actor: SafeUser | null })[];
  _count?: { events: number };
  voteCount: number;
  userVoted: boolean;
};

export type IncidentListItem = Incident & {
  reportedBy: Pick<User, "id" | "name" | "email">;
  assignedTo: Pick<User, "id" | "name" | "email"> | null;
  images: Pick<IncidentImage, "id" | "url">[];
  _count: { events: number; votes: number };
};

export type MapIncident = {
  id: string;
  title: string;
  category: string;
  severity: string;
  status: string;
  locationLat: number;
  locationLng: number;
  locationText: string | null;
  createdAt: string;
};

export interface CreateIncidentInput {
  title: string;
  description?: string;
  category: Category;
  severity: Severity;
  locationLat?: number;
  locationLng?: number;
  locationText?: string;
}

export interface UpdateIncidentInput {
  status?: IncidentStatus;
  assignedToId?: string | null;
  note?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface IncidentFilters {
  status?: IncidentStatus;
  category?: Category;
  severity?: Severity;
  assignedToId?: string;
  reportedById?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface DashboardStats {
  totalOpen: number;
  resolvedToday: number;
  averageResolutionHours: number;
  byCategory: { category: string; count: number }[];
  byStatus: { status: string; count: number }[];
  bySeverity: { severity: string; count: number }[];
  recentIncidents: IncidentListItem[];
}

export const CATEGORY_LABELS: Record<Category, string> = {
  BROKEN_STREETLIGHT: "Broken Streetlight",
  FLOODING: "Flooding",
  GARBAGE_OVERFLOW: "Garbage Overflow",
  DRAINAGE_ISSUE: "Drainage Issue",
  ROAD_DAMAGE: "Road Damage",
  SAFETY_SECURITY: "Safety / Security",
  VANDALISM: "Vandalism",
  OTHER: "Other",
};

export const CATEGORY_ICONS: Record<Category, string> = {
  BROKEN_STREETLIGHT: "💡",
  FLOODING: "🌊",
  GARBAGE_OVERFLOW: "🗑️",
  DRAINAGE_ISSUE: "🚰",
  ROAD_DAMAGE: "🛣️",
  SAFETY_SECURITY: "🚨",
  VANDALISM: "🔨",
  OTHER: "📋",
};

export const STATUS_LABELS: Record<IncidentStatus, string> = {
  NEW: "New",
  ACKNOWLEDGED: "Acknowledged",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  REJECTED: "Rejected",
};

export const STATUS_COLORS: Record<IncidentStatus, string> = {
  NEW: "bg-indigo-100 text-indigo-700 border-indigo-200",
  ACKNOWLEDGED: "bg-amber-100 text-amber-700 border-amber-200",
  IN_PROGRESS: "bg-blue-100 text-blue-700 border-blue-200",
  RESOLVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CLOSED: "bg-gray-100 text-gray-600 border-gray-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const SEVERITY_COLORS: Record<Severity, string> = {
  LOW: "bg-emerald-100 text-emerald-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
};

export const VALID_STATUS_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  NEW: ["ACKNOWLEDGED", "REJECTED"],
  ACKNOWLEDGED: ["IN_PROGRESS", "REJECTED"],
  IN_PROGRESS: ["RESOLVED", "ACKNOWLEDGED"],
  RESOLVED: ["CLOSED", "IN_PROGRESS"],
  CLOSED: [],
  REJECTED: [],
};

export const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  BROKEN_STREETLIGHT: ["light", "streetlight", "lamp", "dark", "bulb", "pole", "illuminat"],
  FLOODING: ["flood", "water", "overflow", "rain", "submerged", "puddle", "waterlog"],
  GARBAGE_OVERFLOW: ["garbage", "trash", "waste", "bin", "litter", "rubbish", "dump", "refuse"],
  DRAINAGE_ISSUE: ["drain", "blocked", "pipe", "sewage", "gutter", "sewer", "clog"],
  ROAD_DAMAGE: ["pothole", "road", "crack", "pavement", "highway", "street", "asphalt", "tar"],
  SAFETY_SECURITY: ["theft", "crime", "fire", "danger", "security", "assault", "robbery", "attack", "threat", "unsafe"],
  VANDALISM: ["vandal", "graffiti", "broken", "smash", "damage", "spray", "destroy", "deface"],
  OTHER: [],
};

export function suggestCategory(title: string): Category | null {
  const lower = title.toLowerCase();
  let best: Category | null = null;
  let bestScore = 0;
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [Category, string[]][]) {
    if (cat === "OTHER") continue;
    const score = keywords.filter((kw) => lower.includes(kw)).length;
    if (score > bestScore) { bestScore = score; best = cat; }
  }
  return bestScore > 0 ? best : null;
}

export function getSlaStatus(incident: { status: string; createdAt: string | Date; updatedAt: string | Date }): "ok" | "warning" | "overdue" {
  const active = ["NEW", "ACKNOWLEDGED", "IN_PROGRESS"].includes(incident.status);
  if (!active) return "ok";
  const hoursOpen = (Date.now() - new Date(incident.createdAt).getTime()) / 3600000;
  const hoursSinceUpdate = (Date.now() - new Date(incident.updatedAt).getTime()) / 3600000;
  if (incident.status === "NEW" && hoursSinceUpdate > 72) return "overdue";
  if (incident.status === "NEW" && hoursSinceUpdate > 24) return "warning";
  if (incident.status === "IN_PROGRESS" && hoursOpen > 168) return "overdue";
  if (incident.status === "IN_PROGRESS" && hoursOpen > 72) return "warning";
  return "ok";
}

export const ALL_CATEGORIES: Category[] = [
  "BROKEN_STREETLIGHT",
  "FLOODING",
  "GARBAGE_OVERFLOW",
  "DRAINAGE_ISSUE",
  "ROAD_DAMAGE",
  "SAFETY_SECURITY",
  "VANDALISM",
  "OTHER",
];

export const ALL_SEVERITIES: Severity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
export const ALL_STATUSES: IncidentStatus[] = ["NEW", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "CLOSED", "REJECTED"];
