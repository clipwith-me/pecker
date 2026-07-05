"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, Bell, User, LayoutDashboard, Map } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

const userNav = [
  { href: "/incidents", icon: Home, label: "Home" },
  { href: "/incidents/new", icon: PlusCircle, label: "Report" },
  { href: "/map", icon: Map, label: "Map" },
  { href: "/notifications", icon: Bell, label: "Alerts" },
  { href: "/profile", icon: User, label: "Profile" },
];

const adminNav = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/incidents", icon: Home, label: "Incidents" },
  { href: "/incidents/new", icon: PlusCircle, label: "Report" },
  { href: "/map", icon: Map, label: "Map" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "RESPONDER";
  const nav = isAdmin ? adminNav : userNav;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border safe-bottom md:hidden">
      <div className="flex items-center justify-around h-16">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/incidents" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-0.5 touch-target transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "fill-current")} strokeWidth={active ? 2.5 : 1.75} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
