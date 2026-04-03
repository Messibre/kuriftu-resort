"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  CalendarIcon,
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
  MessageSquare,
  Plus,
  Star,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";

import { DashboardHeader } from "@/components/dashboard-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  createFeedback,
  getFeedback,
  type FeedbackItem,
  type FeedbackSentiment,
  type FeedbackSource,
} from "@/lib/feedback-api";
import { exportReport } from "@/lib/export-api";
import { useToast } from "@/hooks/use-toast";

const STOP_WORDS = new Set([
  "the",
  "and",
  "was",
  "were",
  "with",
  "this",
  "that",
  "have",
  "from",
  "very",
  "will",
  "would",
  "again",
  "been",
  "for",
  "our",
  "your",
  "had",
  "but",
  "not",
  "all",
  "you",
  "they",
  "are",
]);

function getSentimentColor(sentiment: FeedbackSentiment): string {
  switch (sentiment) {
    case "positive":
      return "bg-primary/10 text-primary border-primary/30";
    case "negative":
      return "bg-destructive/10 text-destructive border-destructive/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function detectSentimentFromRating(rating: number): FeedbackSentiment {
  if (rating >= 4) return "positive";
  if (rating >= 3) return "neutral";
  return "negative";
}

function renderStars(rating: number) {
  return Array.from({ length: 5 }).map((_, i) => (
    <Star
      key={i}
      className={cn(
        "size-4",
        i < rating ? "fill-primary text-primary" : "text-muted-foreground",
      )}
    />
  ));
}

function buildTopKeywords(feedback: FeedbackItem[]) {
  const counts = new Map<string, number>();

  for (const item of feedback) {
    const words = item.comment
      .toLowerCase()
      .replace(/[^a-z\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !STOP_WORDS.has(word));

    for (const word of words) {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word, count]) => ({ word, count }));
}

export default function FeedbackPage() {
  const [feedback, setFeedback] = React.useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const [sentimentFilter, setSentimentFilter] = React.useState<
    "all" | FeedbackSentiment
  >("all");
  const [startDate, setStartDate] = React.useState<Date>();
  const [endDate, setEndDate] = React.useState<Date>();
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isAdding, setIsAdding] = React.useState(false);
  const [newGuestName, setNewGuestName] = React.useState("");
  const [newDate, setNewDate] = React.useState<Date>(new Date());
  const [newRating, setNewRating] = React.useState(5);
  const [newComment, setNewComment] = React.useState("");
  const [newSentiment, setNewSentiment] =
    React.useState<FeedbackSentiment>("positive");
  const [newSource, setNewSource] = React.useState<FeedbackSource>("admin");

  const { toast } = useToast();

  const loadFeedback = React.useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await getFeedback({
        sentiment: sentimentFilter === "all" ? undefined : sentimentFilter,
        startDate,
        endDate,
      });
      setFeedback(data);
    } catch {
      toast({
        title: "Failed to load feedback. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [endDate, sentimentFilter, startDate, toast]);

  React.useEffect(() => {
    void loadFeedback();
  }, [loadFeedback]);

  const totalFeedback = feedback.length;
  const avgRating = totalFeedback
    ? (
        feedback.reduce((acc, item) => acc + item.rating, 0) / totalFeedback
      ).toFixed(1)
    : "0.0";
  const positivePercent = totalFeedback
    ? Math.round(
        (feedback.filter((item) => item.sentiment === "positive").length /
          totalFeedback) *
          100,
      )
    : 0;
  const negativePercent = totalFeedback
    ? Math.round(
        (feedback.filter((item) => item.sentiment === "negative").length /
          totalFeedback) *
          100,
      )
    : 0;
  const topKeywords = React.useMemo(
    () => buildTopKeywords(feedback),
    [feedback],
  );

  const handleAddFeedback = async () => {
    if (!newComment.trim()) {
      return;
    }

    setIsAdding(true);

    try {
      await createFeedback({
        date: newDate,
        guestName: newGuestName,
        rating: newRating,
        comment: newComment.trim(),
        sentiment: newSentiment,
        source: newSource,
      });

      setIsAddOpen(false);
      setNewGuestName("");
      setNewDate(new Date());
      setNewRating(5);
      setNewComment("");
      setNewSentiment("positive");
      setNewSource("admin");

      await loadFeedback();
    } catch {
      toast({
        title:
          "Failed to save feedback. Please check all fields and try again.",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleExport = async (formatType: "csv" | "pdf") => {
    const now = new Date();
    const from =
      startDate ??
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
    const to = endDate ?? now;

    try {
      await exportReport(
        "feedback",
        format(from, "yyyy-MM-dd"),
        format(to, "yyyy-MM-dd"),
        formatType,
      );
      toast({
        title: "Export started",
        description: `Feedback report (${formatType.toUpperCase()}) downloaded.`,
      });
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
        title="Feedback Report"
        breadcrumbs={[{ label: "Feedback" }]}
      />
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="flex flex-col gap-6">
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
                  <span className="text-3xl font-bold text-primary">
                    {avgRating}
                  </span>
                  <span className="text-muted-foreground">/ 5</span>
                </div>
                <div className="mt-2 flex">
                  {renderStars(Math.round(Number(avgRating)))}
                </div>
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
                <p className="text-xs text-muted-foreground">
                  All time reviews
                </p>
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
                <div className="text-3xl font-bold text-primary">
                  {positivePercent}%
                </div>
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
                <div className="text-3xl font-bold text-destructive">
                  {negativePercent}%
                </div>
                <Progress
                  value={negativePercent}
                  className="mt-2 h-2 [&>div]:bg-destructive"
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <div className="space-y-4">
              <Card>
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-center">
                  <div className="flex items-center gap-2">
                    <Filter className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filters:</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-[120px] sm:w-[140px]"
                        >
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
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-[120px] sm:w-[140px]"
                        >
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

                  <Select
                    value={sentimentFilter}
                    onValueChange={(value) =>
                      setSentimentFilter(value as "all" | FeedbackSentiment)
                    }
                  >
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

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSentimentFilter("all");
                      setStartDate(undefined);
                      setEndDate(undefined);
                    }}
                  >
                    Clear
                  </Button>

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

                  <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        className="ml-auto bg-primary hover:bg-primary/90"
                      >
                        <Plus className="mr-1 size-3" />
                        Add Feedback
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Guest Feedback</DialogTitle>
                        <DialogDescription>
                          Manually enter feedback from paper comments or phone
                          calls.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Guest Name</Label>
                          <Input
                            placeholder="Enter guest name"
                            value={newGuestName}
                            onChange={(event) =>
                              setNewGuestName(event.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                <CalendarIcon className="mr-2 size-4" />
                                {format(newDate, "PPP")}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={newDate}
                                onSelect={(date) => date && setNewDate(date)}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2">
                          <Label>Rating</Label>
                          <div className="flex items-center gap-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => {
                                  const rating = i + 1;
                                  setNewRating(rating);
                                  setNewSentiment(
                                    detectSentimentFromRating(rating),
                                  );
                                }}
                                className="transition-transform hover:scale-110"
                              >
                                <Star
                                  className={cn(
                                    "size-6",
                                    i < newRating
                                      ? "fill-primary text-primary"
                                      : "text-muted-foreground",
                                  )}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>Sentiment</Label>
                            <Select
                              value={newSentiment}
                              onValueChange={(value) =>
                                setNewSentiment(value as FeedbackSentiment)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="positive">
                                  Positive
                                </SelectItem>
                                <SelectItem value="neutral">Neutral</SelectItem>
                                <SelectItem value="negative">
                                  Negative
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Source</Label>
                            <Select
                              value={newSource}
                              onValueChange={(value) =>
                                setNewSource(value as FeedbackSource)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="survey">Survey</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Comment</Label>
                          <Textarea
                            placeholder="Enter guest feedback..."
                            value={newComment}
                            onChange={(event) =>
                              setNewComment(event.target.value)
                            }
                            rows={4}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsAddOpen(false)}
                          disabled={isAdding}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => void handleAddFeedback()}
                          className="bg-primary"
                          disabled={isAdding}
                        >
                          {isAdding ? "Saving..." : "Add Feedback"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              <ScrollArea className="h-[500px]">
                <div className="space-y-3 pr-4">
                  {isLoading ? (
                    <Card>
                      <CardContent className="p-4 text-sm text-muted-foreground">
                        Loading feedback...
                      </CardContent>
                    </Card>
                  ) : feedback.length === 0 ? (
                    <Card>
                      <CardContent className="p-4 text-sm text-muted-foreground">
                        No feedback found.
                      </CardContent>
                    </Card>
                  ) : (
                    feedback.map((item) => (
                      <Card
                        key={item.id}
                        className="cursor-pointer transition-all hover:border-primary/30"
                        onClick={() =>
                          setExpandedId(expandedId === item.id ? null : item.id)
                        }
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <span className="font-medium">
                                  {item.guestName}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={getSentimentColor(item.sentiment)}
                                >
                                  {item.sentiment}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {item.source}
                                </Badge>
                              </div>
                              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{format(item.date, "MMM d, yyyy")}</span>
                                <span className="flex">
                                  {renderStars(item.rating)}
                                </span>
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
                              expandedId === item.id ? "" : "line-clamp-2",
                            )}
                          >
                            {item.comment}
                          </p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Keywords</CardTitle>
                <CardDescription>
                  Most mentioned terms in feedback
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topKeywords.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No keyword data available.
                    </p>
                  ) : (
                    topKeywords.map((keyword, index) => (
                      <div
                        key={keyword.word}
                        className="flex items-center gap-3"
                      >
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
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
