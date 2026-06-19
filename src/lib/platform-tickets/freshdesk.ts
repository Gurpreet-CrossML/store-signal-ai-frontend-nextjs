import { callPlatformApi } from "./api-client";
import { NormalizedTicketDetail } from "./types";

const FRESHDESK_STATUS_MAP: Record<number, string> = {
  2: "open",
  3: "pending",
  4: "resolved",
  5: "closed",
};

const FRESHDESK_PRIORITY_MAP: Record<number, string> = {
  1: "low",
  2: "normal",
  3: "high",
  4: "urgent",
};

export async function getFreshdeskTicket(
  ticketId: string | number,
  credentials: { apiUrl: string; apiKey: string },
): Promise<
  { ok: true; data: NormalizedTicketDetail } | { ok: false; error: string }
> {
  try {
    const ticket = await callPlatformApi(
      "freshdesk",
      "GET",
      `/api/v2/tickets/${ticketId}?include=conversations,requester`,
      credentials,
    );

    const statusVal = ticket.status;
    const priorityVal = ticket.priority;

    const normalized: NormalizedTicketDetail = {
      subject: ticket.subject || "",
      description: ticket.description_text || ticket.description || "",
      status: FRESHDESK_STATUS_MAP[statusVal] || String(statusVal),
      priority: FRESHDESK_PRIORITY_MAP[priorityVal] || String(priorityVal),
      requester: ticket.requester
        ? {
            name: ticket.requester.name,
            email: ticket.requester.email,
          }
        : null,
      conversation: Array.isArray(ticket.conversations)
        ? ticket.conversations.map((conv: any) => ({
            author:
              ticket.requester &&
              Number(conv.user_id) === Number(ticket.requester.id)
                ? ticket.requester.name
                : undefined,
            body: conv.body_text || conv.body || "",
            created_at: conv.created_at,
          }))
        : [],
      attachments: [],
      created_at: ticket.created_at,
      updated_at: ticket.updated_at,
    };

    // Extract attachments from the main ticket
    if (Array.isArray(ticket.attachments)) {
      for (const att of ticket.attachments) {
        normalized.attachments.push({
          name: att.name || "",
          url: att.attachment_url || att.url || "",
        });
      }
    }

    // Extract attachments from ticket conversations
    if (Array.isArray(ticket.conversations)) {
      for (const conv of ticket.conversations) {
        if (Array.isArray(conv.attachments)) {
          for (const att of conv.attachments) {
            normalized.attachments.push({
              name: att.name || "",
              url: att.attachment_url || att.url || "",
            });
          }
        }
      }
    }

    // Also extract any inline image URLs from description (HTML)
    if (ticket.description) {
      const matches = ticket.description.matchAll(/<img[^>]+src=["']([^"']+)["']/g);
      for (const match of matches) {
        const imgUrl = match[1];
        let filename = "Inline Image";
        try {
          const urlObj = new URL(imgUrl);
          const pathname = urlObj.pathname;
          filename = pathname.substring(pathname.lastIndexOf("/") + 1) || "inline_image.png";
        } catch (e) {}
        if (!normalized.attachments.some(att => att.url === imgUrl)) {
          normalized.attachments.push({ name: filename, url: imgUrl });
        }
      }
    }

    // And from conversation bodies (HTML)
    if (Array.isArray(ticket.conversations)) {
      for (const conv of ticket.conversations) {
        if (conv.body) {
          const matches = conv.body.matchAll(/<img[^>]+src=["']([^"']+)["']/g);
          for (const match of matches) {
            const imgUrl = match[1];
            let filename = "Inline Image";
            try {
              const urlObj = new URL(imgUrl);
              const pathname = urlObj.pathname;
              filename = pathname.substring(pathname.lastIndexOf("/") + 1) || "inline_image.png";
            } catch (e) {}
            if (!normalized.attachments.some(att => att.url === imgUrl)) {
              normalized.attachments.push({ name: filename, url: imgUrl });
            }
          }
        }
      }
    }


    return { ok: true, data: normalized };
  } catch (error: any) {
    return { ok: false, error: error?.message || String(error) };
  }
}
