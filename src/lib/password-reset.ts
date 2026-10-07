import axios, { isAxiosError } from "axios";

import { ENDPOINTS } from "@/lib/config";

/**
 * Self-service password reset against Django's public endpoints.
 *
 * Plain axios, not the app's `axiosInstance`: that one attaches the session
 * token and signs out on a 401. These endpoints need no token, and a stale
 * or revoked one would make Django reject the request before it is read.
 */

// Plain axios has no timeout, so a request lost on the way (a dropped
// connection, a stalled tunnel) left the form on "Sending..." for good.
// Same limit as the app's axiosInstance.
const client = axios.create({ timeout: 30_000 });

/**
 * A failed call: Django's message plus its field errors, if any.
 * `noAnswer` means the request never got a reply (timeout, network).
 */
export type ResetFailure = {
  message: string;
  data: unknown;
  noAnswer?: boolean;
};

function failure(error: unknown, fallback: string): ResetFailure {
  const body = isAxiosError(error) ? error.response?.data : undefined;
  if (isAxiosError(error) && !error.response) {
    return {
      message:
        error.code === "ECONNABORTED"
          ? "The server took too long to answer. Please try again."
          : "Couldn't reach the server. Check your connection and try again.",
      data: null,
      noAnswer: true,
    };
  }
  if (isAxiosError(error) && error.response?.status === 429) {
    return {
      message: "Too many attempts. Please wait a while and try again.",
      data: null,
    };
  }
  return { message: body?.message || fallback, data: body?.data ?? null };
}

/** Ask Django to email a reset link. Succeeds the same way for any email. */
export async function requestPasswordReset(
  email: string,
): Promise<{ ok: true; message: string } | ({ ok: false } & ResetFailure)> {
  try {
    const res = await client.post(ENDPOINTS.forgotPassword(), { email });
    return { ok: true, message: res.data?.message };
  } catch (error) {
    return { ok: false, ...failure(error, "Unable to send the reset link.") };
  }
}

export type OpenLinkResult =
  | { ok: true; resetToken: string }
  | ({ ok: false } & ResetFailure);

// A link can be opened only once. React may run an effect twice (Strict Mode
// in development, a remount), so every caller for the same link shares one
// request instead of the second one finding the link already used.
const openings = new Map<string, Promise<OpenLinkResult>>();

/**
 * Open a reset link: Django uses it up and returns the token the
 * new-password form submits. Call this once, in the browser — never during
 * server rendering or a prefetch, which would spend the link.
 */
export function openResetLink(
  uid: string,
  token: string,
): Promise<OpenLinkResult> {
  const key = `${uid}/${token}`;
  const existing = openings.get(key);
  if (existing) return existing;

  const pending = client
    .post(ENDPOINTS.openResetLink(), { uid, token })
    .then(
      (res): OpenLinkResult => ({
        ok: true,
        resetToken: res.data?.data?.reset_token,
      }),
    )
    .catch(
      (error): OpenLinkResult => ({
        ok: false,
        ...failure(error, "This password reset link is invalid."),
      }),
    );
  openings.set(key, pending);
  // A request that never reached Django did not use up the link, so a
  // reload may try again; any answer from Django is final.
  pending.then((result) => {
    if (!result.ok && result.noAnswer) openings.delete(key);
  });
  return pending;
}

/** Set the new password with the token from `openResetLink`. */
export async function resetPassword(payload: {
  uid: string;
  reset_token: string;
  new_password: string;
  confirm_password: string;
}): Promise<{ ok: true; message: string } | ({ ok: false } & ResetFailure)> {
  try {
    const res = await client.post(ENDPOINTS.resetPassword(), payload);
    return { ok: true, message: res.data?.message };
  } catch (error) {
    return { ok: false, ...failure(error, "Unable to reset your password.") };
  }
}
