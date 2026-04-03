"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Tag,
  MessageSquareText,
  BarChart3,
  Calendar,
  Users,
  Settings,
  HelpCircle,
  Search,
  Moon,
  Sun,
  FileText,
  Plus,
  Download,
} from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { useTheme } from "next-themes"

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const { setTheme, theme } = useTheme()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push("/"))}>
            <LayoutDashboard className="mr-2 size-4" />
            <span>Dashboard</span>
            <CommandShortcut>G D</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/promotions"))}>
            <Tag className="mr-2 size-4" />
            <span>Promotions</span>
            <CommandShortcut>G P</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/feedback"))}>
            <MessageSquareText className="mr-2 size-4" />
            <span>Feedback</span>
            <CommandShortcut>G F</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/revenue"))}>
            <BarChart3 className="mr-2 size-4" />
            <span>Revenue</span>
            <CommandShortcut>G R</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/scheduling"))}>
            <Calendar className="mr-2 size-4" />
            <span>Scheduling</span>
            <CommandShortcut>G S</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/staff"))}>
            <Users className="mr-2 size-4" />
            <span>Staff</span>
            <CommandShortcut>G T</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => runCommand(() => router.push("/promotions"))}>
            <Plus className="mr-2 size-4" />
            <span>Create New Promotion</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/feedback"))}>
            <Plus className="mr-2 size-4" />
            <span>Add Feedback</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/scheduling"))}>
            <FileText className="mr-2 size-4" />
            <span>Publish Schedule</span>
          </CommandItem>
          <CommandItem>
            <Download className="mr-2 size-4" />
            <span>Export Report</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem
            onSelect={() => runCommand(() => setTheme(theme === "dark" ? "light" : "dark"))}
          >
            {theme === "dark" ? (
              <Sun className="mr-2 size-4" />
            ) : (
              <Moon className="mr-2 size-4" />
            )}
            <span>Toggle Theme</span>
            <CommandShortcut>T T</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Settings className="mr-2 size-4" />
            <span>Settings</span>
          </CommandItem>
          <CommandItem>
            <HelpCircle className="mr-2 size-4" />
            <span>Help & Support</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
