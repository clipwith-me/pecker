"use client";

import { Bell, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

interface TopBarProps {
  title: string;
  showBack?: boolean;
  actions?: React.ReactNode;
}

export function TopBar({ title, showBack, actions }: TopBarProps) {
  const router = useRouter();

  const { data: notifData } = useQuery({
    queryKey: ["notifications-count"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      return (data.data as Array<{ read: boolean }>)?.filter((n) => !n.read).length ?? 0;
    },
    refetchInterval: 30000,
  });

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center h-14 px-4 gap-3">
        {showBack && (
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <h1 className="flex-1 text-lg font-semibold truncate">{title}</h1>
        <div className="flex items-center gap-1">
          {actions}
          <Link href="/notifications">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {(notifData ?? 0) > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
              )}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
