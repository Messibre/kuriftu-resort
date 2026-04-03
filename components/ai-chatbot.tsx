"use client"

import * as React from "react"
import { MessageCircle, X, Send, Check, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isSuccess?: boolean
}

const suggestedQuestions = [
  "What is the forecast for next weekend?",
  "Show staffing recommendations for today.",
  "Create a 10% promotion for next week.",
  "Set price for Dec 25 to 6000 ETB.",
]

const responses: Record<string, { content: string; isSuccess?: boolean }> = {
  forecast: {
    content: "Based on current trends, I predict 78% occupancy for next weekend. This is 5% higher than last weekend. Would you like me to adjust staffing recommendations?",
  },
  staffing: {
    content: "For today, I recommend:\n- Front desk: 3 staff (peak hours)\n- Housekeeping: 8 staff\n- Restaurant: 5 staff\n\nShall I create the schedule?",
  },
  promotion: {
    content: "Done! I've created a 10% promotion for next week. The promotion is now active and will be displayed to guests.",
    isSuccess: true,
  },
  price: {
    content: "Override set for Dec 25 - new price: 6,000 ETB. This represents a 15% increase from the current rate.",
    isSuccess: true,
  },
}

const defaultResponse = {
  content: "I can help you with forecasts, staffing, promotions, and pricing. What would you like to know?",
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hello! I'm ResortAI, your admin assistant. How can I help you today?",
    timestamp: new Date(),
  },
]

export function AIChatbot() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [messages, setMessages] = React.useState<Message[]>(initialMessages)
  const [input, setInput] = React.useState("")
  const [isTyping, setIsTyping] = React.useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleSend = React.useCallback(() => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    const currentInput = input.toLowerCase()
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    // Simulate AI response
    const timeoutId = setTimeout(() => {
      let response = defaultResponse

      if (currentInput.includes("forecast")) response = responses.forecast
      else if (currentInput.includes("staff")) response = responses.staffing
      else if (currentInput.includes("promotion")) response = responses.promotion
      else if (currentInput.includes("price")) response = responses.price

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.content,
        timestamp: new Date(),
        isSuccess: response.isSuccess,
      }

      setMessages((prev) => [...prev, assistantMessage])
      setIsTyping(false)
    }, 800)

    return () => clearTimeout(timeoutId)
  }, [input])

  const handleSuggestedQuestion = React.useCallback((question: string) => {
    setInput(question)
    inputRef.current?.focus()
  }, [])

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  // Focus input when chat opens
  React.useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-4 right-4 z-50 size-12 rounded-full shadow-lg transition-all sm:bottom-6 sm:right-6 sm:size-14",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          isOpen && "rotate-90"
        )}
        size="icon"
      >
        {isOpen ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 left-4 z-50 flex h-[70vh] max-h-[500px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl sm:left-auto sm:right-6 sm:w-[380px]">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-border bg-primary px-4 py-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary-foreground/20">
              <Sparkles className="size-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-primary-foreground">ResortAI</h3>
              <p className="text-xs text-primary-foreground/70">Your Admin Assistant</p>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="flex flex-col gap-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "border border-primary/20 bg-card"
                    )}
                  >
                    {message.isSuccess && (
                      <span className="mr-2 inline-flex items-center gap-1 text-primary">
                        <Check className="size-3" />
                      </span>
                    )}
                    <span className="whitespace-pre-wrap">{message.content}</span>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="rounded-lg border border-primary/20 bg-card px-3 py-2 text-sm">
                    <span className="flex items-center gap-1">
                      <span className="size-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                      <span className="size-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                      <span className="size-2 animate-bounce rounded-full bg-primary" />
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Suggested Questions */}
          <div className="flex flex-wrap gap-2 border-t border-border bg-muted/50 px-3 py-2">
            {suggestedQuestions.map((question) => (
              <Badge
                key={question}
                variant="outline"
                className="cursor-pointer border-primary/30 text-xs hover:bg-primary/10"
                onClick={() => handleSuggestedQuestion(question)}
              >
                {question.length > 25 ? question.substring(0, 25) + "..." : question}
              </Badge>
            ))}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-border bg-card p-3">
            <Input
              ref={inputRef}
              placeholder="Ask ResortAI anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 border-primary/30 focus-visible:ring-primary"
              aria-label="Chat message input"
            />
            <Button
              onClick={handleSend}
              size="icon"
              className="bg-primary hover:bg-primary/90"
              disabled={!input.trim()}
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
