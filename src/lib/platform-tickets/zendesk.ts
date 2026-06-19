import { callPlatformApi } from "./api-client";
import { NormalizedTicketDetail } from "./types";

export async function getZendeskTicket(
  ticketId: string | number,
  credentials: { apiUrl: string; apiKey: string; username?: string },
): Promise<
  { ok: true; data: NormalizedTicketDetail } | { ok: false; error: string }
> {
  try {
    // Fetch the ticket with requester sideloaded
    const ticketResponse = await callPlatformApi(
      "zendesk",
      "GET",
      `/api/v2/tickets/${ticketId}.json?include=users`,
      credentials,
    );

    const ticket = ticketResponse.ticket;
    if (!ticket) {
      return { ok: false, error: "Zendesk API response missing 'ticket' key" };
    }

    // Build user map from ticket response
    const userMap = new Map<number, { name: string; email: string }>();
    if (Array.isArray(ticketResponse.users)) {
      for (const user of ticketResponse.users) {
        userMap.set(user.id, { name: user.name, email: user.email });
      }
    }

    // Fetch comments separately — the Show Ticket endpoint does not support
    // include=comments; comments live at /tickets/{id}/comments.json
    const commentsResponse = await callPlatformApi(
      "zendesk",
      "GET",
      `/api/v2/tickets/${ticketId}/comments.json?include=users`,
      credentials,
    );

    // Merge any additional users from the comments response
    if (Array.isArray(commentsResponse.users)) {
      for (const user of commentsResponse.users) {
        if (!userMap.has(user.id)) {
          userMap.set(user.id, { name: user.name, email: user.email });
        }
      }
    }

    const comments: any[] = Array.isArray(commentsResponse.comments)
      ? commentsResponse.comments
      : [];

    // Build requester info
    const requesterUser = ticket.requester_id
      ? userMap.get(ticket.requester_id)
      : null;
    const requester = requesterUser
      ? { name: requesterUser.name, email: requesterUser.email }
      : null;

    // Map comments → conversation entries and collect attachments
    const attachments: { name: string; url: string }[] = [];
    const conversation = comments.map((comment: any) => {
      const authorUser = comment.author_id
        ? userMap.get(comment.author_id)
        : null;

      const bodyText = comment.body || comment.plain_body || "";

      // Extract inline images from comment markdown body
      if (bodyText) {
        const matches = bodyText.matchAll(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/g);
        for (const match of matches) {
          const imgUrl = match[1];
          let filename = "Inline Image";
          try {
            const urlObj = new URL(imgUrl);
            const pathname = urlObj.pathname;
            filename = pathname.substring(pathname.lastIndexOf("/") + 1) || "inline_image.png";
          } catch (e) {
            // Ignore
          }
          if (!attachments.some((att) => att.url === imgUrl)) {
            attachments.push({
              name: filename,
              url: imgUrl,
            });
          }
        }
      }

      // Collect standard attachments
      if (Array.isArray(comment.attachments)) {
        for (const att of comment.attachments) {
          const url = att.content_url || att.url || "";
          if (url && !attachments.some((a) => a.url === url)) {
            attachments.push({
              name: att.file_name || att.name || "Attachment",
              url: url,
            });
          }
        }
      }

      return {
        author: authorUser?.name,
        body: bodyText,
        created_at: comment.created_at,
      };
    });

    // Extract inline images from description as well
    if (ticket.description) {
      const matches = ticket.description.matchAll(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/g);
      for (const match of matches) {
        const imgUrl = match[1];
        let filename = "Inline Image";
        try {
          const urlObj = new URL(imgUrl);
          const pathname = urlObj.pathname;
          filename = pathname.substring(pathname.lastIndexOf("/") + 1) || "inline_image.png";
        } catch (e) {
          // Ignore
        }
        if (!attachments.some((att) => att.url === imgUrl)) {
          attachments.push({
            name: filename,
            url: imgUrl,
          });
        }
      }
    }


    const normalized: NormalizedTicketDetail = {
      subject: ticket.subject || "",
      description: ticket.description || "",
      status: ticket.status || "",
      priority: ticket.priority || "",
      requester,
      conversation,
      attachments,
      created_at: ticket.created_at,
      updated_at: ticket.updated_at,
    };

    return { ok: true, data: normalized };
  } catch (error: any) {
    return { ok: false, error: error?.message || String(error) };
  }
}
