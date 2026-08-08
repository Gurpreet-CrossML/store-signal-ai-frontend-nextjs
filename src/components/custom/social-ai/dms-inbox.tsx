"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { CustomerAvatar } from "@/components/custom/customer-avatar";
import { LoadingState } from "@/components/custom/loading-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import {
  IconArrowBackUp,
  IconArrowDown,
  IconBrandFacebook,
  IconBrandInstagram,
  IconCheck,
  IconClock,
  IconMessage2,
  IconMoodSmile,
  IconPaperclip,
  IconPlus,
  IconSearch,
  IconSelector,
  IconX,
} from "@tabler/icons-react";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { formatRelativeTime } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  ConnectedAccount,
  SocialConversationUser,
  SocialDm,
  fetchSocialAccountsSubscriptions,
  fetchSocialDms,
  fetchSocialUsers,
  reactToMetaMessage,
  replyToMetaMessage,
  socialConversationTouched,
  socialDmReceived,
} from "@/redux/api-slice/social-ai-slice";

import {
  AccountContext,
  AccountIdentity,
  CHANNELS,
  ChannelContext,
  SocialChannel,
  useAccountIdentity,
} from "./channel-context";
import {
  AttachmentPreviewLabel,
  attachmentKind,
  DmAttachments,
  DmAttachmentSkeleton,
  type AttachmentKind,
} from "./dm-attachments";
import { formatPostedAt } from "./format";
import {
  createPendingSend,
  PendingSendStatus,
  type PendingSend,
} from "./pending-send";
import { ReplyBox } from "./reply-box";
import {
  useSocialSocket,
  type SocialSocketEvent,
  type SocialSocketStatus,
} from "./use-social-socket";

const DM_REPLY_TEXTAREA_ID = "dm-reply-textarea";
const QUICK_REACTIONS = ["❤️", "😆", "😮", "😢", "😠", "👍"];

/**
 * A reply shown optimistically, plus everything needed to send it again
 * from the "Try again" link. `expectedCount` is how many outgoing messages
 * with this exact text must exist before this bubble is considered
 * delivered — see the reconciliation note in the component.
 */
type PendingDm = PendingSend & {
  targetMessageId: number;
  isExplicitReply: boolean;
  conversationId: number;
  expectedCount: number;
  files: File[];
};

function countOutgoingWithContent(messages: SocialDm[], content: string) {
  return messages.filter(
    (msg) => msg.message_direction === "outgoing" && msg.content === content,
  ).length;
}

// Minute-resolution clock that's safe under the React Compiler's purity
// rules: Date.now() only ever runs at module load and inside the interval
// callback (an event), never during render — getSnapshot just returns the
// cached value. Also means time-derived UI (the 24h messaging window)
// updates live instead of only on re-render.
let nowCache = Date.now();
function subscribeToNowTick(onStoreChange: () => void) {
  const id = setInterval(() => {
    nowCache = Date.now();
    onStoreChange();
  }, 60_000);
  return () => clearInterval(id);
}
function useNow() {
  return useSyncExternalStore(
    subscribeToNowTick,
    () => nowCache,
    () => nowCache,
  );
}

const CHANNEL_ICON: Record<SocialChannel, typeof IconBrandFacebook> = {
  facebook: IconBrandFacebook,
  instagram: IconBrandInstagram,
};

// One message bubble. Hovering reveals a small react/reply toolbar next to
// it; the react icon opens a quick-pick emoji row, whose "+" swaps to the
// full picker (forced light theme — the popover itself doesn't follow the
// app's dark mode). Reactions are addressed by conversation user + message
// (the backend's nested DM-action URLs), hence the storeCode/userId props.
function DmMessageBubble({
  msg,
  storeCode,
  userId,
  awaitingMedia = false,
  onReacted,
  onReply,
}: {
  msg: SocialDm;
  storeCode: string;
  userId: number;
  // This message arrived over the socket with no text and no attachments,
  // meaning its media is still being written server-side.
  awaitingMedia?: boolean;
  onReacted: () => void;
  onReply: (msg: SocialDm) => void;
}) {
  const dispatch = useAppDispatch();
  const isOutgoing = msg.message_direction === "outgoing";
  const attachments = msg.attachments ?? [];
  const showMediaSkeleton = !attachments.length && awaitingMedia;
  // Keep the bubble for real text, and for a message that has neither text
  // nor media (an unsupported payload shape) so it isn't rendered as blank
  // — but not while media is still on its way.
  const showTextBubble =
    Boolean(msg.content) || (!attachments.length && !awaitingMedia);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showFullPicker, setShowFullPicker] = useState(false);
  // Shown immediately on click; the persisted value (owner_reaction, from
  // the backend) takes over once the refetch after a successful POST lands.
  const [optimisticReaction, setOptimisticReaction] = useState<string | null>(
    null,
  );
  const reaction = msg.owner_reaction ?? optimisticReaction;

  const sendReaction = async (reactionEmoji: string) => {
    setPickerOpen(false);
    setShowFullPicker(false);
    setOptimisticReaction(reactionEmoji);
    try {
      await dispatch(
        reactToMetaMessage({
          storeCode,
          userId,
          messageId: msg.id,
          reaction: reactionEmoji,
        }),
      ).unwrap();
      onReacted();
    } catch {
      setOptimisticReaction(null);
    }
  };

  const actions = (
    <Popover
      open={pickerOpen}
      onOpenChange={(open) => {
        setPickerOpen(open);
        if (!open) setShowFullPicker(false);
      }}
    >
      <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon-xs" aria-label="React">
            <IconMoodSmile className="size-4" />
          </Button>
        </PopoverTrigger>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Reply"
          onClick={() => {
            onReply(msg);
            document.getElementById(DM_REPLY_TEXTAREA_ID)?.focus();
          }}
        >
          <IconArrowBackUp className="size-4" />
        </Button>
      </div>
      <PopoverContent align="center" className="w-auto p-1.5">
        {showFullPicker ? (
          <EmojiPicker
            onEmojiClick={(emoji: EmojiClickData) => sendReaction(emoji.emoji)}
            width={300}
            height={320}
            theme={Theme.LIGHT}
            previewConfig={{ showPreview: false }}
            searchPlaceholder="Search emoji…"
          />
        ) : (
          <div className="flex items-center gap-1">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => sendReaction(emoji)}
                className="rounded-full p-1 text-lg leading-none transition-transform hover:scale-125"
              >
                {emoji}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowFullPicker(true)}
              aria-label="More reactions"
              className="ml-1 flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            >
              <IconPlus className="size-4" />
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );

  return (
    <div className={`flex ${isOutgoing ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex max-w-[70%] flex-col gap-1 ${isOutgoing ? "items-end" : "items-start"}`}
      >
        {msg.reply_to && (
          <div className="max-w-full px-1 text-xs">
            <p className="font-medium text-muted-foreground">
              You replied to{" "}
              <span className="font-semibold text-foreground">
                {msg.reply_to.sender_name || "them"}
              </span>
            </p>
            <p className="mt-0.5 max-w-55 truncate rounded-lg bg-muted px-2 py-1 text-muted-foreground">
              {msg.reply_to.content || "[Attachment]"}
            </p>
          </div>
        )}
        {attachments.length > 0 && (
          <div className="group flex w-full items-center gap-1">
            {isOutgoing && actions}
            {/* The reaction badge hangs off whichever block is the message's
                last — for media with no caption that's the media itself, so
                it can't live only on the text bubble. */}
            <div className="relative min-w-0">
              <DmAttachments
                attachments={attachments}
                align={isOutgoing ? "end" : "start"}
              />
              {reaction && !showTextBubble && (
                <span className="absolute -right-2 -bottom-2 flex size-5 items-center justify-center rounded-full border border-background bg-background text-xs shadow-sm">
                  {reaction}
                </span>
              )}
            </div>
            {!isOutgoing && actions}
          </div>
        )}
        {showMediaSkeleton && (
          <DmAttachmentSkeleton align={isOutgoing ? "end" : "start"} />
        )}
        {/* An attachment-only message has empty content — showing the bubble
            anyway would render an empty box under the media. */}
        {showTextBubble && (
          <div className="group flex items-center gap-1">
            {isOutgoing && actions}
            <div className="relative">
              <div
                className={`rounded-2xl px-3 py-2 text-sm ${
                  isOutgoing ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                <p className="wrap-break-word">
                  {msg.content || "[Attachment]"}
                </p>
              </div>
              {reaction && (
                <span className="absolute -bottom-2 -right-2 flex size-5 items-center justify-center rounded-full border border-background bg-background text-xs shadow-sm">
                  {reaction}
                </span>
              )}
            </div>
            {!isOutgoing && actions}
          </div>
        )}
        <p
          className="px-1 text-xs text-muted-foreground"
          title={
            msg.external_created_at
              ? formatPostedAt(msg.external_created_at)
              : ""
          }
        >
          {msg.external_created_at
            ? formatRelativeTime(msg.external_created_at)
            : ""}
        </p>
      </div>
    </div>
  );
}

/**
 * An outgoing bubble that hasn't been confirmed yet. Styled like a real
 * outgoing message but dimmed, with the send status underneath — the
 * message stays on screen the whole time instead of vanishing until the
 * API answers.
 */
function PendingDmBubble({
  pending,
  onRetry,
}: {
  pending: PendingDm;
  onRetry: () => void;
}) {
  const failed = pending.status === "failed";
  // Local previews for the media being uploaded, so an image-only send
  // shows the image rather than an empty bubble. Created once and revoked
  // on unmount — object URLs leak otherwise.
  const [previews] = useState(() =>
    pending.files.map((file) => ({
      name: file.name,
      isImage: file.type.startsWith("image/"),
      url: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
    })),
  );

  useEffect(() => {
    return () => {
      previews.forEach((preview) => {
        if (preview.url) URL.revokeObjectURL(preview.url);
      });
    };
  }, [previews]);

  return (
    <div className="flex justify-end">
      <div className="flex max-w-[70%] flex-col items-end gap-1">
        {previews.map((preview, index) => (
          <div key={index} className="max-w-full opacity-60">
            {preview.isImage ? (
              // A local object URL — next/image would only add overhead.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview.url}
                alt={preview.name}
                className="max-h-64 rounded-2xl border object-cover"
              />
            ) : (
              <div className="flex items-center gap-2 rounded-2xl border bg-muted/40 px-3 py-2 text-sm">
                <IconPaperclip className="size-4 shrink-0 text-muted-foreground" />
                <span className="max-w-45 truncate">{preview.name}</span>
              </div>
            )}
          </div>
        ))}
        {pending.content && (
          <div
            className={cn(
              "rounded-2xl px-3 py-2 text-sm",
              failed
                ? "bg-muted text-muted-foreground"
                : "bg-primary/60 text-primary-foreground",
            )}
          >
            <p className="wrap-break-word">{pending.content}</p>
          </div>
        )}
        <PendingSendStatus status={pending.status} onRetry={onRetry} />
      </div>
    </div>
  );
}

/**
 * Connected-account switcher in the conversation list header — the same
 * one-row pattern as the store switcher in the app sidebar, so the whole
 * account identity (avatar, name, status) and the switcher itself
 * cost a single row instead of a card plus a separate dropdown.
 */
function AccountSwitcher({
  loading,
  accounts,
  selectedAccount,
  onSelectAccount,
  channelLabel,
  ChannelIcon,
}: {
  loading: boolean;
  accounts: ConnectedAccount[];
  selectedAccount: ConnectedAccount | null;
  onSelectAccount: (accountId: string) => void;
  channelLabel: string;
  ChannelIcon: typeof IconBrandFacebook;
}) {
  const account = useAccountIdentity();

  if (loading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <Skeleton className="aspect-square size-8 rounded-lg" />
            <div className="grid flex-1 gap-1.5">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const subtitle = selectedAccount
    ? [
        account.username && `@${account.username}`,
        selectedAccount.is_active ? "Active" : "Inactive",
      ]
        .filter(Boolean)
        .join(" · ")
    : "No accounts connected";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              disabled={!accounts.length}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {selectedAccount && account.profilePictureUrl ? (
                <Avatar className="size-8 rounded-lg">
                  <AvatarImage
                    src={account.profilePictureUrl}
                    alt={account.name}
                  />
                  <AvatarFallback className="rounded-lg font-medium">
                    {account.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <ChannelIcon className="size-4" />
                </div>
              )}
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {selectedAccount
                    ? account.name
                    : `No ${channelLabel} account`}
                </span>
                <span className="truncate text-xs">{subtitle}</span>
              </div>
              <IconSelector className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {channelLabel} accounts
            </DropdownMenuLabel>
            {accounts.map((acc) => {
              const accountName = acc.name || acc.username || acc.external_id;

              return (
                <DropdownMenuItem
                  key={acc.id}
                  onClick={() => onSelectAccount(String(acc.id))}
                  className="gap-2 p-2"
                >
                  <Avatar className="size-6 shrink-0 rounded-md">
                    {acc.profile_picture_url && (
                      <AvatarImage
                        src={acc.profile_picture_url}
                        alt={accountName}
                      />
                    )}
                    {/* Falls back to the channel mark when the page has no
                        picture, or when Meta's CDN link has expired. */}
                    <AvatarFallback className="rounded-md">
                      <ChannelIcon className="size-3.5" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 truncate">{accountName}</span>
                  {!acc.is_active && (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                  {acc.id === selectedAccount?.id && (
                    <IconCheck className="size-4 shrink-0" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

// Shared inbox screen for one channel: account switcher + conversation list
// (1 col) next to the selected conversation's chat thread (2 cols).
// Data flow mirrors the backend's nesting: connected accounts -> that
// account's DM contacts (users) -> the selected contact's messages.
export default function DmsInbox({
  channelType,
}: {
  channelType: SocialChannel;
}) {
  const channel = CHANNELS[channelType];
  const ChannelIcon = CHANNEL_ICON[channelType];
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const {
    FetchSocialAccountsSubscriptionsData,
    FetchSocialAccountsSubscriptionsIsLoading,
  } = useAppSelector(
    (state) => state.GetSocialAIReducer.FetchSocialAccountSubscriptionsState,
  );
  const { FetchSocialUsersData, FetchSocialUsersIsLoading } = useAppSelector(
    (state) => state.GetSocialAIReducer.FetchSocialUsersState,
  );
  const { FetchSocialDmsData, FetchSocialDmsIsLoading } = useAppSelector(
    (state) => state.GetSocialAIReducer.FetchSocialDmsState,
  );

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );
  const [selectedConversation, setSelectedConversation] = useState<
    number | null
  >(null);
  const [replyingToMessage, setReplyingToMessage] = useState<SocialDm | null>(
    null,
  );
  const [pendingMessages, setPendingMessages] = useState<PendingDm[]>([]);
  // Conversations that received a customer message while they weren't the
  // open one — the whole point of subscribing from the moment the inbox
  // loads rather than when a chat is opened.
  const [unreadConversationIds, setUnreadConversationIds] = useState<number[]>(
    [],
  );
  const [socketStatus, setSocketStatus] =
    useState<SocialSocketStatus>("connecting");
  // Messages the socket delivered before their attachments existed — shown
  // as a media placeholder until the re-read fills them in.
  const [awaitingMediaIds, setAwaitingMediaIds] = useState<number[]>([]);
  // What the last message in a conversation was, when it was media. The
  // conversations endpoint only returns message *text*, so this is the only
  // way the list can say "Photo" instead of a generic "Attachment".
  const [lastAttachmentKinds, setLastAttachmentKinds] = useState<
    Record<number, AttachmentKind>
  >({});

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // The open conversation lives in the URL (?chat=<id>) so a DM can be
  // shared with teammates and deep-linked directly.
  const chatParam = searchParams?.get("chat") ?? null;
  // Last ?chat= value already applied to local state — stops the render-time
  // sync below from re-applying a stale param right after a click updates
  // state but before the router has caught up.
  const [appliedChatParam, setAppliedChatParam] = useState<string | null>(null);

  // Search is server-side (the `search` param on the users-list API,
  // matched against contact name/username) rather than filtering whatever
  // happens to already be loaded — the debounce just avoids firing a
  // request on every keystroke while typing.
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Auto-scroll to the newest message on conversation switch / new
  // messages — but only while the user is already at (or near) the
  // bottom. If they've scrolled up to read older messages, a deliberate
  // scroll away from the bottom should never get yanked back down; the
  // "scroll to latest" button appears instead so they can jump down
  // themselves when they're ready.
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  };

  const handleMessagesScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceFromBottom < 80;
    isNearBottomRef.current = nearBottom;
    setShowScrollButton(!nearBottom);
  };

  const accounts = useMemo(
    () =>
      (FetchSocialAccountsSubscriptionsData?.results ?? []).filter(
        (acc) => acc.channel_type === channelType,
      ),
    [FetchSocialAccountsSubscriptionsData, channelType],
  );
  const selectedAccount: ConnectedAccount | null =
    accounts.find((acc) => String(acc.id) === selectedAccountId) ??
    accounts[0] ??
    null;

  useEffect(() => {
    if (storeCode) {
      dispatch(fetchSocialAccountsSubscriptions(storeCode));
    }
  }, [storeCode, dispatch]);

  // Conversation list: this account's DM contacts, newest activity first.
  useEffect(() => {
    if (storeCode && selectedAccount) {
      dispatch(
        fetchSocialUsers({
          storeCode,
          accountId: selectedAccount.external_id,
          search: debouncedSearchQuery || undefined,
        }),
      );
    }
  }, [storeCode, selectedAccount, debouncedSearchQuery, dispatch]);

  const conversations: SocialConversationUser[] = useMemo(
    () => FetchSocialUsersData?.results ?? [],
    [FetchSocialUsersData],
  );

  // No auto-selection: a conversation opens only via the ?chat= URL param
  // or a click, so "no conversation selected" is a real state.
  let activeConversation =
    conversations.find((user) => user.id === selectedConversation) ?? null;

  // Apply the ?chat= param once the conversation list is available — this
  // is what makes shared DM links open directly. Guarded render-time
  // adjustment; clicks flow the other way (state → URL).
  if (
    chatParam &&
    !FetchSocialUsersIsLoading &&
    appliedChatParam !== chatParam
  ) {
    setAppliedChatParam(chatParam);
    const fromUrl = conversations.find((user) => String(user.id) === chatParam);
    if (fromUrl) {
      setSelectedConversation(fromUrl.id);
      setReplyingToMessage(null);
      activeConversation = fromUrl;
    }
  }

  // A shared ?chat= link pointing at a conversation that isn't in this
  // account's list (wrong account, or a stale link).
  const conversationNotFound =
    !activeConversation &&
    !!chatParam &&
    !FetchSocialUsersIsLoading &&
    !conversations.some((user) => String(user.id) === chatParam);

  // Read the id into its own binding: `activeConversation` is reassigned
  // during render by the URL sync above, so hooks below depend on this
  // stable value rather than a property of a mutable local.
  const activeConversationId = activeConversation?.id ?? null;
  const accountExternalId = selectedAccount?.external_id ?? null;

  // The selected conversation's messages, oldest first.
  useEffect(() => {
    if (storeCode && accountExternalId && activeConversationId) {
      dispatch(
        fetchSocialDms({
          storeCode,
          accountId: accountExternalId,
          userId: activeConversationId,
        }),
      );
    }
  }, [storeCode, accountExternalId, activeConversationId, dispatch]);

  // Guard against the previous conversation's rows flashing while the
  // newly selected one is still fetching: every DM row's social_user is
  // the conversation contact, so drop anything that isn't theirs.
  const messages: SocialDm[] = useMemo(
    () =>
      (FetchSocialDmsData?.results ?? []).filter(
        (msg) => msg.social_user?.id === activeConversationId,
      ),
    [FetchSocialDmsData, activeConversationId],
  );

  const refetchMessages = useCallback(() => {
    if (storeCode && accountExternalId && activeConversationId) {
      dispatch(
        fetchSocialDms({
          storeCode,
          accountId: accountExternalId,
          userId: activeConversationId,
        }),
      );
    }
  }, [storeCode, accountExternalId, activeConversationId, dispatch]);

  // Meta only allows sending outside a paid tag within 24h of the
  // contact's last incoming message ("(#10) This message is sent outside
  // of allowed window."). Compute it client-side from the last incoming
  // message we already have, so the composer can disable itself up front
  // instead of letting the agent hit that error after typing a reply.
  // `now` comes from the ticking clock above, keeping render pure.
  const now = useNow();
  const lastIncomingAt = useMemo(() => {
    const lastIncoming = [...messages]
      .reverse()
      .find((msg) => msg.message_direction === "incoming");
    return lastIncoming?.external_created_at ?? null;
  }, [messages]);
  const messagingWindowOpen =
    !lastIncomingAt ||
    now - new Date(lastIncomingAt).getTime() < 24 * 60 * 60 * 1000;

  // Trigger 1: switching conversations always jumps straight to the
  // latest message, no animation — like opening a fresh thread. The
  // setState lives in the rAF callback, not the effect body, so it can't
  // cascade a synchronous re-render.
  useEffect(() => {
    isNearBottomRef.current = true;
    requestAnimationFrame(() => {
      scrollToBottom("auto");
      setShowScrollButton(false);
    });
  }, [activeConversationId]);

  // Trigger 2: new messages land (a reply just sent, a refetch after
  // reacting, etc.) — only auto-scroll if the user was already at the
  // bottom; someone reading older messages shouldn't get yanked down.
  useEffect(() => {
    if (isNearBottomRef.current) {
      requestAnimationFrame(() => scrollToBottom("smooth"));
    }
  }, [messages.length]);

  const loading =
    FetchSocialAccountsSubscriptionsIsLoading || FetchSocialUsersIsLoading;

  const account: AccountIdentity = selectedAccount
    ? {
        name: selectedAccount.name || channel.accountFallback.name,
        username: selectedAccount.username || "",
        profilePictureUrl: selectedAccount.profile_picture_url || "",
      }
    : channel.accountFallback;

  const activeContactName =
    activeConversation?.name || activeConversation?.username || "Guest";

  // The open conversation's messages are authoritative — use its last one
  // to keep that row's preview correct, including after the delayed
  // attachment re-read replaces a placeholder with real media.
  const activeLastMessage = messages[messages.length - 1];
  const activeLastKind: AttachmentKind | null =
    activeLastMessage && !activeLastMessage.content
      ? (activeLastMessage.attachments ?? []).length
        ? attachmentKind((activeLastMessage.attachments ?? [])[0])
        : "unknown"
      : null;

  const refetchConversations = useCallback(() => {
    if (storeCode && accountExternalId) {
      dispatch(
        fetchSocialUsers({
          storeCode,
          accountId: accountExternalId,
          search: debouncedSearchQuery || undefined,
        }),
      );
    }
  }, [storeCode, accountExternalId, debouncedSearchQuery, dispatch]);

  // Reconcile optimistic bubbles against what actually landed. The backend
  // echoes no correlation id — not in the POST response (which returns only
  // `{status: "success"}`) and not on the socket — so the only key available
  // is "an outgoing message with this exact text". Each pending row records
  // how many such messages existed when it was queued, and clears once one
  // more than that shows up, which keeps repeated identical sends in order.
  const resolvedPendingIds = pendingMessages
    .filter(
      (pending) =>
        pending.conversationId === activeConversationId &&
        // Media-only sends carry no text to match on, so they're resolved
        // by the outgoing message count for empty content instead.
        countOutgoingWithContent(messages, pending.content) >=
          pending.expectedCount,
    )
    .map((pending) => pending.tempId);

  if (resolvedPendingIds.length) {
    setPendingMessages((prev) =>
      prev.filter((pending) => !resolvedPendingIds.includes(pending.tempId)),
    );
  }

  const visiblePendingMessages = pendingMessages.filter(
    (pending) =>
      pending.conversationId === activeConversationId &&
      !resolvedPendingIds.includes(pending.tempId),
  );

  // Lets the delayed attachment re-read above call the latest refetch
  // without making the event handler depend on it.
  const refetchMessagesRef = useRef(refetchMessages);
  useEffect(() => {
    refetchMessagesRef.current = refetchMessages;
  }, [refetchMessages]);

  // Live updates. Actions still go over REST; this stream is what brings
  // their results — and anything a customer sends — back to the screen.
  const handleSocialEvent = useCallback(
    (event: SocialSocketEvent) => {
      if (event.action_type !== "dm_created") return;

      const dm = event.data;
      // The stream carries every connected account on the store.
      if (accountExternalId && dm.account_external_id !== accountExternalId) {
        return;
      }

      const contactId = dm.social_user_id ?? dm.social_user?.id ?? null;
      if (contactId === null) return;

      const dmAttachments = dm.attachments ?? [];
      setLastAttachmentKinds((prev) => {
        // A later text message means the preview is text again.
        if (dm.content) {
          if (!(contactId in prev)) return prev;
          const next = { ...prev };
          delete next[contactId];
          return next;
        }
        const kind: AttachmentKind = dmAttachments.length
          ? attachmentKind(dmAttachments[0])
          : "unknown";
        return prev[contactId] === kind ? prev : { ...prev, [contactId]: kind };
      });

      if (contactId === activeConversationId) {
        dispatch(socialDmReceived(dm));
        // The broadcast is fired by the message's own post_save, which runs
        // BEFORE its attachments are written — a media message therefore
        // arrives with an empty list. Re-read it once the sync has landed,
        // and mark it so the bubble shows a media placeholder meanwhile
        // instead of a "[Attachment]" bubble that swaps out a moment later.
        if (!dm.content && !(dm.attachments ?? []).length) {
          const messageId = dm.id;
          setAwaitingMediaIds((prev) =>
            prev.includes(messageId) ? prev : [...prev, messageId],
          );
          // Attachments are written immediately after the broadcast inside
          // the same webhook request, so the first re-read almost always
          // has them; the second only covers a slow one.
          setTimeout(() => refetchMessagesRef.current(), 400);
          setTimeout(() => {
            refetchMessagesRef.current();
            // Stop waiting either way — a message that still has nothing is
            // genuinely empty, not pending.
            setAwaitingMediaIds((prev) =>
              prev.filter((id) => id !== messageId),
            );
          }, 2_500);
        }
      } else if (dm.message_direction === "incoming") {
        setUnreadConversationIds((prev) =>
          prev.includes(contactId) ? prev : [...prev, contactId],
        );
      }
      dispatch(
        socialConversationTouched({
          userId: contactId,
          lastMessage: dm.content,
          lastMessageAt: dm.external_created_at,
        }),
      );
      // A contact who isn't in the list yet is a brand-new conversation;
      // only a refetch can supply their profile.
      if (!conversations.some((user) => user.id === contactId)) {
        refetchConversations();
      }
    },
    [
      accountExternalId,
      activeConversationId,
      conversations,
      dispatch,
      refetchConversations,
    ],
  );

  // Nothing is buffered while disconnected (Redis pub/sub, no replay), so a
  // reconnect has to re-read the current state rather than resume.
  const handleSocketReconnect = useCallback(() => {
    refetchConversations();
    refetchMessages();
  }, [refetchConversations, refetchMessages]);

  useSocialSocket({
    storeCode,
    onEvent: handleSocialEvent,
    onReconnect: handleSocketReconnect,
    onStatusChange: setSocketStatus,
  });

  /**
   * Sends one reply and drives its pending bubble. The row is already on
   * screen before this runs, so the only job here is to mark it failed if
   * the API rejects it — on success it stays "Sending…" until the real
   * message arrives (websocket echo, or the refetch as a fallback), which
   * is what removes it.
   */
  const sendReply = async (
    pending: PendingDm,
    targetMessageId: number,
    isExplicitReply: boolean,
    conversationId: number,
  ) => {
    if (!storeCode) return;
    try {
      await dispatch(
        replyToMetaMessage({
          storeCode,
          userId: conversationId,
          messageId: targetMessageId,
          message: pending.content,
          isExplicitReply,
          attachments: pending.files,
        }),
      ).unwrap();
      refetchMessages();
    } catch {
      // The thunk already surfaces the error toast.
      setPendingMessages((prev) =>
        prev.map((item) =>
          item.tempId === pending.tempId
            ? { ...item, status: "failed" as const }
            : item,
        ),
      );
    }
  };

  const handleReply = (text: string, files: File[] = []) => {
    if (
      !activeConversation ||
      !storeCode ||
      !selectedAccount ||
      !messages.length
    )
      return;
    const lastMessage = messages[messages.length - 1];
    // A general "type and send" has no specific message the agent chose
    // to reply to — the last message just anchors the Send API call so
    // it knows who to send to. Only a deliberate reply (via a message's
    // own Reply icon) should ever show a "You replied to ..." quote.
    const isExplicitReply = replyingToMessage !== null;
    const targetMessageId = replyingToMessage?.id ?? lastMessage.id;
    const conversationId = activeConversation.id;

    // How many identical outgoing messages must exist before this one is
    // considered delivered: what's on screen now, plus any still in flight
    // with the same text, plus this one.
    const expectedCount =
      countOutgoingWithContent(messages, text) +
      pendingMessages.filter(
        (item) =>
          item.content === text && item.conversationId === conversationId,
      ).length +
      1;

    const pending: PendingDm = {
      ...createPendingSend(text),
      targetMessageId,
      isExplicitReply,
      conversationId,
      expectedCount,
      files,
    };

    setPendingMessages((prev) => [...prev, pending]);
    setReplyingToMessage(null);

    void sendReply(pending, targetMessageId, isExplicitReply, conversationId);
  };

  const handleRetryPending = (tempId: string) => {
    const pending = pendingMessages.find((item) => item.tempId === tempId);
    if (!pending) return;
    setPendingMessages((prev) =>
      prev.map((item) =>
        item.tempId === tempId ? { ...item, status: "sending" as const } : item,
      ),
    );
    void sendReply(
      { ...pending, status: "sending" },
      pending.targetMessageId,
      pending.isExplicitReply,
      pending.conversationId,
    );
  };

  const handleSelectConversation = (userId: number) => {
    setSelectedConversation(userId);
    setReplyingToMessage(null);
    setUnreadConversationIds((prev) => prev.filter((id) => id !== userId));
    setAppliedChatParam(String(userId));
    router.replace(`${pathname}?chat=${userId}`, { scroll: false });
  };

  return (
    <ChannelContext.Provider value={channel}>
      <AccountContext.Provider value={account}>
        {/* Same three-part shell as Live Support: a flush conversation list
            beside the open thread, filling the viewport below the header.
            The negative margins escape the layout's page padding. */}
        <SidebarProvider
          style={{ "--sidebar-width": "350px" } as CSSProperties}
          className="-my-4 h-[calc(100svh-4rem)] min-h-0 w-full overflow-hidden md:-my-6"
        >
          <Sidebar collapsible="none" className="hidden border-r md:flex">
            <SidebarHeader className="gap-3.5 border-b p-4">
              <AccountSwitcher
                loading={FetchSocialAccountsSubscriptionsIsLoading}
                accounts={accounts}
                selectedAccount={selectedAccount}
                onSelectAccount={setSelectedAccountId}
                channelLabel={channel.label}
                ChannelIcon={ChannelIcon}
              />

              <SidebarInput
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search conversations…"
              />

              {/* The list stops being live while the stream is down, so say
                  so rather than showing stale data as if it were current. */}
              {socketStatus === "reconnecting" && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Spinner className="size-3" />
                  Reconnecting — new messages may be delayed
                </p>
              )}
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup className="px-0">
                <SidebarGroupContent>
                  {loading ? (
                    <LoadingState label="Loading conversations…" />
                  ) : !accounts.length ? (
                    <div className="p-4 text-center">
                      <Typography variant="muted">
                        No {channel.label} accounts connected for this store.
                      </Typography>
                    </div>
                  ) : conversations.length ? (
                    conversations.map((conversation) => {
                      const isSelected =
                        conversation.id === activeConversationId;
                      const isUnread = unreadConversationIds.includes(
                        conversation.id,
                      );
                      // Prefer what the open thread actually shows, then
                      // anything seen live, then a generic attachment.
                      const previewKind: AttachmentKind =
                        (isSelected ? activeLastKind : null) ??
                        lastAttachmentKinds[conversation.id] ??
                        "unknown";
                      const rawName =
                        conversation.name || conversation.username || "";

                      return (
                        <button
                          key={conversation.id}
                          type="button"
                          onClick={() =>
                            handleSelectConversation(conversation.id)
                          }
                          className={cn(
                            "flex w-full items-start gap-3 border-b p-4 text-left text-sm leading-tight transition-colors last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            isSelected &&
                              "bg-sidebar-accent text-sidebar-accent-foreground",
                          )}
                        >
                          <CustomerAvatar name={rawName} />
                          <div className="min-w-0 flex-1">
                            <div className="flex w-full items-center gap-2">
                              <span
                                className={cn(
                                  "truncate",
                                  isUnread ? "font-semibold" : "font-medium",
                                  !rawName && "text-muted-foreground",
                                )}
                              >
                                {rawName || "Guest"}
                              </span>
                              <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                                {conversation.last_message_at
                                  ? formatRelativeTime(
                                      conversation.last_message_at,
                                    )
                                  : ""}
                              </span>
                              {isUnread && (
                                <span className="size-2 shrink-0 rounded-full bg-primary" />
                              )}
                            </div>
                            <div
                              className={cn(
                                "mt-1 line-clamp-2 text-xs",
                                isUnread
                                  ? "font-medium text-foreground/80"
                                  : "text-muted-foreground",
                              )}
                            >
                              {conversation.last_message ? (
                                conversation.last_message
                              ) : (
                                <AttachmentPreviewLabel kind={previewKind} />
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  ) : debouncedSearchQuery ? (
                    <div className="flex flex-col items-center justify-center gap-1 p-6 text-center">
                      <IconSearch className="mb-1 size-6 text-muted-foreground opacity-40" />
                      <Typography variant="small" as="p">
                        No matches
                      </Typography>
                      <Typography variant="muted">
                        No conversations match &quot;{debouncedSearchQuery}
                        &quot;.
                      </Typography>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1 p-6 text-center">
                      <IconMessage2 className="mb-1 size-6 text-muted-foreground opacity-40" />
                      <Typography variant="small" as="p">
                        No conversations yet
                      </Typography>
                      <Typography variant="muted">
                        Direct messages for this account will show up here.
                      </Typography>
                    </div>
                  )}
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>

          <SidebarInset className="min-h-0 overflow-hidden">
            {activeConversation ? (
              <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
                <header className="flex h-16 shrink-0 items-center border-b bg-background px-4">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <CustomerAvatar
                      name={
                        activeConversation.name || activeConversation.username
                      }
                    />
                    <div className="min-w-0">
                      <CardTitle className="truncate leading-tight">
                        {activeContactName}
                      </CardTitle>
                      {activeConversation.username && (
                        <Typography variant="muted" className="truncate">
                          @{activeConversation.username}
                        </Typography>
                      )}
                    </div>
                  </div>
                </header>

                <div className="relative min-h-0 flex-1">
                  <div
                    ref={messagesContainerRef}
                    onScroll={handleMessagesScroll}
                    className="h-full space-y-3 overflow-y-auto p-4"
                  >
                    {FetchSocialDmsIsLoading && !messages.length ? (
                      <div className="flex h-full items-center justify-center">
                        <LoadingState label="Loading messages…" />
                      </div>
                    ) : messages.length || visiblePendingMessages.length ? (
                      <>
                        {messages.map((msg) => (
                          <DmMessageBubble
                            key={msg.id}
                            msg={msg}
                            storeCode={storeCode}
                            userId={activeConversation.id}
                            awaitingMedia={awaitingMediaIds.includes(msg.id)}
                            onReacted={refetchMessages}
                            onReply={setReplyingToMessage}
                          />
                        ))}
                        {visiblePendingMessages.map((pending) => (
                          <PendingDmBubble
                            key={pending.tempId}
                            pending={pending}
                            onRetry={() => handleRetryPending(pending.tempId)}
                          />
                        ))}
                      </>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-1 p-6 text-center">
                        <IconMessage2 className="mb-1 size-6 text-muted-foreground opacity-40" />
                        <Typography variant="small" as="p">
                          Nothing here yet
                        </Typography>
                        <Typography variant="muted">
                          Messages in this conversation will show up here.
                        </Typography>
                      </div>
                    )}
                  </div>
                  {showScrollButton && (
                    <button
                      type="button"
                      onClick={() => {
                        scrollToBottom("smooth");
                        setShowScrollButton(false);
                        isNearBottomRef.current = true;
                      }}
                      aria-label="Scroll to latest messages"
                      className="absolute bottom-3 left-1/2 flex size-9 -translate-x-1/2 items-center justify-center rounded-full border border-border/60 bg-background text-foreground shadow-md transition hover:bg-muted"
                    >
                      <IconArrowDown className="size-4" />
                    </button>
                  )}
                </div>

                <div className="shrink-0 border-t bg-background p-4">
                  {replyingToMessage && (
                    <div className="mb-2 flex items-start justify-between gap-2 rounded-xl border bg-muted/30 p-3">
                      <div className="min-w-0">
                        <Typography
                          variant="small"
                          as="p"
                          className="leading-normal"
                        >
                          Replying to{" "}
                          {replyingToMessage.message_direction === "outgoing"
                            ? "yourself"
                            : activeContactName}
                        </Typography>
                        <Typography variant="muted" className="truncate">
                          {replyingToMessage.content || "[Attachment]"}
                        </Typography>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReplyingToMessage(null)}
                        aria-label="Cancel reply"
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                      >
                        <IconX className="size-4" />
                      </button>
                    </div>
                  )}
                  {!messagingWindowOpen && (
                    <div className="mb-2 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
                      <IconClock className="mt-0.5 size-5 shrink-0" />
                      <div className="min-w-0">
                        <Typography
                          variant="small"
                          as="p"
                          className="leading-normal"
                        >
                          Replies are closed for now
                        </Typography>
                        <p className="text-sm">
                          Meta only allows replies within 24 hours of the
                          customer&apos;s last message, and it&apos;s been
                          longer than that. You can reply again once{" "}
                          {activeContactName} messages you.
                        </p>
                      </div>
                    </div>
                  )}
                  <ReplyBox
                    replyingTo={activeContactName}
                    allowAttachments
                    onSubmit={handleReply}
                    textareaId={DM_REPLY_TEXTAREA_ID}
                    placeholder={
                      messagingWindowOpen
                        ? "Type your reply…"
                        : "Messaging window closed"
                    }
                    disabled={!messagingWindowOpen}
                  />
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-1 p-6 text-center">
                <IconMessage2 className="mb-1 size-6 text-muted-foreground opacity-40" />
                <Typography variant="small" as="p">
                  {conversationNotFound
                    ? "Conversation not found"
                    : "No conversation selected"}
                </Typography>
                <Typography variant="muted">
                  {conversationNotFound
                    ? "It may belong to another account. Pick one from the list."
                    : "Select a conversation from the list to open the messages."}
                </Typography>
              </div>
            )}
          </SidebarInset>
        </SidebarProvider>
      </AccountContext.Provider>
    </ChannelContext.Provider>
  );
}
