"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Mail, Phone, Shield, MapPin, Pencil, Check, X } from "lucide-react";
import { useState } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/useToast";
import { formatDate, getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { SafeUser } from "@/lib/types";

type UserWithCounts = SafeUser & {
  city?: string | null;
  community?: string | null;
  state?: string | null;
  country?: string | null;
  _count: { reportedIncidents: number; assignedIncidents: number };
};

const ROLE_COLORS: Record<string, string> = {
  RESIDENT: "bg-gray-100 text-gray-600",
  RESPONDER: "bg-blue-100 text-blue-700",
  ADMIN: "bg-purple-100 text-purple-700",
};

function LocationEditor({ user, onSave }: { user: UserWithCounts; onSave: (data: Record<string, string>) => void }) {
  const [editing, setEditing] = useState(false);
  const [city, setCity] = useState(user.city ?? "");
  const [community, setCommunity] = useState(user.community ?? "");
  const [state, setState] = useState(user.state ?? "");
  const [country, setCountry] = useState(user.country ?? "");

  const hasLocation = user.city || user.community || user.state || user.country;

  if (!editing) {
    return (
      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3 shrink-0" />
        <span className="truncate">{hasLocation ? [user.community, user.city, user.country].filter(Boolean).join(", ") : "No area set"}</span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="ml-auto shrink-0 text-indigo-500 hover:text-indigo-700 transition-colors"
          title="Edit service area"
        >
          <Pencil className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-1.5 p-2 bg-indigo-50 rounded-xl border border-indigo-100">
      <p className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wide">Service area</p>
      <div className="grid grid-cols-2 gap-1.5">
        {[
          { label: "City", value: city, set: setCity },
          { label: "Community", value: community, set: setCommunity },
          { label: "State", value: state, set: setState },
          { label: "Country", value: country, set: setCountry },
        ].map(({ label, value, set }) => (
          <input
            key={label}
            value={value}
            onChange={(e) => set(e.target.value)}
            placeholder={label}
            className="h-7 px-2 text-xs rounded-lg border border-indigo-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        ))}
      </div>
      <div className="flex gap-1.5 justify-end">
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="h-6 px-2 rounded text-xs text-gray-500 hover:bg-gray-100 flex items-center gap-1"
        >
          <X className="h-3 w-3" /> Cancel
        </button>
        <button
          type="button"
          onClick={() => { onSave({ city, community, state, country }); setEditing(false); }}
          className="h-6 px-2 rounded text-xs text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1"
        >
          <Check className="h-3 w-3" /> Save
        </button>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery<UserWithCounts[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      const json = await res.json();
      return json.data;
    },
    enabled: session?.user.role === "ADMIN",
  });

  const updateUserMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "User updated" });
    },
    onError: () => toast({ title: "Update failed", variant: "destructive" }),
  });

  if (session?.user.role !== "ADMIN") {
    return (
      <div>
        <TopBar title="Users" showBack />
        <div className="p-8 text-center text-muted-foreground">Admin access required</div>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="User Management" />

      <div className="p-4 space-y-3">
        {isLoading ? (
          [1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />)
        ) : (
          users?.map((user) => (
            <div key={user.id} className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0">
                  {getInitials(user.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {user.email}
                      </p>
                      {user.phone && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {user.phone}
                        </p>
                      )}
                    </div>
                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", ROLE_COLORS[user.role])}>
                      {user.role}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{user._count.reportedIncidents} reported</span>
                    <span>{user._count.assignedIncidents} assigned</span>
                    <span>Joined {formatDate(user.createdAt)}</span>
                  </div>

                  {/* Location editor for responders */}
                  {user.role === "RESPONDER" && user.id !== session.user.id && (
                    <LocationEditor
                      user={user}
                      onSave={(loc) => updateUserMutation.mutate({ id: user.id, ...loc })}
                    />
                  )}

                  {user.id !== session.user.id && (
                    <div className="mt-3 flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                      <Select
                        value={user.role}
                        onValueChange={(role) => updateUserMutation.mutate({ id: user.id, role })}
                      >
                        <SelectTrigger className="h-8 text-xs rounded-lg border-dashed">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RESIDENT">Resident</SelectItem>
                          <SelectItem value="RESPONDER">Responder</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
