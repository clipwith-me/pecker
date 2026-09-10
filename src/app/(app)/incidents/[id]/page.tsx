"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  MapPin,
  Calendar,
  User2,
  Send,
  ChevronDown,
  UserCheck,
  AlertOctagon,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Pencil,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TopBar } from "@/components/layout/top-bar";
import { StatusBadge, SeverityBadge } from "@/components/incidents/status-badge";
import { useSession } from "next-auth/react";
import { toast } from "@/hooks/useToast";
import { formatDateTime, formatRelativeTime, getInitials } from "@/lib/utils";
import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  VALID_STATUS_TRANSITIONS,
  STATUS_LABELS,
  getSlaStatus,
} from "@/lib/types";
import type { IncidentWithRelations, IncidentStatus, VoteType } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "RESPONDER";
  const [note, setNote] = useState("");
  const [newStatus, setNewStatus] = useState<IncidentStatus | "">("");
  const [showStatusPanel, setShowStatusPanel] = useState(false);
  const [voteCount, setVoteCount] = useState(0);
  const [userVoted, setUserVoted] = useState(false);
  const [confirmCount, setConfirmCount] = useState(0);
  const [disputeCount, setDisputeCount] = useState(0);
  const [userVote, setUserVote] = useState<VoteType | null>(null);
  const [isFlagged, setIsFlagged] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editLocation, setEditLocation] = useState("");

  const { data: incident, isLoading } = useQuery<IncidentWithRelations>({
    queryKey: ["incident", id],
    queryFn: async (): Promise<IncidentWithRelations> => {
      const res = await fetch(`/api/incidents/${id}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as IncidentWithRelations;
    },
  });

  useEffect(() => {
    if (incident) {
      setVoteCount(incident.voteCount ?? 0);
      setUserVoted(incident.userVoted ?? false);
      setConfirmCount(incident.confirmCount ?? 0);
      setDisputeCount(incident.disputeCount ?? 0);
      setUserVote(incident.userVote ?? null);
      setIsFlagged(incident.flagged ?? false);
      setEditTitle(incident.title);
      setEditDesc(incident.description ?? "");
      setEditLocation(incident.locationText ?? "");
    }
  }, [incident]);

  const statusMutation = useMutation({
    mutationFn: async ({ status, note }: { status: IncidentStatus; note?: string }) => {
      const res = await fetch(`/api/incidents/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident", id] });
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      toast({ title: "Status updated", variant: "default" });
      setNewStatus("");
      setNote("");
      setShowStatusPanel(false);
    },
    onError: (e: Error) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const noteMutation = useMutation({
    mutationFn: async (noteText: string) => {
      const res = await fetch(`/api/incidents/${id}/note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteText }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident", id] });
      toast({ title: "Note added" });
      setNote("");
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const voteMutation = useMutation({
    mutationFn: async (type: VoteType) => {
      const res = await fetch(`/api/incidents/${id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as { confirms: number; disputes: number; userVote: VoteType | null };
    },
    onSuccess: (data) => {
      setConfirmCount(data.confirms);
      setDisputeCount(data.disputes);
      setUserVote(data.userVote);
      setVoteCount(data.confirms + data.disputes);
      setIsFlagged(data.disputes >= 3 && data.confirms === 0);
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/incidents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, description: editDesc, locationText: editLocation }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident", id] });
      toast({ title: "Report updated" });
      setEditMode(false);
    },
    onError: (e: Error) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const escalateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/incidents/${id}/escalate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: "Escalated — requires immediate attention" }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident", id] });
      toast({ title: "Incident escalated to Critical", variant: "default" });
    },
    onError: (e: Error) => toast({ title: "Escalation failed", description: e.message, variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div>
        <TopBar title="Incident" showBack />
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div>
        <TopBar title="Not Found" showBack />
        <div className="p-8 text-center text-muted-foreground">Incident not found</div>
      </div>
    );
  }

  const currentStatus = incident.status as IncidentStatus;
  const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus];
  const sla = getSlaStatus({ status: incident.status, createdAt: incident.createdAt, updatedAt: incident.updatedAt });
  const isOwner = session?.user?.id === incident.reportedById;
  const canEdit = (isOwner || isAdmin) && incident.status === "NEW";

  const getEventIcon = (action: string) => {
    const icons: Record<string, string> = {
      CREATED: "📝",
      STATUS_CHANGED: "🔄",
      ASSIGNED: "👤",
      NOTE_ADDED: "💬",
      ESCALATED: "🚨",
    };
    return icons[action] || "📋";
  };

  const getEventLabel = (action: string) => {
    const labels: Record<string, string> = {
      CREATED: "Incident reported",
      STATUS_CHANGED: "Status updated",
      ASSIGNED: "Assigned to responder",
      NOTE_ADDED: "Note added",
      ESCALATED: "Escalated to Critical",
    };
    return labels[action] || action;
  };

  return (
    <div className="flex flex-col">
      <TopBar title={`INC-${incident.id.slice(-6).toUpperCase()}`} showBack />

      <div className="p-4 space-y-4">
        <div className="bg-card rounded-2xl border border-border p-4">
          {/* SLA warning banner */}
          {sla !== "ok" && (
            <div className={cn(
              "flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl mb-3",
              sla === "overdue" ? "bg-red-50 text-red-700 border border-red-200" : "bg-amber-50 text-amber-700 border border-amber-200"
            )}>
              ⏱ {sla === "overdue" ? "Overdue — this incident needs immediate attention" : "Needs attention — response time exceeded"}
            </div>
          )}

          <div className="flex items-start gap-3 mb-3">
            <span className="text-3xl">{CATEGORY_ICONS[incident.category as keyof typeof CATEGORY_ICONS] || "📋"}</span>
            <div className="flex-1">
              {editMode ? (
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="font-bold text-base mb-1"
                />
              ) : (
                <h2 className="font-bold text-lg leading-snug">{incident.title}</h2>
              )}
              <p className="text-sm text-muted-foreground mt-0.5">
                {CATEGORY_LABELS[incident.category as keyof typeof CATEGORY_LABELS]}
              </p>
            </div>
            {canEdit && !editMode && (
              <button onClick={() => setEditMode(true)} className="text-muted-foreground hover:text-primary p-1">
                <Pencil className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            <StatusBadge status={currentStatus} />
            <SeverityBadge severity={incident.severity as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"} />
          </div>

          {editMode ? (
            <div className="space-y-2 border-t border-border pt-3 mb-3">
              <Textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Description (optional)"
                rows={3}
              />
              <Input
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                placeholder="Location description"
              />
              <div className="flex gap-2">
                <Button size="sm" loading={editMutation.isPending} onClick={() => editMutation.mutate()}>
                  Save changes
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setEditMode(false); setEditTitle(incident.title); setEditDesc(incident.description ?? ""); setEditLocation(incident.locationText ?? ""); }}>
                  <X className="h-3.5 w-3.5 mr-1" /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            incident.description && (
              <p className="text-sm text-foreground/80 leading-relaxed mb-3 border-t border-border pt-3">
                {incident.description}
              </p>
            )
          )}

          <div className="space-y-2 border-t border-border pt-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User2 className="h-4 w-4 shrink-0" />
              {incident.isAnonymous ? "Reported anonymously" : `Reported by ${incident.reportedBy.name}`}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0" />
              {formatDateTime(incident.createdAt)}
            </div>
            {incident.locationText && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                {incident.locationText}
              </div>
            )}
            {incident.assignedTo && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserCheck className="h-4 w-4 shrink-0" />
                Assigned to {incident.assignedTo.name}
              </div>
            )}
          </div>

          {/* Community verification */}
          <div className="border-t border-border pt-3 mt-3 space-y-2">
            {isFlagged && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-2">
                <Flag className="h-4 w-4 text-red-500 shrink-0" />
                <p className="text-xs text-red-700 font-medium">This report has been flagged for review — multiple community members questioned its accuracy.</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Community Verification</p>
            <div className="flex gap-2">
              <button
                onClick={() => voteMutation.mutate("CONFIRM")}
                disabled={voteMutation.isPending || session?.user?.id === incident.reportedById}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all",
                  userVote === "CONFIRM"
                    ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                    : "border-border bg-background text-muted-foreground hover:border-emerald-300 hover:text-emerald-600"
                )}
              >
                <ThumbsUp className={cn("h-3.5 w-3.5", userVote === "CONFIRM" && "fill-current")} />
                Confirm
                {confirmCount > 0 && (
                  <span className="bg-emerald-100 text-emerald-700 text-xs px-1.5 py-0.5 rounded-full">{confirmCount}</span>
                )}
              </button>
              <button
                onClick={() => voteMutation.mutate("DISPUTE")}
                disabled={voteMutation.isPending || session?.user?.id === incident.reportedById}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all",
                  userVote === "DISPUTE"
                    ? "border-red-400 bg-red-50 text-red-700"
                    : "border-border bg-background text-muted-foreground hover:border-red-300 hover:text-red-600"
                )}
              >
                <ThumbsDown className={cn("h-3.5 w-3.5", userVote === "DISPUTE" && "fill-current")} />
                Dispute
                {disputeCount > 0 && (
                  <span className="bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded-full">{disputeCount}</span>
                )}
              </button>
            </div>
            {session?.user?.id === incident.reportedById && (
              <p className="text-xs text-muted-foreground">You cannot verify your own report.</p>
            )}
            {(confirmCount > 0 || disputeCount > 0) && (
              <p className="text-xs text-muted-foreground">
                {confirmCount} confirmed · {disputeCount} disputed
              </p>
            )}
          </div>
        </div>

        {incident.images.length > 0 && (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-4 pb-2">
              <h3 className="font-semibold text-sm">
                Media ({incident.images.length})
              </h3>
            </div>
            <div className={cn("grid gap-2 px-4 pb-4", incident.images.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
              {incident.images.map((media) =>
                media.mediaType === "video" ? (
                  <div key={media.id} className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
                    <video
                      src={media.url}
                      controls
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={media.id}
                    src={media.url}
                    alt="Incident photo"
                    className="w-full aspect-video object-cover rounded-xl"
                  />
                )
              )}
            </div>
          </div>
        )}

        {isAdmin && validTransitions.length > 0 && (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <button
              onClick={() => setShowStatusPanel(!showStatusPanel)}
              className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
            >
              <span className="font-semibold text-sm">Update Status</span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", showStatusPanel && "rotate-180")} />
            </button>
            {showStatusPanel && (
              <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                <div className="grid grid-cols-2 gap-2">
                  {validTransitions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNewStatus(s)}
                      className={cn(
                        "py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-all",
                        newStatus === s ? "border-primary bg-primary/5 text-primary" : "border-border bg-background text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
                <Textarea
                  placeholder="Add a note (optional)..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                />
                <Button
                  className="w-full"
                  disabled={!newStatus}
                  loading={statusMutation.isPending}
                  onClick={() => newStatus && statusMutation.mutate({ status: newStatus as IncidentStatus, note })}
                >
                  Update to {newStatus ? STATUS_LABELS[newStatus as IncidentStatus] : "..."}
                </Button>
              </div>
            )}
          </div>
        )}

        {isAdmin && !["RESOLVED", "CLOSED", "REJECTED"].includes(incident.status) && incident.severity !== "CRITICAL" && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertOctagon className="h-5 w-5 text-red-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-700">Escalate Incident</p>
                <p className="text-xs text-red-500">Mark as Critical and alert all responders</p>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              loading={escalateMutation.isPending}
              onClick={() => escalateMutation.mutate()}
            >
              Escalate
            </Button>
          </div>
        )}

        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-4 pb-2">
            <h3 className="font-semibold text-sm">Activity Timeline</h3>
          </div>
          <div className="px-4 pb-4">
            {incident.events.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No activity yet</p>
            ) : (
              <div className="space-y-0">
                {incident.events.map((event, i) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm shrink-0">
                        {getEventIcon(event.action)}
                      </div>
                      {i < incident.events.length - 1 && <div className="w-px h-full bg-border mt-1 mb-1 min-h-[20px]" />}
                    </div>
                    <div className="flex-1 pb-4 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{getEventLabel(event.action)}</p>
                        <span className="text-xs text-muted-foreground shrink-0">{formatRelativeTime(event.createdAt)}</span>
                      </div>
                      {event.toStatus && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {event.fromStatus && `${STATUS_LABELS[event.fromStatus as IncidentStatus]} → `}
                          {STATUS_LABELS[event.toStatus as IncidentStatus]}
                        </p>
                      )}
                      {event.note && <p className="text-sm text-foreground/80 mt-1 bg-muted rounded-lg px-3 py-2">{event.note}</p>}
                      {event.actor && (
                        <p className="text-xs text-muted-foreground mt-1">by {event.actor.name}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border px-4 py-3">
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold shrink-0 mt-1">
                {getInitials(session?.user?.name || "U")}
              </div>
              <div className="flex-1">
                <Textarea
                  placeholder="Add a note..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="mb-2"
                />
                <Button
                  size="sm"
                  className="gap-1.5"
                  disabled={!note.trim()}
                  loading={noteMutation.isPending}
                  onClick={() => noteMutation.mutate(note)}
                >
                  <Send className="h-3.5 w-3.5" />
                  Add note
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
