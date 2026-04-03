"use client";

import * as React from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIChatbot } from "@/components/ai-chatbot";

export function ChatAssistantLauncher() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen((value) => !value)}
        className="fixed bottom-4 right-4 z-50 size-12 rounded-full bg-gradient-to-br from-emerald-500 via-lime-400 to-amber-400 text-black shadow-xl hover:opacity-90 sm:bottom-6 sm:right-6 sm:size-14"
        size="icon"
      >
        {isOpen ? (
          <X className="size-6" />
        ) : (
          <MessageCircle className="size-6" />
        )}
        <span className="sr-only">Toggle AI assistant</span>
      </Button>

      <AIChatbot isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
