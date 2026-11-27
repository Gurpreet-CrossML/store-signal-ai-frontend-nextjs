import z from "zod";

/**
 * Validation for the company profile form. Mirrors the backend's
 * `CompanyProfileSerializer` (tenancy app) rule for rule — keep the two in
 * step, since the server stays the authority and answers with the same
 * messages.
 */

// Same limits as the `Company` columns and the backend's `core/constants.py`.
export const EMAIL_MAX_LENGTH = 254;
export const PHONE_MAX_DIGITS = 15;
export const STREET_MAX_LENGTH = 255;

// Same as the backend's `LOGO_ALLOWED_EXTENSIONS` and `MAX_LOGO_SIZE_BYTES`.
const LOGO_EXTENSIONS = [".png", ".jpg", ".jpeg", ".svg"];
const LOGO_MAX_SIZE_MB = 8;
export const LOGO_ACCEPT = LOGO_EXTENSIONS.join(",");
export const LOGO_HINT = `PNG, JPG or SVG, up to ${LOGO_MAX_SIZE_MB} MB.`;

const locationId = z.number().int().positive().nullable();

export const companyProfileSchema = z
  .object({
    // `abort` stops at the first failing check, so an empty box reads
    // "required" rather than also "invalid email".
    email: z
      .string()
      .trim()
      .min(1, { error: "Company email is required.", abort: true })
      .max(EMAIL_MAX_LENGTH, {
        error: `Email must be at most ${EMAIL_MAX_LENGTH} characters.`,
        abort: true,
      })
      .email("Enter a valid email address."),
    phone: z
      .string()
      .trim()
      .regex(/^[0-9]*$/, {
        error: "Phone may only contain digits.",
        abort: true,
      })
      .max(
        PHONE_MAX_DIGITS,
        `Phone must be at most ${PHONE_MAX_DIGITS} digits.`,
      ),
    street: z
      .string()
      .trim()
      .max(STREET_MAX_LENGTH, {
        error: `Street must be at most ${STREET_MAX_LENGTH} characters.`,
      }),
    country: locationId,
    state: locationId,
    city: locationId,
  })
  // The dropdowns reset the levels below on change, so these only trip if the
  // form state is tampered with — but the server enforces them too.
  .superRefine((values, ctx) => {
    if (values.state !== null && values.country === null) {
      ctx.addIssue({
        code: "custom",
        path: ["state"],
        message: "Select a country before choosing a state.",
      });
    }
    if (values.city !== null && values.state === null) {
      ctx.addIssue({
        code: "custom",
        path: ["city"],
        message: "Select a state before choosing a city.",
      });
    }
  });

export type CompanyProfileValues = z.infer<typeof companyProfileSchema>;

/** Why `file` can't be the logo, or null. The server also checks its content. */
export function logoFileError(file: File): string | null {
  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (!LOGO_EXTENSIONS.includes(extension)) {
    return "Logo must be a PNG, JPG or SVG image.";
  }
  if (file.size > LOGO_MAX_SIZE_MB * 1024 * 1024) {
    return `Logo must be ${LOGO_MAX_SIZE_MB} MB or smaller.`;
  }
  return null;
}
