"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  clearAllReadNotifications,
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "@/lib/notifications-api";

function timeAgo(value: string): string {
  const now = Date.now();
  const then = new Date(value).getTime();
  const minutes = Math.max(1, Math.floor((now - then) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = React.useState<NotificationItem[]>([]);
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [isLoading, setIsLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getNotifications(200);
      setItems(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const filtered = items.filter((item) => {
    const typeMatch = typeFilter === "all" || item.type === typeFilter;
    const statusMatch =
      statusFilter === "all" ||
      (statusFilter === "read" ? item.is_read : !item.is_read);
    return typeMatch && statusMatch;
  });

  const markRead = async (item: NotificationItem) => {
    await markNotificationRead(item.id);
    await load();
  };

  const remove = async (item: NotificationItem) => {
    await deleteNotification(item.id);
    await load();
  };

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        title="Notifications"
        breadcrumbs={[{ label: "Notifications" }]}
      />
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="schedule_published">Schedule</SelectItem>
                  <SelectItem value="peak_demand">Peak Demand</SelectItem>
                  <SelectItem value="negative_feedback">Feedback</SelectItem>
                  <SelectItem value="override_confirmed">Override</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => void markAllNotificationsRead().then(load)}
              >
                Mark all as read
              </Button>
              <Button
                variant="outline"
                onClick={() => void clearAllReadNotifications().then(load)}
              >
                Clear all read
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Notifications</CardTitle>
              <CardDescription>
                {filtered.length} notification(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">
                  Loading notifications...
                </p>
              ) : null}
              {!isLoading && filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No notifications found.
                </p>
              ) : null}
              <div className="space-y-3">
                {filtered.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-lg border p-3 ${!item.is_read ? "border-primary/50 bg-primary/5" : "border-border"}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-sm ${!item.is_read ? "font-semibold" : "font-medium"}`}
                          >
                            {item.title}
                          </p>
                          <Badge variant="outline" className="text-[10px]">
                            {item.type}
                          </Badge>
                          {!item.is_read ? (
                            <span className="size-2 rounded-full bg-primary" />
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.message}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {timeAgo(item.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!item.is_read ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void markRead(item)}
                          >
                            Mark read
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void remove(item)}
                        >
                          Delete
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            if (item.related_url) {
                              router.push(item.related_url);
                            }
                          }}
                          disabled={!item.related_url}
                        >
                          Open
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
