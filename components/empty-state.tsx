"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  FileText, 
  MessageSquare, 
  Calendar, 
  Users, 
  TrendingUp,
  Tag,
  type LucideIcon
} from "lucide-react"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon = FileText,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 p-8 text-center",
        className
      )}
    >
      <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
        <Icon className="size-8 text-primary" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && (
        <Button onClick={action.onClick} className="mt-4 bg-primary hover:bg-primary/90">
          {action.label}
        </Button>
      )}
    </div>
  )
}

// Pre-configured empty states for different sections
export function NoFeedbackEmpty({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={MessageSquare}
      title="No feedback yet"
      description="Guest feedback will appear here once collected. You can also manually add feedback from paper comments or phone calls."
      action={onAdd ? { label: "Add Feedback", onClick: onAdd } : undefined}
    />
  )
}

export function NoScheduleEmpty({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={Calendar}
      title="No schedule created"
      description="Create a schedule to assign staff to shifts. You can auto-assign based on availability or manually select staff members."
      action={onCreate ? { label: "Create Schedule", onClick: onCreate } : undefined}
    />
  )
}

export function NoStaffEmpty({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="No staff members"
      description="Add staff members to manage their schedules, contact information, and department assignments."
      action={onAdd ? { label: "Add Staff Member", onClick: onAdd } : undefined}
    />
  )
}

export function NoRevenueDataEmpty() {
  return (
    <EmptyState
      icon={TrendingUp}
      title="No revenue data"
      description="Revenue data will be displayed here once bookings and transactions are recorded in the system."
    />
  )
}

export function NoPromotionsEmpty({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={Tag}
      title="No active promotions"
      description="Create promotions to attract guests with special offers, discounts, and seasonal deals."
      action={onCreate ? { label: "Create Promotion", onClick: onCreate } : undefined}
    />
  )
}
