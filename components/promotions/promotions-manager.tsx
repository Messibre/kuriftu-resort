"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, Pencil, Plus, Trash2 } from "lucide-react";

import { DashboardHeader } from "@/components/dashboard-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  createPromotion,
  deletePromotion,
  getPromotions,
  type Promotion,
  type PromotionRoomType,
  updatePromotion,
} from "@/lib/promotions-api";

const ROOM_TYPE_OPTIONS: { value: PromotionRoomType; label: string }[] = [
  { value: "standard", label: "Standard" },
  { value: "deluxe", label: "Deluxe" },
  { value: "suite", label: "Suite" },
];

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
  return `${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")}`;
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
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingPromotion, setEditingPromotion] =
    React.useState<Promotion | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Promotion | null>(
    null,
  );
  const [formState, setFormState] =
    React.useState<PromotionFormState>(defaultFormState);
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

  const openCreateDialog = () => {
    setEditingPromotion(null);
    setFormState(defaultFormState);
    setDialogOpen(true);
  };

  const openEditDialog = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setFormState(buildFormState(promotion));
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingPromotion(null);
    setFormState(defaultFormState);
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

      closeDialog();
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

  const handleDelete = async (promotion: Promotion) => {
    try {
      await deletePromotion(promotion.id);
      toast({
        title: "Promotion deleted",
        description: `"${promotion.title}" has been removed.`,
      });
      setDeleteTarget(null);
      await loadPromotions();
    } catch {
      toast({
        title: "Failed to save promotion",
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
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Promotions
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage offers and packages for the resort.
              </p>
            </div>
            <Button
              onClick={openCreateDialog}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="mr-2 size-4" />
              Create New Promotion
            </Button>
          </div>

          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-medium">Promotion List</h2>
              <p className="text-sm text-muted-foreground">
                Loaded from the live admin API.
              </p>
            </div>

            {isLoading ? (
              <div className="px-4 py-8 text-sm text-muted-foreground">
                Loading promotions...
              </div>
            ) : promotions.length === 0 ? (
              <div className="px-4 py-8 text-sm text-muted-foreground">
                No promotions found. Create one to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Date Range</TableHead>
                    <TableHead>Discount %</TableHead>
                    <TableHead>Room Types</TableHead>
                    <TableHead>Active Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promotions.map((promotion) => (
                    <TableRow key={promotion.id}>
                      <TableCell className="font-medium whitespace-normal">
                        {promotion.title}
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        {formatDateRange(
                          promotion.startDate,
                          promotion.endDate,
                        )}
                      </TableCell>
                      <TableCell>{promotion.discountPercent}%</TableCell>
                      <TableCell className="whitespace-normal">
                        <div className="flex flex-wrap gap-1">
                          {promotion.roomTypes.map((roomType) => (
                            <Badge key={roomType} variant="secondary">
                              {formatRoomType(roomType)}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={promotion.isActive ? "default" : "secondary"}
                          className={cn(
                            promotion.isActive
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {promotion.isActive ? "Active" : "Hidden"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(promotion)}
                          >
                            <Pencil className="mr-2 size-3.5" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => setDeleteTarget(promotion)}
                          >
                            <Trash2 className="size-3.5" />
                            <span className="sr-only">Delete promotion</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPromotion ? "Edit Promotion" : "Create New Promotion"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
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
                rows={4}
                placeholder="Describe the offer..."
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
                <span className="text-sm font-semibold text-primary">
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
              <div className="grid gap-3 sm:grid-cols-3">
                {ROOM_TYPE_OPTIONS.map((roomType) => (
                  <div key={roomType.value} className="flex items-center gap-2">
                    <Checkbox
                      id={roomType.value}
                      checked={formState.roomTypes.includes(roomType.value)}
                      onCheckedChange={(checked) =>
                        handleRoomTypeChange(roomType.value, checked === true)
                      }
                    />
                    <Label htmlFor={roomType.value} className="font-normal">
                      {roomType.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is-active">Active</Label>
                <p className="text-sm text-muted-foreground">
                  Controls whether this promotion is visible to guests.
                </p>
              </div>
              <Switch
                id="is-active"
                checked={formState.isActive}
                onCheckedChange={(checked) =>
                  setFormState((current) => ({ ...current, isActive: checked }))
                }
              />
            </div>

            <div className="flex gap-2 pt-2">
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
              <Button
                variant="outline"
                onClick={closeDialog}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promotion?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTarget?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  void handleDelete(deleteTarget);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
