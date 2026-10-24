import z from "zod";

/**
 * Validation for the company profile form. Mirrors the backend's
 * `CompanyProfileSerializer` (tenancy app) rule for rule — keep the two in
 * step, since the server stays the authority and answers with the same
 * messages.
 */

// Same limits as the `Company` columns and `tenancy/constants.py`.
export const EMAIL_MAX_LENGTH = 254;
export const PHONE_MAX_LENGTH = 20;
export const PHONE_MIN_DIGITS = 7;
export const PHONE_MAX_DIGITS = 15;
export const STREET_MAX_LENGTH = 255;

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
      .max(PHONE_MAX_LENGTH, {
        error: `Phone must be at most ${PHONE_MAX_LENGTH} characters.`,
        abort: true,
      })
      .refine((val) => !val || /^[+\d()[\]\s-]+$/.test(val), {
        error: "Phone may only contain digits, spaces, +, -, (, ).",
        abort: true,
      })
      .refine((val) => {
        if (!val) return true;

        const digitCount = val.replace(/\D/g, "").length;
        return digitCount >= PHONE_MIN_DIGITS && digitCount <= PHONE_MAX_DIGITS;
      }, "Enter a valid phone number."),
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
