"use client";

import { IconRefresh, IconDeviceFloppy } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type SettingsSaveBarProps = {
  onReset: () => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
};

export default function SettingsSaveBar({
  onReset,
  onCancel,
  onSave,
  saving,
}: SettingsSaveBarProps) {
  return (
    <div className="sticky bottom-0 z-10 flex items-center justify-between border-t border-border bg-background py-3">
      <Button type="button" variant="outline" onClick={onReset}>
        <IconRefresh className="size-4" />
        Reset to Default
      </Button>
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={onSave} disabled={saving}>
          {saving ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <IconDeviceFloppy className="size-4" />
          )}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
