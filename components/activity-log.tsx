"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  History,
  Tag,
  Calendar,
  MessageSquare,
  Users,
  DollarSign,
  Settings,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ActivityType =
  | "promotion"
  | "schedule"
  | "feedback"
  | "staff"
  | "revenue"
  | "settings"
  | "alert";

type AuditItem = {
  id: number | string;
  action: string;
  admin_email?: string | null;
  details?: Record<string, unknown> | null;
  created_at: string;
};

function formatTimeAgo(value: string): string {
  const diffMinutes = Math.max(
    1,
    Math.floor((Date.now() - new Date(value).getTime()) / 60000),
  );
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
  return `${Math.floor(diffMinutes / 1440)}d ago`;
}

function TimeAgo({ timestamp }: { timestamp: string }) {
  const [timeAgo, setTimeAgo] = React.useState(() => formatTimeAgo(timestamp));

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTimeAgo(formatTimeAgo(timestamp));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [timestamp]);

  return <span>{timeAgo}</span>;
}

function formatActivityType(action: string): ActivityType {
  if (action.includes("schedule")) return "schedule";
  if (action.includes("feedback")) return "feedback";
  if (action.includes("staff")) return "staff";
  if (
    action.includes("revenue") ||
    action.includes("pricing") ||
    action.includes("override")
  )
    return "revenue";
  if (action.includes("setting")) return "settings";
  if (action.includes("alert") || action.includes("notification"))
    return "alert";
  return "promotion";
}

function formatActivityDetails(
  details?: Record<string, unknown> | null,
): string {
  if (!details) return "";
  const parts: string[] = [];
  for (const [key, value] of Object.entries(details)) {
    if (value === null || value === undefined || value === "") continue;
    if (typeof value === "object") {
      parts.push(`${key}: ${JSON.stringify(value)}`);
    } else {
      parts.push(`${key}: ${String(value)}`);
    }
  }
  return parts.join(" • ");
}

const getActivityIcon = (type: ActivityType) => {
  switch (type) {
    case "promotion":
      return Tag;
    case "schedule":
      return Calendar;
    case "feedback":
      return MessageSquare;
    case "staff":
      return Users;
    case "revenue":
      return DollarSign;
    case "settings":
      return Settings;
    case "alert":
      return AlertCircle;
    default:
      return History;
  }
};

const getActivityColor = (type: ActivityType) => {
  switch (type) {
    case "promotion":
      return "bg-primary/10 text-primary";
    case "schedule":
      return "bg-blue-500/10 text-blue-500";
    case "feedback":
      return "bg-green-500/10 text-green-500";
    case "staff":
      return "bg-purple-500/10 text-purple-500";
    case "revenue":
      return "bg-yellow-500/10 text-yellow-600";
    case "settings":
      return "bg-muted text-muted-foreground";
    case "alert":
      return "bg-destructive/10 text-destructive";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export function ActivityLog() {
  const router = useRouter();
  const [activities, setActivities] = React.useState<AuditItem[]>([]);

  const load = React.useCallback(async () => {
    try {
      const response = await fetch("/api/admin/audit-log?limit=8");
      if (!response.ok) return;
      const data = (await response.json()) as { audit_log?: AuditItem[] };
      setActivities(data.audit_log ?? []);
    } catch {
      setActivities([]);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <History className="size-5" />
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
            {activities.length}
          </span>
          <span className="sr-only">Activity Log</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="size-5" />
            Activity Log
          </SheetTitle>
          <SheetDescription>Recent actions and system events</SheetDescription>
        </SheetHeader>
        <ScrollArea className="mt-6 h-[calc(100vh-140px)]">
          <div className="space-y-4 pr-4">
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No recent activity.
              </p>
            ) : null}
            {activities.map((activity) => {
              const type = formatActivityType(activity.action);
              const Icon = getActivityIcon(type);
              return (
                <div
                  key={activity.id}
                  className="flex gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                >
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full",
                      getActivityColor(type),
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-tight">
                        {activity.action}
                      </p>
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        <TimeAgo timestamp={activity.created_at} />
                      </Badge>
                    </div>
                    {formatActivityDetails(activity.details) ? (
                      <p className="text-xs text-muted-foreground">
                        {formatActivityDetails(activity.details)}
                      </p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      by {activity.admin_email ?? "system"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={() => router.push("/audit-log")}>
            Open full audit log
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Compact widget version for dashboard
export function ActivityLogWidget() {
  const [activities, setActivities] = React.useState<AuditItem[]>([]);

  const load = React.useCallback(async () => {
    try {
      const response = await fetch("/api/admin/audit-log?limit=5");
      if (!response.ok) return;
      const data = (await response.json()) as { audit_log?: AuditItem[] };
      setActivities(data.audit_log ?? []);
    } catch {
      setActivities([]);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Recent Activity</CardTitle>
          <ActivityLog />
        </div>
        <CardDescription>Latest actions in the system</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.slice(0, 5).map((activity) => {
            const type = formatActivityType(activity.action);
            const Icon = getActivityIcon(type);
            return (
              <div key={activity.id} className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full",
                    getActivityColor(type),
                  )}
                >
                  <Icon className="size-3.5" />
                </div>
                <div className="flex-1 truncate">
                  <p className="truncate text-sm">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">
                    <TimeAgo timestamp={activity.created_at} />
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
