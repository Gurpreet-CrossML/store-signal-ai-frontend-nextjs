import { get_support_ticket } from "@/db/support";
import { APIResponse } from "@/lib/config";
import { createAPIResponse } from "@/lib/helpers";
import { safeDecrypt } from "@/lib/fernet";
import { getFreshdeskTicket } from "@/lib/platform-tickets/freshdesk";
import { getZendeskTicket } from "@/lib/platform-tickets/zendesk";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse>,
) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json(createAPIResponse(false, "Method Not Allowed", null));
  }

  const { ticket_id } = req.query;
  const ticketId = Number(Array.isArray(ticket_id) ? ticket_id[0] : ticket_id);

  if (Number.isNaN(ticketId)) {
    return res
      .status(400)
      .json(createAPIResponse(false, "Invalid ticket id", null));
  }

  const ticket = await get_support_ticket(ticketId);

  if (!ticket) {
    return res
      .status(404)
      .json(createAPIResponse(false, "Ticket not found", null));
  }

  let external_details = null;
  const hasUrl = !!ticket.support_ticket_api_url;
  const hasKey = !!ticket.support_ticket_api_key;

  if (hasUrl && hasKey) {
    const rawPlatform = (
      ticket.support_ticket_platform ||
      ticket.platform ||
      ""
    ).toLowerCase();

    // Credentials are Fernet-encrypted by Django – decrypt before use
    const credentials = {
      apiUrl: ticket.support_ticket_api_url!,
      apiKey: safeDecrypt(ticket.support_ticket_api_key),
      username: ticket.support_ticket_username
        ? safeDecrypt(ticket.support_ticket_username)
        : undefined,
    };

    if (rawPlatform === "zendesk") {
      const zRes = await getZendeskTicket(ticketId, credentials);
      if (zRes.ok) {
        external_details = zRes.data;
      } else {
        external_details = { error: zRes.error };
      }
    } else if (rawPlatform === "freshdesk") {
      const fRes = await getFreshdeskTicket(ticketId, credentials);
      if (fRes.ok) {
        external_details = fRes.data;
      } else {
        external_details = { error: fRes.error };
      }
    } else {
      external_details = { error: `Unsupported platform: ${rawPlatform}` };
    }
  }

  // Strip sensitive credentials
  const {
    support_ticket_api_url,
    support_ticket_api_key,
    support_ticket_username,
    support_ticket_platform,
    ...ticketFields
  } = ticket;

  return res
    .status(200)
    .json(
      createAPIResponse(true, "Ticket detail retrieved", {
        ...ticketFields,
        external_details,
      }),
    );
}
