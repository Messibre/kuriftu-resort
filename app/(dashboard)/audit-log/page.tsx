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
import { useToast } from "@/hooks/use-toast";

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

export default function AuditLogPage() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [adminEmail, setAdminEmail] = React.useState("");
  const [actionType, setActionType] = React.useState("");

  const load = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ limit: "300" });
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
  }, [actionType, adminEmail, endDate, startDate, toast]);

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
              <CardTitle>Audit Events</CardTitle>
              <CardDescription>{items.length} event(s)</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">
                  Loading events...
                </p>
              ) : null}
              {!isLoading && items.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No events found.
                </p>
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
                    <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs">
                      {JSON.stringify(item.details ?? {}, null, 2)}
                    </pre>
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
