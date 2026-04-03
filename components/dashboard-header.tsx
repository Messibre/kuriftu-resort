"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { GlobalSearch } from "@/components/global-search"
import { ActivityLog } from "@/components/activity-log"
import { Bell, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DashboardHeaderProps {
  title: string
  breadcrumbs?: { label: string; href?: string }[]
}

export function DashboardHeader({ title, breadcrumbs = [] }: DashboardHeaderProps) {
  const pathname = usePathname()
  const isSubPage = pathname !== "/"

  return (
    <header className="flex h-14 items-center gap-2 border-b border-border bg-background px-3 sm:gap-4 sm:px-4 lg:px-6">
      {/* Mobile: Back button for sub-pages, Menu trigger for home */}
      <div className="flex items-center gap-1 md:hidden">
        {isSubPage ? (
          <Button variant="ghost" size="icon" asChild className="size-9">
            <Link href="/">
              <ChevronLeft className="size-5" />
              <span className="sr-only">Back to Dashboard</span>
            </Link>
          </Button>
        ) : null}
        <SidebarTrigger className="size-9" />
      </div>
      
      {/* Desktop: Always show menu trigger */}
      <SidebarTrigger className="-ml-1 hidden md:flex" />
      <Separator orientation="vertical" className="hidden h-6 md:block" />
      
      <span className="truncate font-semibold md:hidden">{title}</span>
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.label} className="flex items-center gap-2">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {index === breadcrumbs.length - 1 ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex items-center gap-2">
        <GlobalSearch className="hidden sm:flex" />
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
            3
          </span>
          <span className="sr-only">Notifications</span>
        </Button>
        <ActivityLog />
        <Separator orientation="vertical" className="hidden h-6 sm:block" />
        <ThemeToggle />
      </div>
    </header>
  )
}
