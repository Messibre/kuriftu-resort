"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
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

function TimeAgo({ timestamp }: { timestamp: string }) {
  const [timeAgoStr, setTimeAgoStr] = React.useState(() => timeAgo(timestamp));

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTimeAgoStr(timeAgo(timestamp));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [timestamp]);

  return <span>{timeAgoStr}</span>;
}

export function NotificationsBell() {
  const router = useRouter();
  const [items, setItems] = React.useState<NotificationItem[]>([]);

  const load = React.useCallback(async () => {
    try {
      const next = await getNotifications(10);
      setItems(next);

      if (typeof window !== "undefined" && "Notification" in window) {
        const stored = Number(
          window.localStorage.getItem("notifications-last-count") || "0",
        );
        if (next.length > stored && next.some((item) => !item.is_read)) {
          if (window.Notification.permission === "granted") {
            const latest = next[0];
            new window.Notification(latest.title, { body: latest.message });
          }
        }
        window.localStorage.setItem(
          "notifications-last-count",
          String(next.length),
        );
      }
    } catch {
      // Silent in header dropdown.
    }
  }, []);

  React.useEffect(() => {
    void load();

    const interval = window.setInterval(() => {
      void load();
    }, 60000);

    return () => window.clearInterval(interval);
  }, [load]);

  const unreadCount = items.filter((item) => !item.is_read).length;

  const openNotification = async (item: NotificationItem) => {
    if (!item.is_read) {
      try {
        await markNotificationRead(item.id);
      } catch {
        // no-op
      }
    }

    if (item.related_url) {
      router.push(item.related_url);
    } else {
      router.push("/notifications");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      await load();
    } catch {
      // no-op
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <Badge variant="secondary" className="text-[10px]">
            {unreadCount} unread
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <DropdownMenuItem disabled>No notifications</DropdownMenuItem>
        ) : (
          items.map((item) => (
            <DropdownMenuItem
              key={item.id}
              className="cursor-pointer items-start"
              onClick={() => void openNotification(item)}
            >
              <div className="flex w-full items-start gap-2">
                {!item.is_read ? (
                  <span className="mt-1 size-2 rounded-full bg-primary" />
                ) : (
                  <span className="mt-1 size-2" />
                )}
                <div className="flex-1">
                  <p
                    className={`text-sm ${!item.is_read ? "font-semibold" : "font-medium"}`}
                  >
                    {item.title}
                  </p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {item.message}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    <TimeAgo timestamp={item.created_at} />
                  </p>
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void handleMarkAllRead()}>
          Mark all as read
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/notifications")}>
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
