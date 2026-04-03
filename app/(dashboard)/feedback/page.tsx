"use client"

import * as React from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import {
  CalendarIcon,
  Plus,
  Star,
  TrendingUp,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

interface Feedback {
  id: string
  guestName: string
  date: Date
  rating: number
  sentiment: "positive" | "neutral" | "negative"
  comment: string
  category: string
}

const initialFeedback: Feedback[] = [
  {
    id: "1",
    guestName: "John Smith",
    date: new Date("2026-03-28"),
    rating: 5,
    sentiment: "positive",
    comment: "Absolutely wonderful stay! The staff was incredibly friendly and attentive. The room was spotless and had a beautiful view. Will definitely be coming back!",
    category: "Overall Experience",
  },
  {
    id: "2",
    guestName: "Sarah Johnson",
    date: new Date("2026-03-27"),
    rating: 4,
    sentiment: "positive",
    comment: "Great food at the restaurant. The breakfast buffet had an excellent variety. Only minor issue was the slow WiFi in the room.",
    category: "Food & Dining",
  },
  {
    id: "3",
    guestName: "Michael Chen",
    date: new Date("2026-03-26"),
    rating: 3,
    sentiment: "neutral",
    comment: "Decent stay overall. Room was clean but a bit smaller than expected. Check-in process was smooth.",
    category: "Room Quality",
  },
  {
    id: "4",
    guestName: "Emily Davis",
    date: new Date("2026-03-25"),
    rating: 5,
    sentiment: "positive",
    comment: "The spa services were exceptional! Best massage I have ever had. The staff went above and beyond to make our anniversary special.",
    category: "Spa & Wellness",
  },
  {
    id: "5",
    guestName: "Robert Wilson",
    date: new Date("2026-03-24"),
    rating: 2,
    sentiment: "negative",
    comment: "Disappointed with the pool area. It was crowded and not well maintained. Expected better for the price we paid.",
    category: "Facilities",
  },
  {
    id: "6",
    guestName: "Lisa Anderson",
    date: new Date("2026-03-23"),
    rating: 4,
    sentiment: "positive",
    comment: "Beautiful property with amazing gardens. The evening entertainment was a nice touch. Staff was very helpful.",
    category: "Overall Experience",
  },
]

const topKeywords = [
  { word: "clean", count: 45 },
  { word: "staff", count: 38 },
  { word: "food", count: 32 },
  { word: "view", count: 28 },
  { word: "friendly", count: 25 },
  { word: "comfortable", count: 22 },
  { word: "spa", count: 18 },
  { word: "pool", count: 15 },
]

export default function FeedbackPage() {
  const [feedback, setFeedback] = React.useState<Feedback[]>(initialFeedback)
  const [sentimentFilter, setSentimentFilter] = React.useState<string>("all")
  const [ratingFilter, setRatingFilter] = React.useState([1, 5])
  const [startDate, setStartDate] = React.useState<Date>()
  const [endDate, setEndDate] = React.useState<Date>()
  const [expandedId, setExpandedId] = React.useState<string | null>(null)
  const [isAddOpen, setIsAddOpen] = React.useState(false)

  // Add feedback form state
  const [newGuestName, setNewGuestName] = React.useState("")
  const [newRating, setNewRating] = React.useState(5)
  const [newComment, setNewComment] = React.useState("")
  const [newCategory, setNewCategory] = React.useState("Overall Experience")

  // Calculate summary stats
  const totalFeedback = feedback.length
  const avgRating = (feedback.reduce((acc, f) => acc + f.rating, 0) / totalFeedback).toFixed(1)
  const positivePercent = Math.round(
    (feedback.filter((f) => f.sentiment === "positive").length / totalFeedback) * 100
  )
  const negativePercent = Math.round(
    (feedback.filter((f) => f.sentiment === "negative").length / totalFeedback) * 100
  )

  // Filter feedback
  const filteredFeedback = feedback.filter((f) => {
    if (sentimentFilter !== "all" && f.sentiment !== sentimentFilter) return false
    if (f.rating < ratingFilter[0] || f.rating > ratingFilter[1]) return false
    if (startDate && f.date < startDate) return false
    if (endDate && f.date > endDate) return false
    return true
  })

  const handleAddFeedback = () => {
    if (!newGuestName || !newComment) return

    const sentiment: "positive" | "neutral" | "negative" =
      newRating >= 4 ? "positive" : newRating >= 3 ? "neutral" : "negative"

    const newFeedbackItem: Feedback = {
      id: Date.now().toString(),
      guestName: newGuestName,
      date: new Date(),
      rating: newRating,
      sentiment,
      comment: newComment,
      category: newCategory,
    }

    setFeedback((prev) => [newFeedbackItem, ...prev])
    setIsAddOpen(false)
    setNewGuestName("")
    setNewRating(5)
    setNewComment("")
    setNewCategory("Overall Experience")
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-primary/10 text-primary border-primary/30"
      case "negative":
        return "bg-destructive/10 text-destructive border-destructive/30"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={cn(
          "size-4",
          i < rating ? "fill-primary text-primary" : "text-muted-foreground"
        )}
      />
    ))
  }

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        title="Feedback Report"
        breadcrumbs={[{ label: "Feedback" }]}
      />
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="flex flex-col gap-6">
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Rating
                </CardTitle>
                <Star className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary">{avgRating}</span>
                  <span className="text-muted-foreground">/ 5</span>
                </div>
                <div className="mt-2 flex">{renderStars(Math.round(Number(avgRating)))}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Feedback
                </CardTitle>
                <MessageSquare className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalFeedback}</div>
                <p className="text-xs text-muted-foreground">All time reviews</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Positive Feedback
                </CardTitle>
                <ThumbsUp className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{positivePercent}%</div>
                <Progress value={positivePercent} className="mt-2 h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Negative Feedback
                </CardTitle>
                <ThumbsDown className="size-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-destructive">{negativePercent}%</div>
                <Progress value={negativePercent} className="mt-2 h-2 [&>div]:bg-destructive" />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            {/* Feedback List */}
            <div className="space-y-4">
              {/* Filter Bar */}
              <Card>
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-center">
                  <div className="flex items-center gap-2">
                    <Filter className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filters:</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="w-[120px] sm:w-[140px]">
                          <CalendarIcon className="mr-2 size-3" />
                          {startDate ? format(startDate, "MMM d") : "Start"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                        />
                      </PopoverContent>
                    </Popover>
                    <span className="text-muted-foreground">to</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="w-[120px] sm:w-[140px]">
                          <CalendarIcon className="mr-2 size-3" />
                          {endDate ? format(endDate, "MMM d") : "End"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Sentiment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sentiment</SelectItem>
                      <SelectItem value="positive">Positive</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="negative">Negative</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Rating:</span>
                    <Slider
                      value={ratingFilter}
                      onValueChange={setRatingFilter}
                      min={1}
                      max={5}
                      step={1}
                      className="w-[100px]"
                    />
                    <span className="text-sm font-medium">
                      {ratingFilter[0]}-{ratingFilter[1]}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSentimentFilter("all")
                      setRatingFilter([1, 5])
                      setStartDate(undefined)
                      setEndDate(undefined)
                    }}
                  >
                    Clear
                  </Button>

                  <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="ml-auto bg-primary hover:bg-primary/90">
                        <Plus className="mr-1 size-3" />
                        Add Feedback
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Guest Feedback</DialogTitle>
                        <DialogDescription>
                          Manually enter feedback from paper comments or phone calls.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Guest Name</Label>
                          <Input
                            placeholder="Enter guest name"
                            value={newGuestName}
                            onChange={(e) => setNewGuestName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Rating</Label>
                          <div className="flex items-center gap-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setNewRating(i + 1)}
                                className="transition-transform hover:scale-110"
                              >
                                <Star
                                  className={cn(
                                    "size-6",
                                    i < newRating
                                      ? "fill-primary text-primary"
                                      : "text-muted-foreground"
                                  )}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select value={newCategory} onValueChange={setNewCategory}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Overall Experience">Overall Experience</SelectItem>
                              <SelectItem value="Room Quality">Room Quality</SelectItem>
                              <SelectItem value="Food & Dining">Food & Dining</SelectItem>
                              <SelectItem value="Spa & Wellness">Spa & Wellness</SelectItem>
                              <SelectItem value="Facilities">Facilities</SelectItem>
                              <SelectItem value="Staff Service">Staff Service</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Comment</Label>
                          <Textarea
                            placeholder="Enter guest feedback..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows={4}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddFeedback} className="bg-primary">
                          Add Feedback
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              {/* Feedback Items */}
              <ScrollArea className="h-[500px]">
                <div className="space-y-3 pr-4">
                  {filteredFeedback.map((item) => (
                    <Card
                      key={item.id}
                      className="cursor-pointer transition-all hover:border-primary/30"
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="font-medium">{item.guestName}</span>
                              <Badge
                                variant="outline"
                                className={getSentimentColor(item.sentiment)}
                              >
                                {item.sentiment}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {item.category}
                              </Badge>
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{format(item.date, "MMM d, yyyy")}</span>
                              <span className="flex">{renderStars(item.rating)}</span>
                            </div>
                          </div>
                          {expandedId === item.id ? (
                            <ChevronUp className="size-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="size-4 text-muted-foreground" />
                          )}
                        </div>
                        <p
                          className={cn(
                            "mt-3 text-sm text-muted-foreground transition-all",
                            expandedId === item.id ? "" : "line-clamp-2"
                          )}
                        >
                          {item.comment}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Keywords Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Keywords</CardTitle>
                <CardDescription>Most mentioned terms in feedback</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topKeywords.map((keyword, index) => (
                    <div key={keyword.word} className="flex items-center gap-3">
                      <span className="w-6 text-sm font-medium text-muted-foreground">
                        {index + 1}.
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{keyword.word}</span>
                          <span className="text-sm text-muted-foreground">
                            {keyword.count}
                          </span>
                        </div>
                        <Progress
                          value={(keyword.count / topKeywords[0].count) * 100}
                          className="mt-1 h-1.5"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
