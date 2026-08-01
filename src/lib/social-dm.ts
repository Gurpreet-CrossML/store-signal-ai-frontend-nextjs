import type { MetaDm } from "@/redux/api-slice/social-ai-slice";

export type SocialConversation = {
  contactKey: string;
  contactName: string;
  contactUsername: string | null;
  contactAvatar: string | null;
  lastMessage: string;
  lastMessageAt: string | null;
  messages: MetaDm[];
};

/**
 * Group one account's flat, oldest-first DM rows (as returned by
 * ENDPOINTS.fetch{Facebook,Instagram}Dms) into per-contact conversations for
 * the list/chat UI. Sorted by most recent activity first.
 */
export function groupDmsByContact(dms: MetaDm[]): SocialConversation[] {
  const byContact = new Map<string, SocialConversation>();

  for (const dm of dms) {
    const key =
      dm.contact_external_id ??
      (dm.social_user_id !== null ? String(dm.social_user_id) : "unknown");

    const existing = byContact.get(key);
    if (existing) {
      existing.messages.push(dm);
      existing.lastMessage = dm.content;
      existing.lastMessageAt = dm.external_created_at;
    } else {
      byContact.set(key, {
        contactKey: key,
        contactName:
          dm.contact_name || dm.contact_username || "Unknown contact",
        contactUsername: dm.contact_username,
        contactAvatar: dm.contact_avatar,
        lastMessage: dm.content,
        lastMessageAt: dm.external_created_at,
        messages: [dm],
      });
    }
  }

  return Array.from(byContact.values()).sort((a, b) => {
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return bTime - aTime;
  });
}
