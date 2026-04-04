"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  CalendarIcon,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import { DashboardHeader } from "@/components/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  createPromotion,
  deletePromotion,
  getPromotions,
  updatePromotion,
  type Promotion,
  type PromotionRoomType,
} from "@/lib/promotions-api";
import { exportReport } from "@/lib/export-api";

const ROOM_TYPE_OPTIONS: { value: PromotionRoomType; label: string }[] = [
  { value: "standard", label: "Standard" },
  { value: "deluxe", label: "Deluxe" },
  { value: "suite", label: "Suite" },
];

const DEFAULT_VISIBLE_PROMOTIONS = 5;

type PromotionFormState = {
  title: string;
  description: string;
  startDate?: Date;
  endDate?: Date;
  discountPercent: number;
  roomTypes: PromotionRoomType[];
  isActive: boolean;
};

const defaultFormState: PromotionFormState = {
  title: "",
  description: "",
  startDate: undefined,
  endDate: undefined,
  discountPercent: 15,
  roomTypes: ["standard"],
  isActive: true,
};

function formatDateRange(startDate: Date, endDate: Date): string {
  return `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`;
}

function formatRoomType(roomType: PromotionRoomType): string {
  return roomType.charAt(0).toUpperCase() + roomType.slice(1);
}

function buildFormState(promotion: Promotion): PromotionFormState {
  return {
    title: promotion.title,
    description: promotion.description,
    startDate: promotion.startDate,
    endDate: promotion.endDate,
    discountPercent: promotion.discountPercent,
    roomTypes: promotion.roomTypes,
    isActive: promotion.isActive,
  };
}

export function PromotionsManager() {
  const [promotions, setPromotions] = React.useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [editingPromotion, setEditingPromotion] =
    React.useState<Promotion | null>(null);
  const [formState, setFormState] =
    React.useState<PromotionFormState>(defaultFormState);
  const [showAllPromotions, setShowAllPromotions] = React.useState(false);
  const [isFormExpanded, setIsFormExpanded] = React.useState(false);
  const { toast } = useToast();

  const loadPromotions = React.useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await getPromotions();
      setPromotions(data);
    } catch {
      toast({
        title: "Failed to load promotions",
        description: "Please refresh and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    void loadPromotions();
  }, [loadPromotions]);

  const resetForm = () => {
    setEditingPromotion(null);
    setFormState(defaultFormState);
    setIsFormExpanded(false);
  };

  const openEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setFormState(buildFormState(promotion));
    setIsFormExpanded(true);
  };

  const handleRoomTypeChange = (
    roomType: PromotionRoomType,
    checked: boolean,
  ) => {
    setFormState((current) => ({
      ...current,
      roomTypes: checked
        ? [...current.roomTypes, roomType]
        : current.roomTypes.filter((value) => value !== roomType),
    }));
  };

  const handleSave = async () => {
    if (!formState.title.trim() || !formState.startDate || !formState.endDate) {
      return;
    }

    if (formState.roomTypes.length === 0) {
      toast({
        title: "Select at least one room type",
        description: "Choose Standard, Deluxe, or Suite before saving.",
        variant: "destructive",
      });
      return;
    }

    if (formState.endDate < formState.startDate) {
      toast({
        title: "Invalid date range",
        description: "The end date must be after the start date.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        title: formState.title.trim(),
        description: formState.description.trim(),
        startDate: formState.startDate,
        endDate: formState.endDate,
        discountPercent: formState.discountPercent,
        roomTypes: formState.roomTypes,
        isActive: formState.isActive,
      };

      if (editingPromotion) {
        await updatePromotion(editingPromotion.id, payload);
        toast({
          title: "Promotion updated",
          description: `"${payload.title}" has been saved successfully.`,
        });
      } else {
        await createPromotion(payload);
        toast({
          title: "Promotion created",
          description: `"${payload.title}" has been created successfully.`,
        });
      }

      resetForm();
      await loadPromotions();
    } catch {
      toast({
        title: "Failed to save promotion",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (promotion: Promotion) => {
    try {
      await updatePromotion(promotion.id, {
        title: promotion.title,
        description: promotion.description,
        startDate: promotion.startDate,
        endDate: promotion.endDate,
        discountPercent: promotion.discountPercent,
        roomTypes: promotion.roomTypes,
        isActive: !promotion.isActive,
      });

      toast({
        title: "Promotion updated",
        description: `"${promotion.title}" is now ${promotion.isActive ? "hidden" : "active"}.`,
      });
      await loadPromotions();
    } catch {
      toast({
        title: "Failed to save promotion",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (promotion: Promotion) => {
    try {
      await deletePromotion(promotion.id);
      toast({
        title: "Promotion deleted",
        description: `"${promotion.title}" has been removed.`,
      });
      await loadPromotions();
    } catch {
      toast({
        title: "Failed to save promotion",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const sortedPromotions = React.useMemo(() => {
    return [...promotions].sort((a, b) => {
      const aId = Number(a.id);
      const bId = Number(b.id);

      if (Number.isNaN(aId) || Number.isNaN(bId)) {
        return 0;
      }

      return bId - aId;
    });
  }, [promotions]);

  const visiblePromotions = showAllPromotions
    ? sortedPromotions
    : sortedPromotions.slice(0, DEFAULT_VISIBLE_PROMOTIONS);

  const hasMorePromotions =
    sortedPromotions.length > DEFAULT_VISIBLE_PROMOTIONS;

  const handleExport = async (formatType: "csv" | "pdf") => {
    const now = new Date();
    const from = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 90,
    );
    try {
      await exportReport(
        "promotions",
        format(from, "yyyy-MM-dd"),
        format(now, "yyyy-MM-dd"),
        formatType,
      );
      toast({ title: `Promotions ${formatType.toUpperCase()} exported` });
    } catch {
      toast({
        title: "Export failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        title="Promotions"
        breadcrumbs={[{ label: "Promotions" }]}
      />

      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Card className="border-primary/30">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="size-5 text-primary" />
                    {editingPromotion
                      ? "Edit Promotion"
                      : "Create New Promotion"}
                  </CardTitle>
                  <CardDescription>
                    {isFormExpanded
                      ? `Fill in the details to ${
                          editingPromotion ? "update" : "create"
                        } a promotion`
                      : "Form is collapsed. Open it when you want to create a promotion."}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFormExpanded((current) => !current)}
                >
                  {isFormExpanded ? (
                    <>
                      <ChevronUp className="mr-2 size-4" />
                      Collapse
                    </>
                  ) : (
                    <>
                      <ChevronDown className="mr-2 size-4" />
                      Add New Promotion
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>

            {isFormExpanded ? (
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formState.title}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Weekend Special"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formState.description}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="Describe your promotion..."
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formState.startDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 size-4" />
                          {formState.startDate
                            ? format(formState.startDate, "PPP")
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formState.startDate}
                          onSelect={(date) =>
                            setFormState((current) => ({
                              ...current,
                              startDate: date,
                            }))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formState.endDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 size-4" />
                          {formState.endDate
                            ? format(formState.endDate, "PPP")
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formState.endDate}
                          onSelect={(date) =>
                            setFormState((current) => ({
                              ...current,
                              endDate: date,
                            }))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Discount Percentage</Label>
                    <span className="text-lg font-bold text-primary">
                      {formState.discountPercent}%
                    </span>
                  </div>
                  <Slider
                    value={[formState.discountPercent]}
                    onValueChange={([value]) =>
                      setFormState((current) => ({
                        ...current,
                        discountPercent: value,
                      }))
                    }
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Room Types</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {ROOM_TYPE_OPTIONS.map((roomType) => (
                      <div
                        key={roomType.value}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={roomType.value}
                          checked={formState.roomTypes.includes(roomType.value)}
                          onCheckedChange={(checked) =>
                            handleRoomTypeChange(
                              roomType.value,
                              checked === true,
                            )
                          }
                        />
                        <Label htmlFor={roomType.value} className="font-normal">
                          {roomType.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <Label htmlFor="promotion-active">Active</Label>
                    <p className="text-xs text-muted-foreground">
                      Visible to guests
                    </p>
                  </div>
                  <Switch
                    id="promotion-active"
                    checked={formState.isActive}
                    onCheckedChange={(checked) =>
                      setFormState((current) => ({
                        ...current,
                        isActive: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => void handleSave()}
                    disabled={isSaving}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    {isSaving
                      ? "Saving..."
                      : editingPromotion
                        ? "Update Promotion"
                        : "Create Promotion"}
                  </Button>
                  {editingPromotion && (
                    <Button
                      variant="outline"
                      onClick={resetForm}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            ) : null}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="size-5 text-primary" />
                Guest View Preview
              </CardTitle>
              <CardDescription>
                How guests will see this promotion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-4">
                <Badge className="mb-3 bg-primary text-primary-foreground">
                  Special Offer
                </Badge>
                <h3 className="mb-2 text-lg font-semibold">
                  {formState.title || "Your Promotion Title"}
                </h3>
                <p className="mb-3 text-sm text-muted-foreground">
                  {formState.description ||
                    "Promotion description will appear here..."}
                </p>
                {formState.startDate && formState.endDate && (
                  <p className="mb-2 text-xs text-muted-foreground">
                    {formatDateRange(formState.startDate, formState.endDate)}
                  </p>
                )}
                <span className="text-2xl font-bold text-primary">
                  {formState.discountPercent}% OFF
                </span>
                {formState.roomTypes.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {formState.roomTypes.map((type) => (
                      <Badge key={type} variant="outline" className="text-xs">
                        {formatRoomType(type)}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Existing Promotions</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleExport("csv")}
              >
                <Download className="mr-1 size-3" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleExport("pdf")}
              >
                <Download className="mr-1 size-3" />
                Export PDF
              </Button>
              {hasMorePromotions && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllPromotions((current) => !current)}
                >
                  {showAllPromotions
                    ? "Show recent only"
                    : `Show more (${sortedPromotions.length - DEFAULT_VISIBLE_PROMOTIONS} more)`}
                </Button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-lg border border-border px-4 py-8 text-sm text-muted-foreground">
              Loading promotions...
            </div>
          ) : sortedPromotions.length === 0 ? (
            <div className="rounded-lg border border-border px-4 py-8 text-sm text-muted-foreground">
              No promotions found. Create one to get started.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visiblePromotions.map((promotion) => (
                <Card
                  key={promotion.id}
                  className={cn(
                    "transition-all",
                    promotion.isActive
                      ? "border-primary/30"
                      : "border-border opacity-60",
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-base">
                          {promotion.title}
                        </CardTitle>
                        <CardDescription className="mt-1 line-clamp-2">
                          {promotion.description}
                        </CardDescription>
                      </div>
                      <Switch
                        checked={promotion.isActive}
                        onCheckedChange={() =>
                          void handleToggleActive(promotion)
                        }
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Discount</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          promotion.isActive
                            ? "border-primary text-primary"
                            : "border-muted-foreground",
                        )}
                      >
                        {promotion.discountPercent}% OFF
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Period</span>
                      <span className="text-xs">
                        {formatDateRange(
                          promotion.startDate,
                          promotion.endDate,
                        )}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {promotion.roomTypes.length > 0 ? (
                        promotion.roomTypes.map((type) => (
                          <Badge
                            key={type}
                            variant="secondary"
                            className="text-xs"
                          >
                            {formatRoomType(type)}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          All room types
                        </Badge>
                      )}
                    </div>

                    <Separator />

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEdit(promotion)}
                      >
                        <Pencil className="mr-1 size-3" />
                        Edit
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete Promotion?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete &quot;
                              {promotion.title}&quot;. This action cannot be
                              undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                void handleDelete(promotion);
                              }}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
