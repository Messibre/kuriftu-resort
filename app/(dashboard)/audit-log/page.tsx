"use client";

import * as React from "react";

import { DashboardHeader } from "@/components/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

type AuditEntry = {
  id?: number;
  admin_email?: string;
  action?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  created_at?: string;
};

function formatTime(value?: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatDetails(details?: Record<string, unknown>): string {
  if (!details || Object.keys(details).length === 0) return "No details";
  const entries = Object.entries(details);
  return entries
    .map(([key, value]) => {
      if (value === null || value === undefined) return `${key}: -`;
      if (typeof value === "object") return `${key}: ${JSON.stringify(value)}`;
      return `${key}: ${String(value)}`;
    })
    .join("\n");
}

export default function AuditLogPage() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [page, setPage] = React.useState(0);
  const pageSize = 25;
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [adminEmail, setAdminEmail] = React.useState("");
  const [actionType, setActionType] = React.useState("");

  const load = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(pageSize),
        offset: String(page * pageSize),
      });
      if (startDate) params.set("start_date", startDate);
      if (endDate) params.set("end_date", endDate);
      if (adminEmail) params.set("admin_email", adminEmail);
      if (actionType) params.set("action_type", actionType);

      const response = await fetch(`/api/admin/audit-log?${params.toString()}`);
      if (!response.ok) throw new Error("Failed");
      const data = (await response.json()) as { audit_log?: AuditEntry[] };
      setItems(data.audit_log ?? []);
    } catch {
      toast({
        title: "Failed to load audit log",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [actionType, adminEmail, endDate, page, pageSize, startDate, toast]);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        title="Audit Log"
        breadcrumbs={[{ label: "Audit Log" }]}
      />
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>
                Filter actions by date, user, or action type
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Admin Email</Label>
                <Input
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@resort.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Action Type</Label>
                <Input
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  placeholder="updated_settings"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button className="w-full" onClick={() => void load()}>
                  Apply
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Audit Events</CardTitle>
                  <CardDescription>
                    Page {page + 1} - {items.length} event(s)
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => void load()}>
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-3">
                        <Skeleton className="h-4 w-44" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="mt-3 h-3 w-28" />
                      <Skeleton className="mt-3 h-20 w-full" />
                    </div>
                  ))}
                </div>
              ) : null}
              {!isLoading && items.length === 0 ? (
                <EmptyState
                  title="No audit events yet"
                  description="Operational actions will appear here once admins start saving settings, publishing schedules, or adjusting promotions."
                  className="py-10"
                />
              ) : null}
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={`${item.id ?? index}-${item.created_at ?? index}`}
                    className="rounded-lg border p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {item.action ?? "unknown_action"}
                        </p>
                        <Badge variant="outline">
                          {item.admin_email ?? "unknown"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(item.created_at)}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      IP: {item.ip_address ?? "-"}
                    </p>
                    <Separator className="my-2" />
                    <pre className="overflow-auto rounded bg-muted p-2 text-xs whitespace-pre-wrap">
                      {formatDetails(item.details)}
                    </pre>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Button
                  variant="outline"
                  disabled={page === 0 || isLoading}
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={items.length < pageSize || isLoading}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
