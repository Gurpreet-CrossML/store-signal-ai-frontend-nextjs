"use client";

import { useState } from "react";
import {
  IconChevronDown,
  IconMessageCircle,
  IconPlus,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionButton } from "./customization-types";

type CustomizationActionButtonsProps = {
  actionButtons: ActionButton[];
  onChange: (actionButtons: ActionButton[]) => void;
};

function AddActionButtonForm({
  onAdd,
}: {
  onAdd: (button: ActionButton) => void;
}) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const handleAdd = () => {
    const trimmedName = name.trim();
    const trimmedMessage = message.trim();
    if (!trimmedName || !trimmedMessage) return;
    onAdd({ name: trimmedName, message: trimmedMessage });
    setName("");
    setMessage("");
  };

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_auto]">
      <Input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder='Name e.g. "Track Order"'
      />
      <Input
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder='Message e.g. "I want to track my order"'
      />
      <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
        <IconPlus />
        Add
      </Button>
    </div>
  );
}

export default function CustomizationActionButtons({
  actionButtons,
  onChange,
}: CustomizationActionButtonsProps) {
  const removeButton = (button: ActionButton) => {
    onChange(
      actionButtons.filter((current) =>
        button.id != null ? current.id !== button.id : current !== button,
      ),
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <Label className="flex items-center gap-2">
        <IconMessageCircle className="size-4" />
        Action Buttons
      </Label>
      <div className="flex flex-col gap-3 border border-border p-4">
        <p className="text-xs text-muted-foreground">
          Quick-action buttons shown in the chatbot. Uncheck to remove one, or
          add new ones below.
        </p>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="relative flex h-8 w-full items-center border border-input bg-transparent pr-8 pl-8 text-left text-xs outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
            >
              <IconMessageCircle className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <span className="block truncate">
                {actionButtons.length > 0
                  ? actionButtons.map((button) => button.name).join(", ")
                  : "No action buttons — add them below"}
              </span>
              <IconChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-(--radix-dropdown-menu-trigger-width)"
          >
            {actionButtons.length === 0 ? (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                No action buttons yet
              </div>
            ) : (
              actionButtons.map((button) => (
                <DropdownMenuCheckboxItem
                  key={button.id ?? button.name}
                  checked
                  onCheckedChange={() => removeButton(button)}
                  onSelect={(event) => event.preventDefault()}
                >
                  {button.name}
                </DropdownMenuCheckboxItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <p className="text-xs font-medium text-muted-foreground">
            Add new action button
          </p>
          <AddActionButtonForm
            onAdd={(button) => onChange([...actionButtons, button])}
          />
        </div>
      </div>
    </div>
  );
}
