"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  History,
  Tag,
  Calendar,
  MessageSquare,
  Users,
  DollarSign,
  Settings,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

type ActivityType = "promotion" | "schedule" | "feedback" | "staff" | "revenue" | "settings" | "alert"

// Use relative offsets in minutes to avoid hydration mismatch
const activityOffsets = [5, 30, 45, 120, 180, 240, 360, 480] // minutes ago

const mockActivityData = [
  {
    id: "1",
    action: "Created new promotion",
    user: "Admin User",
    type: "promotion" as const,
    details: "Summer Escape Deal - 20% off",
    offsetIndex: 0,
  },
  {
    id: "2",
    action: "Published staff schedule",
    user: "Admin User",
    type: "schedule" as const,
    details: "Week of Apr 1, 2026",
    offsetIndex: 1,
  },
  {
    id: "3",
    action: "New feedback received",
    user: "System",
    type: "feedback" as const,
    details: "5-star review from John Smith",
    offsetIndex: 2,
  },
  {
    id: "4",
    action: "Staff member added",
    user: "Admin User",
    type: "staff" as const,
    details: "Amy Chen - Spa Therapist",
    offsetIndex: 3,
  },
  {
    id: "5",
    action: "AI pricing approved",
    user: "Admin User",
    type: "revenue" as const,
    details: "$165 ADR for weekend",
    offsetIndex: 4,
  },
  {
    id: "6",
    action: "Understaffed shift alert",
    user: "System",
    type: "alert" as const,
    details: "Tuesday 2-10 PM Front Desk",
    offsetIndex: 5,
  },
  {
    id: "7",
    action: "Promotion deactivated",
    user: "Admin User",
    type: "promotion" as const,
    details: "Early Bird Discount",
    offsetIndex: 6,
  },
  {
    id: "8",
    action: "Theme changed to dark mode",
    user: "Admin User",
    type: "settings" as const,
    offsetIndex: 7,
  },
]

function formatTimeAgoFromMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m ago`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
  return `${Math.floor(minutes / 1440)}d ago`
}

const getActivityIcon = (type: ActivityType) => {
  switch (type) {
    case "promotion":
      return Tag
    case "schedule":
      return Calendar
    case "feedback":
      return MessageSquare
    case "staff":
      return Users
    case "revenue":
      return DollarSign
    case "settings":
      return Settings
    case "alert":
      return AlertCircle
    default:
      return History
  }
}

const getActivityColor = (type: ActivityType) => {
  switch (type) {
    case "promotion":
      return "bg-primary/10 text-primary"
    case "schedule":
      return "bg-blue-500/10 text-blue-500"
    case "feedback":
      return "bg-green-500/10 text-green-500"
    case "staff":
      return "bg-purple-500/10 text-purple-500"
    case "revenue":
      return "bg-yellow-500/10 text-yellow-600"
    case "settings":
      return "bg-muted text-muted-foreground"
    case "alert":
      return "bg-destructive/10 text-destructive"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export function ActivityLog() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <History className="size-5" />
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
            8
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
          <SheetDescription>
            Recent actions and system events
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="mt-6 h-[calc(100vh-140px)]">
          <div className="space-y-4 pr-4">
            {mockActivityData.map((activity) => {
              const Icon = getActivityIcon(activity.type)
              return (
                <div
                  key={activity.id}
                  className="flex gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                >
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full",
                      getActivityColor(activity.type)
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
                        {formatTimeAgoFromMinutes(activityOffsets[activity.offsetIndex])}
                      </Badge>
                    </div>
                    {activity.details && (
                      <p className="text-xs text-muted-foreground">
                        {activity.details}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      by {activity.user}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

// Compact widget version for dashboard
export function ActivityLogWidget() {
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
          {mockActivityData.slice(0, 5).map((activity) => {
            const Icon = getActivityIcon(activity.type)
            return (
              <div key={activity.id} className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full",
                    getActivityColor(activity.type)
                  )}
                >
                  <Icon className="size-3.5" />
                </div>
                <div className="flex-1 truncate">
                  <p className="truncate text-sm">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimeAgoFromMinutes(activityOffsets[activity.offsetIndex])}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
