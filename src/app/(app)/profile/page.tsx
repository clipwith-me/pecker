"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, Mail, Shield, Heart } from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";

const ROLE_INFO: Record<string, { label: string; description: string; color: string }> = {
  RESIDENT: {
    label: "Resident",
    description: "Can report and track your own incidents",
    color: "bg-gray-100 text-gray-700",
  },
  RESPONDER: {
    label: "Responder",
    description: "Can manage and respond to all incidents",
    color: "bg-blue-100 text-blue-700",
  },
  ADMIN: {
    label: "Administrator",
    description: "Full system access and user management",
    color: "bg-purple-100 text-purple-700",
  },
};

export default function ProfilePage() {
  const { data: session } = useSession();
  const user = session?.user;
  const role = user?.role || "RESIDENT";
  const roleInfo = ROLE_INFO[role];

  return (
    <div>
      <TopBar title="Profile" />

      <div className="p-4 space-y-4">
        <div className="flex flex-col items-center py-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold mb-3">
            {getInitials(user?.name || "U")}
          </div>
          <h2 className="text-xl font-bold">{user?.name}</h2>
          <span className={cn("text-xs font-medium px-3 py-1 rounded-full mt-1", roleInfo?.color)}>
            {roleInfo?.label}
          </span>
        </div>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <Shield className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Access level</p>
                <p className="text-sm font-medium">{roleInfo?.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Link href="/support">
          <Button variant="outline" className="w-full gap-2 text-rose-500 border-rose-200 hover:bg-rose-50 hover:text-rose-600">
            <Heart className="h-4 w-4" />
            Support Pecker
          </Button>
        </Link>

        <Button
          variant="outline"
          className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
