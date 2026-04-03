"use client"

import { toast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"

interface ToastWithRetryOptions {
  title: string
  description?: string
  onRetry: () => void | Promise<void>
}

export function toastError({ title, description, onRetry }: ToastWithRetryOptions) {
  return toast({
    variant: "destructive",
    title,
    description,
    action: (
      <ToastAction altText="Retry" onClick={onRetry}>
        Retry
      </ToastAction>
    ),
  })
}

export function toastSuccess(title: string, description?: string) {
  return toast({
    title,
    description,
  })
}

export function toastLoading(title: string, description?: string) {
  return toast({
    title,
    description,
  })
}
