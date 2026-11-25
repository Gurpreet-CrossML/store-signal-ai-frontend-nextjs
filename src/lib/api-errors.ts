import { isAxiosError } from "axios";

/** The body of a failed request's response, or undefined when there is none. */
export function errorEnvelope(
  error: unknown,
): { message?: string; data?: unknown } | undefined {
  const response = isAxiosError(error) ? error.response : undefined;
  return response?.data;
}

/**
 * The message to show for a failed request: the first field error when the
 * server returned one, else its message, else the fallback.
 */
export function bestErrorMessage(envelope: unknown, fallback: string): string {
  const data = envelope as { data?: unknown; message?: string } | undefined;
  const fieldData = data?.data;
  if (fieldData && typeof fieldData === "object" && !Array.isArray(fieldData)) {
    for (const value of Object.values(fieldData as Record<string, unknown>)) {
      if (typeof value === "string" && value) return value;
      if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    }
  }
  return data?.message || fallback;
}
