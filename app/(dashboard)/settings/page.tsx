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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Bell,
  Database,
  Building,
  RefreshCcw,
  Plus,
  Trash2,
  Activity,
  Save,
} from "lucide-react";
import {
  downloadBackup,
  getAdminSettings,
  getNotificationPreferences,
  getStaffingRatios,
  getSystemHealth,
  updateAdminSettings,
  updateNotificationPreferences,
  updateStaffingRatios,
  type NotificationPreference,
  type StaffingRatio,
} from "@/lib/settings-api";

type HealthMap = Record<string, { status: string; message: string }>;

const NOTIFICATION_TYPES = [
  "schedule_published",
  "peak_demand_alert",
  "feedback_negative",
  "override_confirmation",
  "low_occupancy_alert",
];

export default function SettingsPage() {
  const { toast } = useToast();

  const [settings, setSettings] = React.useState<Record<string, unknown>>({});
  const [ratios, setRatios] = React.useState<StaffingRatio[]>([]);
  const [preferences, setPreferences] = React.useState<
    NotificationPreference[]
  >([]);
  const [health, setHealth] = React.useState<HealthMap>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isBackingUp, setIsBackingUp] = React.useState(false);

  const loadAll = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [nextSettings, nextRatios, nextPrefs, nextHealth] =
        await Promise.all([
          getAdminSettings(),
          getStaffingRatios(),
          getNotificationPreferences(),
          getSystemHealth(),
        ]);
      setSettings(nextSettings);
      setRatios(nextRatios);
      setPreferences(nextPrefs);
      setHealth(nextHealth);
    } catch {
      toast({
        title: "Failed to load settings",
        description: "Please refresh and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const updateSetting = (key: string, value: unknown) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const upsertPreference = (notificationType: string, enabled: boolean) => {
    setPreferences((current) => {
      const index = current.findIndex(
        (item) => item.notification_type === notificationType,
      );
      if (index === -1) {
        return [
          ...current,
          {
            notification_type: notificationType,
            is_enabled: enabled,
            channel: "in_app",
          },
        ];
      }

      const next = [...current];
      next[index] = { ...next[index], is_enabled: enabled };
      return next;
    });
  };

  const saveAll = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        updateAdminSettings(settings),
        updateStaffingRatios(ratios),
        updateNotificationPreferences(preferences),
      ]);
      toast({
        title: "Settings saved",
        description: "Your updates were applied successfully.",
      });
      await loadAll();
    } catch {
      toast({
        title: "Failed to save settings",
        description: "Please review your values and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addRatioRow = () => {
    setRatios((current) => [
      ...current,
      {
        department: "",
        guest_ratio: 10,
        min_staff: 1,
        max_staff: null,
        is_active: true,
      },
    ]);
  };

  const updateRatio = (index: number, next: Partial<StaffingRatio>) => {
    setRatios((current) => {
      const copy = [...current];
      copy[index] = { ...copy[index], ...next };
      return copy;
    });
  };

  const removeRatio = (index: number) => {
    setRatios((current) => current.filter((_, i) => i !== index));
  };

  const runBackup = async () => {
    setIsBackingUp(true);
    try {
      const blob = await downloadBackup();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `resort-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast({ title: "Backup downloaded" });
    } catch {
      toast({
        title: "Backup failed",
        description: "Please try again in a few moments.",
        variant: "destructive",
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  if (
    isLoading &&
    Object.keys(settings).length === 0 &&
    ratios.length === 0 &&
    preferences.length === 0
  ) {
    return (
      <div className="flex flex-1 flex-col">
        <DashboardHeader
          title="Settings"
          breadcrumbs={[{ label: "Settings" }]}
        />
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="mx-auto max-w-4xl space-y-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <CardHeader>
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="mt-2 h-4 w-64" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title="Settings" breadcrumbs={[{ label: "Settings" }]} />
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="size-5 text-primary" />
                Resort Configuration
              </CardTitle>
              <CardDescription>
                Core forecast and business settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">
                  Loading settings...
                </p>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="total-rooms">Total Rooms</Label>
                  <Input
                    id="total-rooms"
                    value={String(settings.total_rooms ?? "")}
                    onChange={(event) =>
                      updateSetting("total_rooms", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <Input
                    id="currency"
                    value={String(settings.default_currency ?? "")}
                    onChange={(event) =>
                      updateSetting("default_currency", event.target.value)
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="forecast">Forecast Horizon (days)</Label>
                  <Input
                    id="forecast"
                    value={String(settings.forecast_horizon_days ?? "")}
                    onChange={(event) =>
                      updateSetting("forecast_horizon_days", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weekend">
                    Weekend Days (comma separated)
                  </Label>
                  <Input
                    id="weekend"
                    value={
                      Array.isArray(settings.weekend_days)
                        ? settings.weekend_days.join(", ")
                        : ""
                    }
                    onChange={(event) =>
                      updateSetting(
                        "weekend_days",
                        event.target.value
                          .split(",")
                          .map((item) => item.trim())
                          .filter(Boolean),
                      )
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="peak">Peak Demand Threshold (%)</Label>
                  <Input
                    id="peak"
                    value={String(settings.peak_demand_threshold ?? "")}
                    onChange={(event) =>
                      updateSetting("peak_demand_threshold", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="low">Low Demand Threshold (%)</Label>
                  <Input
                    id="low"
                    value={String(settings.low_demand_threshold ?? "")}
                    onChange={(event) =>
                      updateSetting("low_demand_threshold", event.target.value)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="size-5 text-primary" />
                Notifications
              </CardTitle>
              <CardDescription>
                Enable or disable in-app alerts by type
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {NOTIFICATION_TYPES.map((type, index) => {
                const current = preferences.find(
                  (item) => item.notification_type === type,
                );
                return (
                  <React.Fragment key={type}>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{type.replaceAll("_", " ")}</Label>
                        <p className="text-sm text-muted-foreground">
                          In-app alert rule
                        </p>
                      </div>
                      <Switch
                        checked={Boolean(current?.is_enabled)}
                        onCheckedChange={(value) =>
                          upsertPreference(type, value)
                        }
                      />
                    </div>
                    {index < NOTIFICATION_TYPES.length - 1 ? (
                      <Separator />
                    ) : null}
                  </React.Fragment>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="size-5 text-primary" />
                Staffing Ratios
              </CardTitle>
              <CardDescription>
                Staff recommendations per department
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {ratios.map((ratio, index) => (
                <div
                  key={`${ratio.department}-${index}`}
                  className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1.2fr_1fr_1fr_1fr_auto]"
                >
                  <Input
                    placeholder="Department"
                    value={ratio.department}
                    onChange={(event) =>
                      updateRatio(index, { department: event.target.value })
                    }
                  />
                  <Input
                    placeholder="Guest ratio"
                    type="number"
                    min={0}
                    step={0.1}
                    value={ratio.guest_ratio}
                    onChange={(event) =>
                      updateRatio(index, {
                        guest_ratio: Number(event.target.value) || 0,
                      })
                    }
                  />
                  <Input
                    placeholder="Min staff"
                    type="number"
                    min={0}
                    step={1}
                    value={ratio.min_staff}
                    onChange={(event) =>
                      updateRatio(index, {
                        min_staff: Number(event.target.value) || 0,
                      })
                    }
                  />
                  <Input
                    placeholder="Max staff"
                    type="number"
                    min={0}
                    step={1}
                    value={ratio.max_staff ?? ""}
                    onChange={(event) =>
                      updateRatio(index, {
                        max_staff: event.target.value
                          ? Number(event.target.value)
                          : null,
                      })
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRatio(index)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={addRatioRow}>
                <Plus className="mr-2 size-4" />
                Add Department
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="size-5 text-primary" />
                System Health
              </CardTitle>
              <CardDescription>
                Live status of key backend dependencies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(health).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium capitalize">{key}</p>
                    <p className="text-xs text-muted-foreground">
                      {value.message}
                    </p>
                  </div>
                  <Badge
                    variant={value.status === "ok" ? "default" : "destructive"}
                  >
                    {value.status}
                  </Badge>
                </div>
              ))}
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => void loadAll()}>
                  <RefreshCcw className="mr-2 size-4" />
                  Refresh Status
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="size-5 text-primary" />
                Backup & Recovery
              </CardTitle>
              <CardDescription>
                Download a complete data backup snapshot
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-medium">Export all tables</span>
                  <p className="text-sm text-muted-foreground">
                    Downloads JSON backup from the backend
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void runBackup()}
                  disabled={isBackingUp}
                >
                  <Database className="mr-2 size-4" />
                  {isBackingUp ? "Exporting..." : "Download Backup"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={() => void saveAll()}
              className="bg-primary hover:bg-primary/90"
              disabled={isSaving}
            >
              <Save className="mr-2 size-4" />
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
