"use client";

import * as React from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sourceTables?: string[];
  isGrounded?: boolean;
}

interface ServerIncomingMessage {
  role?: "assistant" | "user";
  content?: string;
  message?: string;
  text?: string;
  session_id?: string;
  source_tables?: string[];
  sources?: string[];
  grounded?: boolean;
}

interface UseChatWebSocketResult {
  messages: ChatMessage[];
  isConnected: boolean;
  isSending: boolean;
  sessionId: string;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (input: string) => void;
  clearMessages: () => void;
}

const SESSION_STORAGE_KEY = "chatbot-session-id";
const MESSAGES_STORAGE_PREFIX = "chatbot-messages";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function resolveWsBaseUrl(): string {
  const envBase = process.env.NEXT_PUBLIC_WS_URL;

  if (envBase && envBase.trim().length > 0) {
    const sanitized = envBase.trim().replace(/\/$/, "");
    if (sanitized.startsWith("https://")) {
      return `wss://${sanitized.slice("https://".length)}`;
    }
    if (sanitized.startsWith("http://")) {
      return `ws://${sanitized.slice("http://".length)}`;
    }
    return sanitized;
  }

  if (typeof window === "undefined") {
    return "";
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}`;
}

function toSocketUrl(sessionId: string): string {
  const base = resolveWsBaseUrl();
  return `${base}/ws/chat?session_id=${encodeURIComponent(sessionId)}`;
}

function messageStorageKey(sessionId: string): string {
  return `${MESSAGES_STORAGE_PREFIX}:${sessionId}`;
}

export function useChatWebSocket(): UseChatWebSocketResult {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [sessionId, setSessionId] = React.useState("");

  const socketRef = React.useRef<WebSocket | null>(null);
  const shouldReconnectRef = React.useRef(true);
  const sendTimeoutRef = React.useRef<number | null>(null);

  const clearSendTimeout = React.useCallback(() => {
    if (sendTimeoutRef.current !== null) {
      window.clearTimeout(sendTimeoutRef.current);
      sendTimeoutRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedSessionId = window.localStorage.getItem(SESSION_STORAGE_KEY);
    const nextSessionId = storedSessionId || generateId();
    if (!storedSessionId) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, nextSessionId);
    }

    setSessionId(nextSessionId);

    const storedMessages = window.localStorage.getItem(
      messageStorageKey(nextSessionId),
    );
    if (storedMessages) {
      try {
        const parsed = JSON.parse(storedMessages) as ChatMessage[];
        setMessages(parsed);
      } catch {
        setMessages([]);
      }
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined" || !sessionId) {
      return;
    }

    window.localStorage.setItem(
      messageStorageKey(sessionId),
      JSON.stringify(messages),
    );
  }, [messages, sessionId]);

  const disconnect = React.useCallback(() => {
    shouldReconnectRef.current = false;
    clearSendTimeout();
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setIsConnected(false);
    setIsSending(false);
  }, [clearSendTimeout]);

  const connect = React.useCallback(() => {
    if (!sessionId) {
      return;
    }

    if (
      socketRef.current &&
      (socketRef.current.readyState === WebSocket.OPEN ||
        socketRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    shouldReconnectRef.current = true;

    const socket = new WebSocket(toSocketUrl(sessionId));
    socketRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      let parsed: ServerIncomingMessage | null = null;
      try {
        parsed = JSON.parse(event.data) as ServerIncomingMessage;
      } catch {
        parsed = { content: String(event.data) };
      }

      const content = parsed.content || parsed.message || parsed.text;
      if (!content) {
        return;
      }

      // Skip connection banner from backend so chat stays clean.
      if (
        String(content)
          .toLowerCase()
          .includes("connected to ethio-habesha ai assistant")
      ) {
        return;
      }

      if (
        parsed.session_id &&
        parsed.session_id !== sessionId &&
        typeof window !== "undefined"
      ) {
        setSessionId(parsed.session_id);
        window.localStorage.setItem(SESSION_STORAGE_KEY, parsed.session_id);
      }

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: parsed.role === "user" ? "user" : "assistant",
        content,
        timestamp: new Date().toISOString(),
        sourceTables: Array.isArray(parsed.source_tables)
          ? parsed.source_tables
          : Array.isArray(parsed.sources)
            ? parsed.sources
            : undefined,
        isGrounded:
          typeof parsed.grounded === "boolean"
            ? parsed.grounded
            : Array.isArray(parsed.source_tables)
              ? parsed.source_tables.length > 0
              : Array.isArray(parsed.sources)
                ? parsed.sources.length > 0
                : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      clearSendTimeout();
      setIsSending(false);
    };

    socket.onerror = () => {
      clearSendTimeout();
      setIsConnected(false);
      setIsSending(false);
    };

    socket.onclose = () => {
      clearSendTimeout();
      setIsConnected(false);
      socketRef.current = null;

      if (shouldReconnectRef.current) {
        window.setTimeout(() => {
          if (shouldReconnectRef.current) {
            connect();
          }
        }, 1500);
      }
    };
  }, [clearSendTimeout, sessionId]);

  React.useEffect(() => {
    if (!sessionId) {
      return;
    }

    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect, sessionId]);

  const sendMessage = React.useCallback(
    (input: string) => {
      const content = input.trim();
      if (
        !content ||
        !socketRef.current ||
        socketRef.current.readyState !== WebSocket.OPEN
      ) {
        return;
      }

      const userMessage: ChatMessage = {
        id: generateId(),
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsSending(true);
      clearSendTimeout();

      try {
        socketRef.current.send(
          JSON.stringify({
            session_id: sessionId,
            message: content,
          }),
        );
      } catch {
        setIsSending(false);
        return;
      }

      sendTimeoutRef.current = window.setTimeout(() => {
        setIsSending(false);
      }, 20000);
    },
    [clearSendTimeout, sessionId],
  );

  const clearMessages = React.useCallback(() => {
    setMessages([]);
    if (typeof window !== "undefined" && sessionId) {
      window.localStorage.removeItem(messageStorageKey(sessionId));
    }
  }, [sessionId]);

  return {
    messages,
    isConnected,
    isSending,
    sessionId,
    connect,
    disconnect,
    sendMessage,
    clearMessages,
  };
}
