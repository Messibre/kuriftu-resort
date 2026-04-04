"use client";

import * as React from "react";
import { Bot, Send, Wifi, WifiOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useChatWebSocket } from "@/hooks/use-chat-websocket";
import { cn } from "@/lib/utils";

interface AIChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

const starterQuestions = [
  "What is the occupancy forecast for next week?",
  "Show me housekeeping staff availability.",
  "Any negative feedback in the last 7 days?",
  "What active promotions are running now?",
];

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AIChatbot({ isOpen, onClose }: AIChatbotProps) {
  const {
    messages,
    isConnected,
    isSending,
    sendMessage,
    connect,
    clearMessages,
  } = useChatWebSocket();

  const [input, setInput] = React.useState("");
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending, isOpen]);

  React.useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      if (!isConnected) {
        connect();
      }
    }
  }, [connect, isConnected, isOpen]);

  const handleSend = React.useCallback(() => {
    const content = input.trim();
    if (!content || !isConnected) {
      return;
    }

    sendMessage(content);
    setInput("");
  }, [input, isConnected, sendMessage]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-24 right-4 z-50 flex h-[500px] w-[384px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl overscroll-contain sm:right-6">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "size-2 rounded-full",
              isConnected ? "bg-emerald-500" : "bg-red-500",
            )}
          />
          <Bot className="size-4 text-primary" />
          <h3 className="text-sm font-semibold">Ethio-Habesha AI Assistant</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={clearMessages}
          >
            Clear
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={onClose}
          >
            <X className="size-4" />
            <span className="sr-only">Close chat</span>
          </Button>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-3 py-4">
        <div className="flex flex-col gap-3">
          {messages.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 text-sm">
              <p className="font-medium">Welcome. Try asking:</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Answers are generated from your resort data when available.
              </p>
              <div className="mt-2 flex flex-col gap-2">
                {starterQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    className="rounded-md border border-border px-2 py-1 text-left text-xs hover:bg-muted"
                    onClick={() => setInput(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-background",
                )}
              >
                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                {message.role === "assistant" ? (
                  <div className="mt-1 flex items-center gap-2">
                    {message.isFallback ? (
                      <Badge
                        variant="destructive"
                        className="h-5 px-1.5 text-[10px]"
                      >
                        Backend fallback
                      </Badge>
                    ) : null}
                    {message.isGrounded === true ? (
                      <Badge
                        variant="secondary"
                        className="h-5 px-1.5 text-[10px]"
                      >
                        Data grounded
                      </Badge>
                    ) : null}
                    {message.sourceTables && message.sourceTables.length > 0 ? (
                      <span className="text-[10px] text-muted-foreground">
                        Sources: {message.sourceTables.join(", ")}
                      </span>
                    ) : null}
                  </div>
                ) : null}
                <p
                  className={cn(
                    "mt-1 text-[10px]",
                    message.role === "user"
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground",
                  )}
                >
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {isSending ? (
            <div className="flex justify-start">
              <div className="rounded-lg border border-border bg-background px-3 py-2">
                <span className="flex items-center gap-1">
                  <span className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                  <span className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                  <span className="size-2 animate-bounce rounded-full bg-muted-foreground" />
                </span>
              </div>
            </div>
          ) : null}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about occupancy, staff, schedule, feedback, pricing..."
            className="min-h-[42px] max-h-24 resize-none"
          />
          <Button
            onClick={handleSend}
            size="icon"
            disabled={!isConnected || input.trim().length === 0}
          >
            <Send className="size-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {isConnected
              ? "Connected to live assistant"
              : "Disconnected from assistant"}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">
              Questions are sent live to the backend over WebSocket.
            </span>
            {!isConnected ? (
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-[10px]"
                onClick={connect}
              >
                Reconnect
              </Button>
            ) : null}
            <Badge variant="outline" className="gap-1 text-[10px]">
              {isConnected ? (
                <Wifi className="size-3" />
              ) : (
                <WifiOff className="size-3" />
              )}
              {isConnected ? "Live" : "Offline"}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
