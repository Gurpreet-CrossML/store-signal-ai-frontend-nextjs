"use client";

import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

/**
 * The server's verdict on one field.
 *
 * Forms built on Formik get this through `applyServerFieldErrors`, which
 * puts the message into `errors` and lets the field render it. Screens
 * held in plain state have nowhere to put it, so they keep the map the
 * server returned and hand each field its own line here — the alternative
 * is a toast saying "check your data", which names nothing and is gone
 * before the reader has found the box.
 *
 * Renders nothing when the field was not rejected, so it can sit under
 * every input unconditionally.
 */
export function FieldError({
  errors,
  name,
  className,
}: {
  /** Field errors from the last rejected save, keyed as the API names them. */
  errors?: Record<string, string>;
  name: string;
  className?: string;
}) {
  const message = errors?.[name];
  if (!message) return null;

  return (
    <Typography
      variant="caption"
      as="p"
      className={cn("text-destructive", className)}
    >
      {message}
    </Typography>
  );
}
