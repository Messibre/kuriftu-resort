"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface GlobalSearchProps {
  className?: string
}

export function GlobalSearch({ className }: GlobalSearchProps) {
  const handleClick = () => {
    // Trigger the command palette with Ctrl+K
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      ctrlKey: true,
      bubbles: true,
    })
    document.dispatchEvent(event)
  }

  return (
    <Button
      variant="outline"
      className={cn(
        "relative h-9 w-full justify-start rounded-md bg-muted/50 text-sm text-muted-foreground hover:bg-muted sm:w-64 lg:w-80",
        className
      )}
      onClick={handleClick}
    >
      <Search className="mr-2 size-4" />
      <span className="hidden sm:inline-flex">Search dashboard...</span>
      <span className="inline-flex sm:hidden">Search...</span>
      <kbd className="pointer-events-none absolute right-1.5 top-1/2 hidden h-5 -translate-y-1/2 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
        <span className="text-xs">Ctrl</span>K
      </kbd>
    </Button>
  )
}
