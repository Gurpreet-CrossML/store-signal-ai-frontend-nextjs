/**
 * Turning a rejected request into errors on the fields that caused it.
 *
 * The server is the only thing that knows some rules — that an email is
 * already taken, that a code collides with another store's. Without this
 * the user gets a toast saying something went wrong and no indication of
 * which box to fix.
 */

/** Keys that describe the request rather than a field on the form. */
const NON_FIELD_KEYS = new Set([
  "detail",
  "non_field_errors",
  "message",
  "status",
  "code",
]);

/** The first usable message out of whatever the server put under a key. */
function firstMessage(value: unknown): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (Array.isArray(value)) {
    for (const entry of value) {
      const message = firstMessage(entry);
      if (message) return message;
    }
    return null;
  }
  // A nested serializer answers with an object; take the first thing in it
  // rather than rendering "[object Object]" under the field.
  if (value && typeof value === "object") {
    for (const entry of Object.values(value as Record<string, unknown>)) {
      const message = firstMessage(entry);
      if (message) return message;
    }
  }
  return null;
}

/**
 * Field errors from a rejected payload, keyed the way Formik wants them.
 *
 * DRF answers a validation failure with `{"field": ["message"]}` — an
 * array per field, not a string — and these routes wrap that in a `data`
 * envelope. Both shapes are read, and a bare string per field too, because
 * the endpoints are not uniform about it.
 */
export function serverFieldErrors(payload: unknown): Record<string, string> {
  if (!payload || typeof payload !== "object") return {};

  const record = payload as Record<string, unknown>;
  const body =
    record.data &&
    typeof record.data === "object" &&
    !Array.isArray(record.data)
      ? (record.data as Record<string, unknown>)
      : record;

  const errors: Record<string, string> = {};
  for (const [key, value] of Object.entries(body)) {
    if (NON_FIELD_KEYS.has(key)) continue;
    const message = firstMessage(value);
    if (message) errors[key] = message;
  }
  return errors;
}

/**
 * Put a rejected request's errors on the fields that caused it.
 *
 * Marks those fields touched as well as errored: forms here render an
 * error only once its field is touched, so setting errors alone would
 * leave the message invisible on a field the user never typed in.
 * Validation is deliberately not re-run — it would immediately overwrite
 * the server's verdict with the client's, which by definition passed.
 *
 * Returns whether anything was attached, so a caller can fall back to a
 * toast when the failure names no field.
 */
export function applyServerFieldErrors(
  form: {
    setErrors: (errors: Record<string, string>) => void;
    setTouched: (
      touched: Record<string, boolean>,
      shouldValidate?: boolean,
    ) => void;
  },
  payload: unknown,
): boolean {
  const errors = serverFieldErrors(payload);
  const keys = Object.keys(errors);
  if (keys.length === 0) return false;

  form.setErrors(errors);
  form.setTouched(Object.fromEntries(keys.map((key) => [key, true])), false);
  return true;
}

/**
 * Zod issues in the shape Formik reads.
 *
 * `issue.path` is an array of segments — ["word_replacements", 2,
 * "replace_word"] — and joining it with dots produces a key Formik cannot
 * match to any field, so the error exists but nothing can render it and
 * the form refuses to submit with no visible reason. Numeric segments
 * become array indices, the rest object keys.
 */
export function formikErrorsFromZod(
  // PropertyKey, matching Zod's own type — a symbol never appears in a
  // schema written here, and is skipped below if one ever does.
  issues: readonly { path: readonly PropertyKey[]; message: string }[],
) {
  const root: Record<string, unknown> = {};

  for (const issue of issues) {
    const path = issue.path.filter(
      (segment): segment is string | number => typeof segment !== "symbol",
    );
    if (path.length === 0) continue;

    let node: Record<string, unknown> | unknown[] = root;
    for (let i = 0; i < path.length - 1; i += 1) {
      const key = path[i];
      const nextKey = path[i + 1];
      // The next segment decides the shape of this one: a number means the
      // value here has to be an array for Formik to index into it.
      const container = typeof nextKey === "number" ? [] : {};

      const current = (node as Record<string | number, unknown>)[key];
      if (current === undefined || typeof current !== "object") {
        (node as Record<string | number, unknown>)[key] = container;
      }
      node = (node as Record<string | number, unknown>)[key] as
        | Record<string, unknown>
        | unknown[];
    }

    const leaf = path[path.length - 1];
    (node as Record<string | number, unknown>)[leaf] = issue.message;
  }

  return root;
}
