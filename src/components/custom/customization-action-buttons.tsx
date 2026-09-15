"use client";

import { useEffect, useState } from "react";
import { FieldError } from "@/components/custom/field-error";
import { IconMessageCircle, IconPlus, IconX } from "@tabler/icons-react";

import { InfoIcon } from "@/components/custom/info-icon";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import type { ActionButton } from "@/components/custom/customization-types";

type CustomizationActionButtonsProps = {
  /** Field errors from the last rejected save, keyed as the API names them. */
  fieldErrors?: Record<string, string>;
  onInputChange?: () => void;
  actionButtons: ActionButton[];
  onChange: (actionButtons: ActionButton[]) => void;
  validateActionButton: (button: ActionButton) => Partial<ActionButton>;
  onPendingErrorChange?: (hasError: boolean) => void;
};

function AddActionButtonForm({
  actionButtons,
  onAdd,
  onErrorChange,
  validateActionButton,
}: {
  actionButtons: ActionButton[];
  onAdd: (button: ActionButton) => boolean;
  onErrorChange?: (hasError: boolean) => void;
  validateActionButton: (button: ActionButton) => Partial<ActionButton>;
}) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [nameError, setNameError] = useState("");
  const [messageError, setMessageError] = useState("");

  // Surface unfinished work to the parent so Save Changes cannot discard a
  // quick action that has been typed but not added yet. Validation errors
  // remain pending for the same reason.
  useEffect(() => {
    onErrorChange?.(
      Boolean(name.trim()) ||
        Boolean(message.trim()) ||
        Boolean(nameError) ||
        Boolean(messageError),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, message, nameError, messageError]);

  const handleAdd = () => {
    const trimmedName = name.trim();
    const trimmedMessage = message.trim();

    // Every rejection reason gets its own message under its own field —
    // returning silently (the previous behaviour for a blank field) gives
    // no indication of what to fix.
    let hasError = false;
    const validationErrors = validateActionButton({
      name: trimmedName,
      message: trimmedMessage,
    });
    if (validationErrors.name) {
      setNameError(validationErrors.name);
      hasError = true;
    } else if (
      actionButtons.some(
        (existing) =>
          existing.name.trim().toLowerCase() === trimmedName.toLowerCase(),
      )
    ) {
      setNameError("This quick action already exists.");
      hasError = true;
    }
    if (hasError) {
      setMessageError("");
      return;
    }
    if (validationErrors.message) {
      setMessageError(validationErrors.message);
      hasError = true;
    }
    if (hasError) return;

    const added = onAdd({ name: trimmedName, message: trimmedMessage });
    if (!added) {
      setNameError("This quick action already exists.");
      return;
    }
    setNameError("");
    setMessageError("");
    setName("");
    setMessage("");
  };

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]">
      <div>
        <Input
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setNameError("");
          }}
          placeholder='Name e.g. "Track Order"'
          aria-invalid={Boolean(nameError)}
        />
        {nameError && (
          <p className="mt-1 text-xs text-destructive">{nameError}</p>
        )}
      </div>
      <div>
        <Input
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);
            setMessageError("");
          }}
          placeholder='Message e.g. "I want to track my order"'
          aria-invalid={Boolean(messageError)}
        />
        {messageError && (
          <p className="mt-1 text-xs text-destructive">{messageError}</p>
        )}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
        <IconPlus />
        Add
      </Button>
    </div>
  );
}

export default function CustomizationActionButtons({
  fieldErrors,
  onInputChange,
  actionButtons,
  onChange,
  validateActionButton,
  onPendingErrorChange,
}: CustomizationActionButtonsProps) {
  const removeButton = (button: ActionButton) => {
    onChange(
      actionButtons.filter((current) =>
        button.id != null
          ? current.id !== button.id
          : current.name !== button.name,
      ),
    );
  };

  return (
    <Card onInput={onInputChange}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconMessageCircle className="size-4" />
          Quick Actions
          <InfoIcon text="Tap-to-send message buttons shown in the chat, like 'Track my order'. Customers tap one and that message is sent for them." />
        </CardTitle>
        <CardDescription>
          Tap-to-send buttons shown in the chat. Remove one with its ×, or add
          new ones below.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex min-h-8 flex-wrap items-center gap-1.5 rounded-md border border-input bg-background p-1.5">
          {actionButtons.length === 0 ? (
            <span className="px-1 text-xs text-muted-foreground">
              No quick actions — add them below
            </span>
          ) : (
            actionButtons.map((button) => (
              <span
                key={button.id ?? button.name}
                className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs font-medium text-foreground"
              >
                {button.name}
                <button
                  type="button"
                  onClick={() => removeButton(button)}
                  className="rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  aria-label={`Remove ${button.name}`}
                >
                  <IconX className="size-3" />
                </button>
              </span>
            ))
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <Typography variant="muted" className="text-xs font-medium">
            Add New Quick Action
          </Typography>
          <AddActionButtonForm
            actionButtons={actionButtons}
            onErrorChange={onPendingErrorChange}
            validateActionButton={validateActionButton}
            onAdd={(button) => {
              const isDuplicate = actionButtons.some(
                (existing) =>
                  existing.name.trim().toLowerCase() ===
                  button.name.trim().toLowerCase(),
              );
              if (!isDuplicate) onChange([...actionButtons, button]);
              return !isDuplicate;
            }}
          />
        </div>
        {/* Whatever the server rejected among this card's fields.
            Renders nothing when it rejected none. */}
        <FieldError errors={fieldErrors} name="quick_actions" />
      </CardContent>
    </Card>
  );
}
