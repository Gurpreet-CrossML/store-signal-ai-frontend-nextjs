"use client";

import { useState } from "react";
import {
  IconChevronDown,
  IconChevronUp,
  IconLock,
  IconShieldCheck,
  IconX,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type AgentOption = {
  email: string;
  name: string;
  /** Company admin — shown with an "Admin" label. */
  isAdmin?: boolean;
  /** Can't be picked by this user (a supervisor can't assign to an admin). */
  disabled?: boolean;
};

/** Small "Admin" tag shown beside an admin's name. */
export function AdminBadge() {
  return (
    <Badge variant="outline" className="gap-1 px-1.5 py-0 text-[10px]">
      <IconShieldCheck className="size-3" />
      Admin
    </Badge>
  );
}

/** Picks who a chat or ticket is assigned to: a sheet on phones, a dialog above. */
export function AssigneeSelect({
  agents,
  currentAgent,
  currentAgentName,
  disabled,
  onReassign,
  noun = "chat",
  hideLabel = false,
}: {
  agents: AgentOption[];
  currentAgent: string | null;
  currentAgentName?: string | null;
  disabled: boolean;
  onReassign: (email: string) => void;
  noun?: "chat" | "ticket";
  /** Leave out the "Assignee" label when the caller already shows one. */
  hideLabel?: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(false);

  if (agents.length === 0 && !currentAgent) return null;

  const currentAgentOption = agents.find(
    (agent) => agent.email === currentAgent,
  );
  const currentAgentDisplayName =
    currentAgentOption?.name ||
    currentAgentName ||
    currentAgent ||
    "Unassigned";
  const currentAgentInitials = currentAgentDisplayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const selectAgent = (email: string) => {
    if (email !== currentAgent) onReassign(email);
    setMobileOpen(false);
    setDesktopOpen(false);
  };

  const renderTriggerContent = (open: boolean) => (
    <>
      {currentAgent ? (
        <span
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground sm:size-6 sm:text-[10px]",
          )}
        >
          {currentAgentInitials}
        </span>
      ) : (
        <span className="size-5 shrink-0 rounded-full border-2 border-dashed border-muted-foreground/40 sm:size-6" />
      )}
      <span className="min-w-0 flex-1 truncate text-left sm:max-w-45 sm:flex-none">
        {currentAgentDisplayName}
      </span>
      {disabled ? (
        <IconLock className="size-4 shrink-0" />
      ) : open ? (
        <IconChevronUp className="size-4 shrink-0" />
      ) : (
        <IconChevronDown className="size-4 shrink-0" />
      )}
    </>
  );

  const renderOptions = () => (
    <>
      <CommandEmpty>No teammates found.</CommandEmpty>
      <CommandGroup forceMount className="p-1">
        <CommandItem
          forceMount
          value="Unassigned"
          onSelect={() => selectAgent("")}
          className="gap-3 py-2"
        >
          <span className="size-8 shrink-0 rounded-full border-2 border-dashed border-muted-foreground/40" />
          <span className="flex-1">Unassigned</span>
          {!currentAgent && <span className="text-primary">✓</span>}
        </CommandItem>
      </CommandGroup>
      <CommandGroup heading="Team">
        {agents.map((agent) => (
          <CommandItem
            key={agent.email}
            value={`${agent.name} ${agent.email}`}
            disabled={agent.disabled}
            onSelect={() => selectAgent(agent.email)}
            className="gap-3 py-2"
          >
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground",
              )}
            >
              {agent.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 truncate">{agent.name}</span>
            {agent.isAdmin && <AdminBadge />}
            {agent.email === currentAgent && (
              <span className="text-primary">✓</span>
            )}
          </CommandItem>
        ))}
      </CommandGroup>
    </>
  );

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:flex-none sm:gap-3">
      {!hideLabel && (
        <span className="hidden shrink-0 text-xs font-medium text-muted-foreground sm:inline sm:text-sm">
          Assignee
        </span>
      )}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            aria-label="Choose assignee"
            className={cn(
              "h-9 min-w-0 flex-1 rounded-full border-border px-2 text-xs sm:hidden",
              mobileOpen && "border-primary ring-2 ring-primary/15",
            )}
          >
            {renderTriggerContent(mobileOpen)}
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="max-h-[85dvh] gap-0 overflow-hidden rounded-t-3xl p-0 data-[side=bottom]:h-[65dvh] sm:hidden"
        >
          <div className="mx-auto mt-3 h-1 w-9 shrink-0 rounded-full bg-muted-foreground/30" />
          <SheetHeader className="border-b px-4 pb-3 pt-4 text-left">
            <SheetTitle className="text-lg">Assign {noun}</SheetTitle>
            <SheetDescription className="sr-only">
              Search for a teammate and assign this{" "}
              {noun === "chat" ? "conversation" : "ticket"}.
            </SheetDescription>
          </SheetHeader>
          <Command className="h-auto! min-h-0 flex-1 rounded-none!">
            <div className="px-4 pb-2 pt-3">
              <CommandInput placeholder="Search teammates" />
            </div>
            <CommandList className="min-h-0 max-h-none flex-1 px-2 pb-4">
              {renderOptions()}
            </CommandList>
          </Command>
        </SheetContent>
      </Sheet>

      <Dialog open={desktopOpen} onOpenChange={setDesktopOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            aria-label="Choose assignee"
            className={cn(
              "hidden h-10 min-w-0 rounded-full border-border px-2.5 text-sm sm:flex sm:flex-none",
              desktopOpen && "border-primary ring-2 ring-primary/15",
            )}
          >
            {renderTriggerContent(desktopOpen)}
          </Button>
        </DialogTrigger>
        <DialogContent
          showCloseButton={false}
          className="w-[calc(100vw-2rem)] max-w-90 gap-0 overflow-hidden rounded-xl p-2"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Assign {noun}</DialogTitle>
            <DialogDescription>
              Search for a teammate and assign this{" "}
              {noun === "chat" ? "conversation" : "ticket"}.
            </DialogDescription>
          </DialogHeader>
          <Command className="rounded-lg!">
            {/* The close button sits beside the search, not over it. */}
            <div className="flex items-start gap-1">
              <div className="min-w-0 flex-1">
                <CommandInput placeholder="Search teammates" />
              </div>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="mt-1.5"
                  aria-label="Close"
                >
                  <IconX />
                </Button>
              </DialogClose>
            </div>
            <CommandList className="max-h-[60vh] px-1 pb-1">
              {renderOptions()}
            </CommandList>
          </Command>
          <div className="border-t border-border/60 px-3 py-3 text-xs leading-relaxed text-muted-foreground sm:px-4 sm:text-sm">
            {noun === "chat"
              ? "Assigning a teammate hands them the chat and pauses the AI."
              : "Assigning a teammate hands them the ticket."}{" "}
            They get an email and an in-app alert.
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
