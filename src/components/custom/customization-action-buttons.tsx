"use client";

import { useState } from "react";
import { FieldError } from "@/components/custom/field-error";
import {
  IconChevronDown,
  IconMessageCircle,
  IconPlus,
} from "@tabler/icons-react";

import { InfoIcon } from "@/components/custom/info-icon";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import type { ActionButton } from "@/components/custom/customization-types";

type CustomizationActionButtonsProps = {
  /** Field errors from the last rejected save, keyed as the API names them. */
  fieldErrors?: Record<string, string>;
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
    <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]">
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
  fieldErrors,
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconMessageCircle className="size-4" />
          Quick Actions
          <InfoIcon text="Tap-to-send message buttons shown in the chat, like 'Track my order'. Customers tap one and that message is sent for them." />
        </CardTitle>
        <CardDescription>
          Tap-to-send buttons shown in the chat. Uncheck to remove one, or add
          new ones below.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
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
                  : "No quick actions — add them below"}
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
                No quick actions yet
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
          <Typography variant="muted" className="text-xs font-medium">
            Add New Quick Action
          </Typography>
          <AddActionButtonForm
            onAdd={(button) => onChange([...actionButtons, button])}
          />
        </div>
        {/* Whatever the server rejected among this card's fields.
            Renders nothing when it rejected none. */}
        <FieldError errors={fieldErrors} name="quick_actions" />
      </CardContent>
    </Card>
  );
}
