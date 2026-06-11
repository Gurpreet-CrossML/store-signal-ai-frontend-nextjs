import { APIResponse } from "@/lib/config";
import { createAPIResponse } from "@/lib/helpers";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Port of Django `ScrapeLinksTypesAPIView` (knowledge/views.py).
 * Returns dict(LINK_CHOICES) from core.constants.
 *
 * LINK_CHOICES contains a few duplicate keys (shipping_policy, cookie_policy);
 * Python's dict() keeps the last occurrence. Those duplicates have identical
 * labels and the key's first-seen insertion position is preserved, so the
 * object below mirrors dict(LINK_CHOICES) byte-for-byte (key order + values).
 */
const LINK_CHOICES_DICT: Record<string, string> = {
  privacy_policy: "Privacy Policy",
  terms_conditions: "Terms & Conditions",
  return_policy: "Return & Refund Policy",
  shipping_policy: "Shipping Policy",
  cookie_policy: "Cookie Policy",
  contact_us: "Contact Us",
  about_us: "About Us",
  faq: "FAQs",
  blog: "Blog",
  careers: "Careers",
  size_guide: "Size Guide",
  generic_link: "Generic Link",
  cancellation_policy: "Cancellation Policy",
  terms_of_service: "Terms of Service",
  refund_policy: "Refund Policy",
  data_protection_policy: "Data Protection Policy",
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse>,
) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json(createAPIResponse(false, "Method Not Allowed", null));
  }

  return res
    .status(200)
    .json(
      createAPIResponse(
        true,
        "Policy links Types retrieved successfully",
        LINK_CHOICES_DICT,
      ),
    );
}
