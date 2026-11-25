import type { ClipboardEvent, FormEvent, KeyboardEvent } from "react";

type Field = HTMLInputElement | HTMLTextAreaElement;

/** What a field says when someone tries to type or paste past its limit. */
export function limitReachedMessage(max: number): string {
  return `You've reached the ${max.toLocaleString()} character limit.`;
}

/** The characters left selected, which typing or pasting would replace. */
function selectedLength(field: Field): number {
  return (field.selectionEnd ?? 0) - (field.selectionStart ?? 0);
}

/**
 * Handlers that tell when someone tries to add more than `max` characters.
 * The field itself still refuses the extra text (`maxLength`); these only
 * report the attempt through `onHit`, so it can be shown as an error. Spread
 * them on the field next to `maxLength={max}`.
 */
export function limitAttemptHandlers<T extends Field>(
  max: number,
  onHit: () => void,
) {
  return {
    // A key that would add a character (a newline too, in a textarea) while
    // the field is full and nothing is selected to be replaced.
    onKeyDown: (event: KeyboardEvent<T>) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const field = event.currentTarget;
      const addsText =
        event.key.length === 1 ||
        (event.key === "Enter" && field.tagName === "TEXTAREA");
      if (addsText && field.value.length - selectedLength(field) >= max)
        onHit();
    },
    // Pasted text that doesn't fit (the browser cuts it to fit).
    onPaste: (event: ClipboardEvent<T>) => {
      const field = event.currentTarget;
      const pasted = event.clipboardData.getData("text");
      if (field.value.length - selectedLength(field) + pasted.length > max)
        onHit();
    },
    // Text added by an on-screen keyboard or voice input, which may not send
    // the key presses above.
    onBeforeInput: (event: FormEvent<T>) => {
      const field = event.currentTarget;
      const data = (event.nativeEvent as InputEvent).data;
      if (
        data &&
        field.value.length - selectedLength(field) + data.length > max
      )
        onHit();
    },
  };
}
