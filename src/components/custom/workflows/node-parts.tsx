import { IconArrowBackUp, IconPencil } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";

// Pieces the Trigger and Step cards share, so editing either feels the same.

/** Outline + ring that marks a card the store has changed. */
export const EDITED_NODE_CLASS = "border-primary/40 ring-2 ring-primary/10";

export function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" size="xs" onClick={onClick}>
      <IconPencil />
      Edit
    </Button>
  );
}

export function EditedBadge() {
  return (
    <Badge variant="outline" className={BADGE_TONE_STYLES.warning}>
      Edited
    </Badge>
  );
}

/** Use default · Cancel · Save — the bottom of every node editor. */
export function EditorFooter({
  isSaving,
  onUseDefault,
  onCancel,
}: {
  isSaving: boolean;
  onUseDefault: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="ghost" size="sm" onClick={onUseDefault}>
        <IconArrowBackUp />
        Use default
      </Button>
      <span className="flex-1" />
      <Button type="button" variant="outline" size="sm" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" size="sm" disabled={isSaving}>
        {isSaving && <Spinner />}
        Save
      </Button>
    </div>
  );
}

/** A field's validation message, shown once the field has been touched. */
export function FieldMessage({ message }: { message?: unknown }) {
  return typeof message === "string" && message ? (
    <p className="text-xs text-destructive">{message}</p>
  ) : null;
}
