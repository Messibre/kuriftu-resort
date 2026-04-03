import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ChatAssistantLauncher } from "@/components/chat-assistant-launcher";
import { Toaster } from "@/components/ui/toaster";
import { CommandPalette } from "@/components/command-palette";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
      <ChatAssistantLauncher />
      <Toaster />
      <CommandPalette />
    </SidebarProvider>
  );
}
