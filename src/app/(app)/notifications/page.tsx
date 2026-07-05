"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  incident: { id: string; title: string } | null;
}

const TYPE_ICONS: Record<string, string> = {
  STATUS_CHANGED: "🔄",
  INCIDENT_ASSIGNED: "👤",
  INCIDENT_ESCALATED: "🚨",
  COMMENT_ADDED: "💬",
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery<NotificationItem[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      const json = await res.json();
      return json.data;
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-count"] });
    },
  });

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <div>
      <TopBar
        title="Notifications"
        actions={
          unreadCount > 0 ? (
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => markAllRead.mutate()}>
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          ) : undefined
        }
      />

      <div className="p-4 space-y-2">
        {isLoading ? (
          [1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />)
        ) : notifications?.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">No notifications</h3>
            <p className="text-sm text-muted-foreground">You&apos;re all caught up!</p>
          </div>
        ) : (
          notifications?.map((n) => (
            <div
              key={n.id}
              className={cn(
                "bg-card rounded-2xl border border-border p-4 transition-colors",
                !n.read && "border-primary/20 bg-primary/[0.02]"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg shrink-0">
                  {TYPE_ICONS[n.type] || "🔔"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-sm", !n.read ? "font-semibold text-foreground" : "text-foreground/80")}>
                      {n.message}
                    </p>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />}
                  </div>
                  {n.incident && (
                    <Link
                      href={`/incidents/${n.incident.id}`}
                      className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                    >
                      {n.incident.title} <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(n.createdAt)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
