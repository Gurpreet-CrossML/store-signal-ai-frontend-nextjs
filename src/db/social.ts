import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { getDb } from "@/lib/tenant-context";
import { storeIdScope } from "@/db/access";
import {
  socialConnectedAccount,
  socialMessage,
  socialPost,
  socialPostMedia,
  socialReaction,
  socialSubscription,
  socialUser,
} from "@/lib/drizzle/schema";

/**
 * Reactions for a batch of messages, split by who reacted. `social_reaction`
 * allows at most one owner (agent) reaction and one contact reaction per
 * message (DB unique indexes), so a plain map per side is enough — no fan-out
 * risk the way joining it directly into the message select would have.
 */
async function reactionsByMessage(messageIds: number[]): Promise<{
  owner: Map<number, string>;
  contact: Map<number, string>;
}> {
  const owner = new Map<number, string>();
  const contact = new Map<number, string>();
  if (messageIds.length === 0) return { owner, contact };

  const db = getDb();
  const reactions = await db
    .select({
      message_id: socialReaction.messageId,
      is_owner_reaction: socialReaction.isOwnerReaction,
      emoji: socialReaction.emoji,
    })
    .from(socialReaction)
    .where(inArray(socialReaction.messageId, messageIds));

  for (const r of reactions) {
    (r.is_owner_reaction ? owner : contact).set(r.message_id, r.emoji);
  }
  return { owner, contact };
}

/**
 * Read-only access to the `social_*` tables (ingested by the Django/webhook
 * pipeline, never written from here). Facebook only for now — Instagram reuses
 * the same tables/shape once its webhook ingestion lands, so these helpers take
 * `channelType` as a literal rather than being duplicated per platform.
 *
 * Every helper is scoped to the caller's accessible stores via the connected
 * account's `social_subscription.store_id` (F3), the same pattern as
 * `src/db/access.ts` uses for stores/threads.
 */

export type FacebookPageRow = {
  id: number;
  external_id: string;
  name: string;
  username: string;
  profile_picture_url: string;
  webhook_status: string;
  is_active: boolean;
  last_event_at: string | null;
};

/** Connected Facebook pages ("Connect Accounts" table), for the page dropdown. */
export async function list_facebook_pages(
  store_code?: string,
): Promise<FacebookPageRow[]> {
  const db = getDb();
  const scope = storeIdScope(socialSubscription.storeId, store_code);
  const conditions = [eq(socialConnectedAccount.channelType, "facebook")];
  if (scope) conditions.push(scope);

  return db
    .select({
      id: socialConnectedAccount.id,
      external_id: socialConnectedAccount.externalId,
      name: socialConnectedAccount.name,
      username: socialConnectedAccount.username,
      profile_picture_url: socialConnectedAccount.profilePictureUrl,
      webhook_status: socialConnectedAccount.webhookStatus,
      is_active: socialConnectedAccount.isActive,
      last_event_at: socialConnectedAccount.lastEventAt,
    })
    .from(socialConnectedAccount)
    .innerJoin(
      socialSubscription,
      eq(socialConnectedAccount.subscriptionId, socialSubscription.id),
    )
    .where(and(...conditions))
    .orderBy(asc(socialConnectedAccount.name));
}

/** `id` of the requested account, iff it's a Facebook page in an accessible store. */
async function get_accessible_facebook_page(
  account_id: number,
  store_code?: string,
): Promise<{ id: number } | null> {
  const db = getDb();
  const scope = storeIdScope(socialSubscription.storeId, store_code);
  const conditions = [
    eq(socialConnectedAccount.id, account_id),
    eq(socialConnectedAccount.channelType, "facebook"),
  ];
  if (scope) conditions.push(scope);

  const rows = await db
    .select({ id: socialConnectedAccount.id })
    .from(socialConnectedAccount)
    .innerJoin(
      socialSubscription,
      eq(socialConnectedAccount.subscriptionId, socialSubscription.id),
    )
    .where(and(...conditions))
    .limit(1);

  return rows[0] ?? null;
}

export type FacebookPostRow = {
  id: number;
  external_id: string;
  content: string;
  permalink: string;
  media_type: string;
  like_count: number | null;
  comments_count: number;
  posted_at: string;
  is_published: boolean;
  image_url: string | null;
};

/** Posts for one Facebook page ("Social post" table), newest first. */
export async function list_facebook_posts(
  account_id: number,
  store_code?: string,
): Promise<FacebookPostRow[]> {
  const db = getDb();
  const account = await get_accessible_facebook_page(account_id, store_code);
  if (!account) return [];

  const posts = await db
    .select({
      id: socialPost.id,
      external_id: socialPost.externalId,
      content: socialPost.content,
      permalink: socialPost.permalink,
      media_type: socialPost.mediaType,
      like_count: socialPost.likeCount,
      comments_count: socialPost.commentsCount,
      posted_at: socialPost.postedAt,
      is_published: socialPost.isPublished,
    })
    .from(socialPost)
    .where(eq(socialPost.accountId, account_id))
    .orderBy(desc(socialPost.postedAt));

  if (posts.length === 0) return [];

  // Fetched separately (rather than joined) so a post with multiple media rows
  // doesn't fan out into duplicate post rows; we only need the lead image here.
  const media = await db
    .select({
      post_id: socialPostMedia.postId,
      url: socialPostMedia.url,
      thumbnail_url: socialPostMedia.thumbnailUrl,
    })
    .from(socialPostMedia)
    .where(
      inArray(
        socialPostMedia.postId,
        posts.map((p) => p.id),
      ),
    )
    .orderBy(asc(socialPostMedia.position));

  const leadImageByPost = new Map<number, string | null>();
  for (const m of media) {
    if (!leadImageByPost.has(m.post_id)) {
      leadImageByPost.set(m.post_id, m.thumbnail_url || m.url || null);
    }
  }

  return posts.map((post) => ({
    ...post,
    image_url: leadImageByPost.get(post.id) ?? null,
  }));
}

export type FacebookCommentRow = {
  id: number;
  external_message_id: string;
  sender_type: string;
  message_direction: string;
  content: string;
  like_count: number;
  is_hidden: boolean;
  external_created_at: string | null;
  post_id: number | null;
  social_user_id: number | null;
  author_name: string | null;
  author_username: string | null;
  author_avatar: string | null;
};

/** Comments on one Facebook post (`social_message` where message_type = 'comment'). */
export async function list_facebook_comments(
  post_id: number,
  store_code?: string,
): Promise<FacebookCommentRow[]> {
  const db = getDb();
  const scope = storeIdScope(socialSubscription.storeId, store_code);
  const conditions = [
    eq(socialMessage.postId, post_id),
    eq(socialMessage.messageType, "comment"),
    eq(socialConnectedAccount.channelType, "facebook"),
  ];
  if (scope) conditions.push(scope);

  return db
    .select({
      id: socialMessage.id,
      external_message_id: socialMessage.externalMessageId,
      sender_type: socialMessage.senderType,
      message_direction: socialMessage.messageDirection,
      content: socialMessage.content,
      like_count: socialMessage.likeCount,
      is_hidden: socialMessage.isHidden,
      external_created_at: socialMessage.externalCreatedAt,
      post_id: socialMessage.postId,
      social_user_id: socialMessage.socialUserId,
      author_name: socialUser.name,
      author_username: socialUser.username,
      author_avatar: socialUser.profilePictureUrl,
    })
    .from(socialMessage)
    .innerJoin(
      socialConnectedAccount,
      eq(socialMessage.accountId, socialConnectedAccount.id),
    )
    .innerJoin(
      socialSubscription,
      eq(socialConnectedAccount.subscriptionId, socialSubscription.id),
    )
    .leftJoin(socialUser, eq(socialMessage.socialUserId, socialUser.id))
    .where(and(...conditions))
    .orderBy(desc(socialMessage.externalCreatedAt));
}

export type FacebookDmRow = {
  id: number;
  external_message_id: string;
  sender_type: string;
  message_direction: string;
  content: string;
  external_created_at: string | null;
  social_user_id: number | null;
  contact_external_id: string | null;
  contact_name: string | null;
  contact_username: string | null;
  contact_avatar: string | null;
  owner_reaction: string | null;
  contact_reaction: string | null;
};

/**
 * DMs for one Facebook page — same `social_message` table as comments, just
 * filtered by `message_type = 'dm'` instead of `'comment'`. Returned oldest
 * first (chat order); the client groups rows by `social_user_id` into the
 * conversation list and per-contact threads.
 */
export async function list_facebook_dms(
  account_id: number,
  store_code?: string,
): Promise<FacebookDmRow[]> {
  const db = getDb();
  const account = await get_accessible_facebook_page(account_id, store_code);
  if (!account) return [];

  const dms = await db
    .select({
      id: socialMessage.id,
      external_message_id: socialMessage.externalMessageId,
      sender_type: socialMessage.senderType,
      message_direction: socialMessage.messageDirection,
      content: socialMessage.content,
      external_created_at: socialMessage.externalCreatedAt,
      social_user_id: socialMessage.socialUserId,
      contact_external_id: socialUser.externalId,
      contact_name: socialUser.name,
      contact_username: socialUser.username,
      contact_avatar: socialUser.profilePictureUrl,
    })
    .from(socialMessage)
    .leftJoin(socialUser, eq(socialMessage.socialUserId, socialUser.id))
    .where(
      and(
        eq(socialMessage.accountId, account_id),
        eq(socialMessage.messageType, "dm"),
      ),
    )
    .orderBy(asc(socialMessage.externalCreatedAt));

  if (dms.length === 0) return [];

  const { owner, contact } = await reactionsByMessage(dms.map((d) => d.id));

  return dms.map((dm) => ({
    ...dm,
    owner_reaction: owner.get(dm.id) ?? null,
    contact_reaction: contact.get(dm.id) ?? null,
  }));
}

export type InstagramPageRow = {
  id: number;
  external_id: string;
  name: string;
  username: string;
  profile_picture_url: string;
  webhook_status: string;
  is_active: boolean;
  last_event_at: string | null;
};

export async function list_instagram_pages(
  store_code?: string,
): Promise<InstagramPageRow[]> {
  const db = getDb();
  const scope = storeIdScope(socialSubscription.storeId, store_code);
  const conditions = [eq(socialConnectedAccount.channelType, "instagram")];
  if (scope) conditions.push(scope);

  return db
    .select({
      id: socialConnectedAccount.id,
      external_id: socialConnectedAccount.externalId,
      name: socialConnectedAccount.name,
      username: socialConnectedAccount.username,
      profile_picture_url: socialConnectedAccount.profilePictureUrl,
      webhook_status: socialConnectedAccount.webhookStatus,
      is_active: socialConnectedAccount.isActive,
      last_event_at: socialConnectedAccount.lastEventAt,
    })
    .from(socialConnectedAccount)
    .innerJoin(
      socialSubscription,
      eq(socialConnectedAccount.subscriptionId, socialSubscription.id),
    )
    .where(and(...conditions))
    .orderBy(asc(socialConnectedAccount.name));
}

async function get_accessible_instagram_page(
  account_id: number,
  store_code?: string,
): Promise<{ id: number } | null> {
  const db = getDb();
  const scope = storeIdScope(socialSubscription.storeId, store_code);
  const conditions = [
    eq(socialConnectedAccount.id, account_id),
    eq(socialConnectedAccount.channelType, "instagram"),
  ];
  if (scope) conditions.push(scope);

  const rows = await db
    .select({ id: socialConnectedAccount.id })
    .from(socialConnectedAccount)
    .innerJoin(
      socialSubscription,
      eq(socialConnectedAccount.subscriptionId, socialSubscription.id),
    )
    .where(and(...conditions))
    .limit(1);

  return rows[0] ?? null;
}

export type InstagramPostRow = {
  id: number;
  external_id: string;
  content: string;
  permalink: string;
  media_type: string;
  like_count: number | null;
  comments_count: number;
  posted_at: string;
  is_published: boolean;
  image_url: string | null;
};

export async function list_instagram_posts(
  account_id: number,
  store_code?: string,
): Promise<InstagramPostRow[]> {
  const db = getDb();
  const account = await get_accessible_instagram_page(account_id, store_code);
  if (!account) return [];

  const posts = await db
    .select({
      id: socialPost.id,
      external_id: socialPost.externalId,
      content: socialPost.content,
      permalink: socialPost.permalink,
      media_type: socialPost.mediaType,
      like_count: socialPost.likeCount,
      comments_count: socialPost.commentsCount,
      posted_at: socialPost.postedAt,
      is_published: socialPost.isPublished,
    })
    .from(socialPost)
    .where(eq(socialPost.accountId, account_id))
    .orderBy(desc(socialPost.postedAt));

  if (posts.length === 0) return [];

  const media = await db
    .select({
      post_id: socialPostMedia.postId,
      url: socialPostMedia.url,
      thumbnail_url: socialPostMedia.thumbnailUrl,
    })
    .from(socialPostMedia)
    .where(
      inArray(
        socialPostMedia.postId,
        posts.map((p) => p.id),
      ),
    )
    .orderBy(asc(socialPostMedia.position));

  const leadImageByPost = new Map<number, string | null>();
  for (const m of media) {
    if (!leadImageByPost.has(m.post_id)) {
      leadImageByPost.set(m.post_id, m.thumbnail_url || m.url || null);
    }
  }

  return posts.map((post) => ({
    ...post,
    image_url: leadImageByPost.get(post.id) ?? null,
  }));
}

export type InstagramCommentRow = {
  id: number;
  external_message_id: string;
  sender_type: string;
  message_direction: string;
  content: string;
  like_count: number;
  is_hidden: boolean;
  external_created_at: string | null;
  post_id: number | null;
  social_user_id: number | null;
  author_name: string | null;
  author_username: string | null;
  author_avatar: string | null;
};

export async function list_instagram_comments(
  post_id: number,
  store_code?: string,
): Promise<InstagramCommentRow[]> {
  const db = getDb();
  const scope = storeIdScope(socialSubscription.storeId, store_code);
  const conditions = [
    eq(socialMessage.postId, post_id),
    eq(socialMessage.messageType, "comment"),
    eq(socialConnectedAccount.channelType, "instagram"),
  ];
  if (scope) conditions.push(scope);

  return db
    .select({
      id: socialMessage.id,
      external_message_id: socialMessage.externalMessageId,
      sender_type: socialMessage.senderType,
      message_direction: socialMessage.messageDirection,
      content: socialMessage.content,
      like_count: socialMessage.likeCount,
      is_hidden: socialMessage.isHidden,
      external_created_at: socialMessage.externalCreatedAt,
      post_id: socialMessage.postId,
      social_user_id: socialMessage.socialUserId,
      author_name: socialUser.name,
      author_username: socialUser.username,
      author_avatar: socialUser.profilePictureUrl,
    })
    .from(socialMessage)
    .innerJoin(
      socialConnectedAccount,
      eq(socialMessage.accountId, socialConnectedAccount.id),
    )
    .innerJoin(
      socialSubscription,
      eq(socialConnectedAccount.subscriptionId, socialSubscription.id),
    )
    .leftJoin(socialUser, eq(socialMessage.socialUserId, socialUser.id))
    .where(and(...conditions))
    .orderBy(desc(socialMessage.externalCreatedAt));
}

export type InstagramDmRow = {
  id: number;
  external_message_id: string;
  sender_type: string;
  message_direction: string;
  content: string;
  external_created_at: string | null;
  social_user_id: number | null;
  contact_external_id: string | null;
  contact_name: string | null;
  contact_username: string | null;
  contact_avatar: string | null;
  owner_reaction: string | null;
  contact_reaction: string | null;
};

export async function list_instagram_dms(
  account_id: number,
  store_code?: string,
): Promise<InstagramDmRow[]> {
  const db = getDb();
  const account = await get_accessible_instagram_page(account_id, store_code);
  if (!account) return [];

  const dms = await db
    .select({
      id: socialMessage.id,
      external_message_id: socialMessage.externalMessageId,
      sender_type: socialMessage.senderType,
      message_direction: socialMessage.messageDirection,
      content: socialMessage.content,
      external_created_at: socialMessage.externalCreatedAt,
      social_user_id: socialMessage.socialUserId,
      contact_external_id: socialUser.externalId,
      contact_name: socialUser.name,
      contact_username: socialUser.username,
      contact_avatar: socialUser.profilePictureUrl,
    })
    .from(socialMessage)
    .leftJoin(socialUser, eq(socialMessage.socialUserId, socialUser.id))
    .where(
      and(
        eq(socialMessage.accountId, account_id),
        eq(socialMessage.messageType, "dm"),
      ),
    )
    .orderBy(asc(socialMessage.externalCreatedAt));

  if (dms.length === 0) return [];

  const { owner, contact } = await reactionsByMessage(dms.map((d) => d.id));

  return dms.map((dm) => ({
    ...dm,
    owner_reaction: owner.get(dm.id) ?? null,
    contact_reaction: contact.get(dm.id) ?? null,
  }));
}
