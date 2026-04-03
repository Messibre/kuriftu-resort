"use client"

import * as React from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Mail,
  Send,
  RefreshCw,
  XCircle,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface EmailLog {
  id: string
  staffName: string
  email: string
  status: "success" | "failed" | "pending"
  timestamp: Date
}

const scheduleData = [
  {
    day: "Monday",
    date: "Apr 1",
    shifts: [
      { time: "6:00 AM - 2:00 PM", department: "Front Desk", staff: ["John S.", "Sarah M."], status: "confirmed" },
      { time: "2:00 PM - 10:00 PM", department: "Front Desk", staff: ["Mike R.", "Lisa A."], status: "confirmed" },
      { time: "6:00 AM - 2:00 PM", department: "Housekeeping", staff: ["Emma W.", "David L.", "Amy C.", "Tom H."], status: "confirmed" },
    ],
  },
  {
    day: "Tuesday",
    date: "Apr 2",
    shifts: [
      { time: "6:00 AM - 2:00 PM", department: "Front Desk", staff: ["John S.", "Sarah M."], status: "pending" },
      { time: "2:00 PM - 10:00 PM", department: "Front Desk", staff: ["Mike R."], status: "understaffed" },
      { time: "6:00 AM - 2:00 PM", department: "Housekeeping", staff: ["Emma W.", "David L.", "Amy C.", "Tom H."], status: "confirmed" },
    ],
  },
  {
    day: "Wednesday",
    date: "Apr 3",
    shifts: [
      { time: "6:00 AM - 2:00 PM", department: "Front Desk", staff: ["Sarah M.", "Lisa A."], status: "confirmed" },
      { time: "2:00 PM - 10:00 PM", department: "Front Desk", staff: ["John S.", "Mike R."], status: "confirmed" },
      { time: "6:00 AM - 2:00 PM", department: "Housekeeping", staff: ["Emma W.", "David L.", "Amy C."], status: "confirmed" },
    ],
  },
]

const staffEmails = [
  { name: "John S.", email: "john.s@resort.com" },
  { name: "Sarah M.", email: "sarah.m@resort.com" },
  { name: "Mike R.", email: "mike.r@resort.com" },
  { name: "Lisa A.", email: "lisa.a@resort.com" },
  { name: "Emma W.", email: "emma.w@resort.com" },
  { name: "David L.", email: "david.l@resort.com" },
  { name: "Amy C.", email: "amy.c@resort.com" },
  { name: "Tom H.", email: "tom.h@resort.com" },
]

export default function SchedulingPage() {
  const [isPublishOpen, setIsPublishOpen] = React.useState(false)
  const [isPublishing, setIsPublishing] = React.useState(false)
  const [emailLogs, setEmailLogs] = React.useState<EmailLog[]>([])
  const [showLogs, setShowLogs] = React.useState(false)

  const handlePublishAndEmail = async () => {
    setIsPublishing(true)
    setEmailLogs([])

    // Simulate sending emails to each staff member
    for (const staff of staffEmails) {
      // Add pending status
      setEmailLogs((prev) => [
        ...prev,
        {
          id: staff.email,
          staffName: staff.name,
          email: staff.email,
          status: "pending",
          timestamp: new Date(),
        },
      ])

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 400))

      // Randomly succeed or fail (90% success rate)
      const success = Math.random() > 0.1
      setEmailLogs((prev) =>
        prev.map((log) =>
          log.id === staff.email
            ? { ...log, status: success ? "success" : "failed", timestamp: new Date() }
            : log
        )
      )
    }

    setIsPublishing(false)
    setShowLogs(true)
  }

  const handleRetry = async (email: string) => {
    setEmailLogs((prev) =>
      prev.map((log) =>
        log.id === email ? { ...log, status: "pending" } : log
      )
    )

    await new Promise((resolve) => setTimeout(resolve, 800))

    setEmailLogs((prev) =>
      prev.map((log) =>
        log.id === email
          ? { ...log, status: "success", timestamp: new Date() }
          : log
      )
    )
  }

  const successCount = emailLogs.filter((l) => l.status === "success").length
  const failedCount = emailLogs.filter((l) => l.status === "failed").length

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        title="Staff Scheduling"
        breadcrumbs={[{ label: "Scheduling" }]}
      />
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="flex flex-col gap-6">
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Shifts This Week
                </CardTitle>
                <Calendar className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">42</div>
                <p className="text-xs text-muted-foreground">Across all departments</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Staff on Duty Today
                </CardTitle>
                <Users className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">18</div>
                <p className="text-xs text-muted-foreground">8 Front Desk, 10 Housekeeping</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Confirmed Shifts
                </CardTitle>
                <CheckCircle2 className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">38</div>
                <p className="text-xs text-muted-foreground">90% confirmed</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Needs Attention
                </CardTitle>
                <AlertCircle className="size-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">4</div>
                <p className="text-xs text-muted-foreground">2 understaffed, 2 pending</p>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={() => setIsPublishOpen(true)}
            >
              <Send className="mr-2 size-4" />
              Publish & Email Staff
            </Button>
            <Button variant="outline">
              <Users className="mr-2 size-4" />
              Auto-Assign Staff
            </Button>
            <Button variant="outline">
              <Clock className="mr-2 size-4" />
              View Time Off Requests
            </Button>
          </div>

          {/* Email Status Log (shown after publishing) */}
          {showLogs && emailLogs.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Mail className="size-4" />
                      Email Status Log
                    </CardTitle>
                    <CardDescription>
                      {successCount} sent successfully, {failedCount} failed
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLogs(false)}
                    className="text-muted-foreground"
                  >
                    Hide
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {emailLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between rounded-lg border border-border p-3"
                      >
                        <div className="flex items-center gap-3">
                          {log.status === "success" && (
                            <CheckCircle2 className="size-4 text-primary" />
                          )}
                          {log.status === "failed" && (
                            <XCircle className="size-4 text-destructive" />
                          )}
                          {log.status === "pending" && (
                            <Loader2 className="size-4 animate-spin text-muted-foreground" />
                          )}
                          <div>
                            <p className="text-sm font-medium">{log.staffName}</p>
                            <p className="text-xs text-muted-foreground">{log.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              log.status === "success" &&
                                "border-primary bg-primary/10 text-primary",
                              log.status === "failed" &&
                                "border-destructive bg-destructive/10 text-destructive",
                              log.status === "pending" &&
                                "border-muted-foreground bg-muted text-muted-foreground"
                            )}
                          >
                            {log.status}
                          </Badge>
                          {log.status === "failed" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRetry(log.id)}
                              className="h-7 text-xs"
                            >
                              <RefreshCw className="mr-1 size-3" />
                              Retry
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Schedule Grid */}
          <div className="space-y-4">
            {scheduleData.map((day) => (
              <Card key={day.day}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{day.day}</CardTitle>
                      <CardDescription>{day.date}, 2026</CardDescription>
                    </div>
                    <Badge variant="outline" className="border-primary text-primary">
                      {day.shifts.length} shifts
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {day.shifts.map((shift, index) => (
                      <div
                        key={index}
                        className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border p-3"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="size-4 text-muted-foreground" />
                            <span className="font-medium">{shift.time}</span>
                          </div>
                          <Badge variant="secondary">{shift.department}</Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            {shift.staff.slice(0, 4).map((name, i) => (
                              <Avatar key={i} className="size-8 border-2 border-background">
                                <AvatarFallback className="bg-primary/10 text-xs text-primary">
                                  {name.split(" ").map((n) => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {shift.staff.length > 4 && (
                              <Avatar className="size-8 border-2 border-background">
                                <AvatarFallback className="bg-muted text-xs">
                                  +{shift.staff.length - 4}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              shift.status === "confirmed"
                                ? "border-primary bg-primary/10 text-primary"
                                : shift.status === "understaffed"
                                ? "border-destructive bg-destructive/10 text-destructive"
                                : "border-yellow-500 bg-yellow-500/10 text-yellow-600"
                            }
                          >
                            {shift.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Publish & Email Confirmation Dialog */}
      <Dialog open={isPublishOpen} onOpenChange={setIsPublishOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="size-5 text-primary" />
              Publish Schedule & Email Staff
            </DialogTitle>
            <DialogDescription>
              This will publish the current schedule and send email notifications to all staff members.
            </DialogDescription>
          </DialogHeader>

          {/* Email Preview */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Email Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="font-medium text-muted-foreground">To:</span>
                <span>All scheduled staff ({staffEmails.length} recipients)</span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium text-muted-foreground">Subject:</span>
                <span>Your Schedule for Week of Apr 1, 2026</span>
              </div>
              <div className="mt-3 rounded-md border border-border bg-background p-3">
                <p className="text-muted-foreground">
                  Hi {"[Staff Name]"},
                </p>
                <p className="mt-2 text-muted-foreground">
                  Your schedule for the week of April 1st has been published. Please review your assigned shifts below:
                </p>
                <ul className="mt-2 list-inside list-disc text-muted-foreground">
                  <li>Monday, Apr 1: 6:00 AM - 2:00 PM (Front Desk)</li>
                  <li>Wednesday, Apr 3: 2:00 PM - 10:00 PM (Front Desk)</li>
                </ul>
                <p className="mt-2 text-muted-foreground">
                  Please confirm your availability in the staff portal.
                </p>
              </div>
            </CardContent>
          </Card>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsPublishOpen(false)}
              disabled={isPublishing}
            >
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={handlePublishAndEmail}
              disabled={isPublishing}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 size-4" />
                  Confirm & Send
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
