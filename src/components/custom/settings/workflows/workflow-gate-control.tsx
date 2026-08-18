"use client";

import { ChipList } from "@/components/custom/chip-list";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import type {
  WorkflowGateControl,
  WorkflowGatePatch,
} from "@/lib/workflow-types";

/** The inline control a gate row shows below its description, keyed on `control.kind`. */
export function WorkflowGateControlView({
  control,
  disabled,
  onChange,
}: {
  control: WorkflowGateControl;
  disabled?: boolean;
  onChange: (patch: WorkflowGatePatch) => void;
}) {
  if (control.kind === "select") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Typography variant="caption">{control.label}</Typography>
        <Select
          value={control.value}
          disabled={disabled}
          onValueChange={(value) => onChange({ controlValue: value })}
        >
          <SelectTrigger size="sm" className="w-fit">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {control.options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (control.kind === "number" || control.kind === "text") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Typography variant="caption">{control.label}</Typography>
        <Input
          value={control.value}
          disabled={disabled}
          onChange={(event) => onChange({ controlValue: event.target.value })}
          className={cn("h-8", control.kind === "number" ? "w-20" : "w-72")}
        />
        {control.kind === "number" && control.suffix && (
          <Typography variant="caption">{control.suffix}</Typography>
        )}
      </div>
    );
  }

  // chips
  return (
    <div className="flex flex-col gap-2">
      <Typography variant="caption">{control.label}</Typography>
      <ChipList
        items={control.values}
        disabled={disabled}
        placeholder="Add and press Enter…"
        onAdd={(values) =>
          onChange({ controlValues: [...control.values, ...values] })
        }
        onRemove={(index) =>
          onChange({
            controlValues: control.values.filter((_, i) => i !== index),
          })
        }
      />
    </div>
  );
}
