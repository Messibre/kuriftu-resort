"use client"

import * as React from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
} from "@/components/ui/alert-dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, Pencil, Trash2, Plus, Eye } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"

interface Promotion {
  id: string
  title: string
  description: string
  startDate: Date
  endDate: Date
  discount: number
  roomTypes: string[]
  isActive: boolean
}

const initialPromotions: Promotion[] = [
  {
    id: "1",
    title: "Summer Escape Deal",
    description: "Enjoy 20% off on all room bookings this summer season",
    startDate: new Date("2026-06-01"),
    endDate: new Date("2026-08-31"),
    discount: 20,
    roomTypes: ["Standard", "Deluxe"],
    isActive: true,
  },
  {
    id: "2",
    title: "Weekend Getaway",
    description: "Special weekend rates for couples",
    startDate: new Date("2026-04-01"),
    endDate: new Date("2026-05-31"),
    discount: 15,
    roomTypes: ["Suite"],
    isActive: true,
  },
  {
    id: "3",
    title: "Early Bird Discount",
    description: "Book 30 days in advance and save",
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
    discount: 10,
    roomTypes: ["Standard", "Deluxe", "Suite", "Villa"],
    isActive: false,
  },
]

const roomTypes = ["Standard", "Deluxe", "Suite", "Villa"]

export default function PromotionsPage() {
  const [promotions, setPromotions] = React.useState<Promotion[]>(initialPromotions)
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editingPromotion, setEditingPromotion] = React.useState<Promotion | null>(null)

  // Form state
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [startDate, setStartDate] = React.useState<Date>()
  const [endDate, setEndDate] = React.useState<Date>()
  const [discount, setDiscount] = React.useState([15])
  const [selectedRoomTypes, setSelectedRoomTypes] = React.useState<string[]>([])

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setStartDate(undefined)
    setEndDate(undefined)
    setDiscount([15])
    setSelectedRoomTypes([])
    setEditingPromotion(null)
  }

  const handleCreate = () => {
    if (!title || !startDate || !endDate) return

    const newPromotion: Promotion = {
      id: Date.now().toString(),
      title,
      description,
      startDate,
      endDate,
      discount: discount[0],
      roomTypes: selectedRoomTypes,
      isActive: true,
    }

    setPromotions((prev) => [...prev, newPromotion])
    setIsCreateOpen(false)
    resetForm()
    toast({
      title: "Promotion created",
      description: `"${newPromotion.title}" has been created successfully.`,
    })
  }

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion)
    setTitle(promotion.title)
    setDescription(promotion.description)
    setStartDate(promotion.startDate)
    setEndDate(promotion.endDate)
    setDiscount([promotion.discount])
    setSelectedRoomTypes(promotion.roomTypes)
    setIsCreateOpen(true)
  }

  const handleUpdate = () => {
    if (!editingPromotion || !title || !startDate || !endDate) return

    setPromotions((prev) =>
      prev.map((p) =>
        p.id === editingPromotion.id
          ? {
              ...p,
              title,
              description,
              startDate,
              endDate,
              discount: discount[0],
              roomTypes: selectedRoomTypes,
            }
          : p
      )
    )
    setIsCreateOpen(false)
    resetForm()
    toast({
      title: "Promotion updated",
      description: "Your changes have been saved.",
    })
  }

  const handleDelete = (id: string) => {
    const deletedPromotion = promotions.find((p) => p.id === id)
    setPromotions((prev) => prev.filter((p) => p.id !== id))
    toast({
      variant: "destructive",
      title: "Promotion deleted",
      description: deletedPromotion ? `"${deletedPromotion.title}" has been removed.` : "Promotion has been removed.",
      action: (
        <ToastAction
          altText="Undo"
          onClick={() => {
            if (deletedPromotion) {
              setPromotions((prev) => [...prev, deletedPromotion])
            }
          }}
        >
          Undo
        </ToastAction>
      ),
    })
  }

  const toggleActive = (id: string) => {
    setPromotions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p))
    )
  }

  const handleRoomTypeChange = (roomType: string, checked: boolean) => {
    setSelectedRoomTypes((prev) =>
      checked ? [...prev, roomType] : prev.filter((rt) => rt !== roomType)
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        title="Promotions"
        breadcrumbs={[{ label: "Promotions" }]}
      />
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Create/Edit Form */}
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="size-5 text-primary" />
                {editingPromotion ? "Edit Promotion" : "Create New Promotion"}
              </CardTitle>
              <CardDescription>
                Fill in the details to {editingPromotion ? "update" : "create"} a promotion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Summer Special"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your promotion..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
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
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 size-4" />
                        {startDate ? format(startDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
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
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 size-4" />
                        {endDate ? format(endDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Discount Percentage</Label>
                  <span className="text-lg font-bold text-primary">{discount[0]}%</span>
                </div>
                <Slider
                  value={discount}
                  onValueChange={setDiscount}
                  max={50}
                  min={5}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <Label>Room Types</Label>
                <div className="grid grid-cols-2 gap-3">
                  {roomTypes.map((roomType) => (
                    <div key={roomType} className="flex items-center space-x-2">
                      <Checkbox
                        id={roomType}
                        checked={selectedRoomTypes.includes(roomType)}
                        onCheckedChange={(checked) =>
                          handleRoomTypeChange(roomType, checked as boolean)
                        }
                      />
                      <Label htmlFor={roomType} className="font-normal">
                        {roomType}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={editingPromotion ? handleUpdate : handleCreate}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {editingPromotion ? "Update Promotion" : "Create Promotion"}
                </Button>
                {editingPromotion && (
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Preview Card */}
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
                  {title || "Your Promotion Title"}
                </h3>
                <p className="mb-3 text-sm text-muted-foreground">
                  {description || "Promotion description will appear here..."}
                </p>
                {startDate && endDate && (
                  <p className="mb-2 text-xs text-muted-foreground">
                    {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary">
                    {discount[0]}% OFF
                  </span>
                </div>
                {selectedRoomTypes.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {selectedRoomTypes.map((type) => (
                      <Badge key={type} variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Existing Promotions */}
        <div className="mt-6">
          <h2 className="mb-4 text-lg font-semibold">Existing Promotions</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {promotions.map((promotion) => (
              <Card
                key={promotion.id}
                className={cn(
                  "transition-all",
                  promotion.isActive
                    ? "border-primary/30"
                    : "border-border opacity-60"
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{promotion.title}</CardTitle>
                      <CardDescription className="mt-1 line-clamp-2">
                        {promotion.description}
                      </CardDescription>
                    </div>
                    <Switch
                      checked={promotion.isActive}
                      onCheckedChange={() => toggleActive(promotion.id)}
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
                          : "border-muted-foreground"
                      )}
                    >
                      {promotion.discount}% OFF
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Period</span>
                    <span className="text-xs">
                      {format(promotion.startDate, "MMM d")} -{" "}
                      {format(promotion.endDate, "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {promotion.roomTypes.map((type) => (
                      <Badge key={type} variant="secondary" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                  <Separator />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(promotion)}
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
                          <AlertDialogTitle>Delete Promotion?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete &quot;{promotion.title}&quot;.
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(promotion.id)}
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
        </div>
      </main>
    </div>
  )
}
