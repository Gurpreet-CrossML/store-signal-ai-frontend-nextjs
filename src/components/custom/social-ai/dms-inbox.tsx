"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { CustomerAvatar } from "@/components/custom/customer-avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import {
  IconArrowBackUp,
  IconArrowDown,
  IconBrandFacebook,
  IconBrandInstagram,
  IconClock,
  IconMessage2,
  IconMoodSmile,
  IconPlus,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { formatRelativeTime } from "@/lib/helpers";
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
} from "@/redux/api-slice/social-ai-slice";

import { AccountCard } from "./account-card";
import {
  AccountContext,
  AccountIdentity,
  CHANNELS,
  ChannelContext,
  SocialChannel,
} from "./channel-context";
import { formatPostedAt } from "./format";
import { ReplyBox } from "./reply-box";

const DM_REPLY_TEXTAREA_ID = "dm-reply-textarea";
const QUICK_REACTIONS = ["❤️", "😆", "😮", "😢", "😠", "👍"];

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
  onReacted,
  onReply,
}: {
  msg: SocialDm;
  storeCode: string;
  userId: number;
  onReacted: () => void;
  onReply: (msg: SocialDm) => void;
}) {
  const dispatch = useAppDispatch();
  const isOutgoing = msg.message_direction === "outgoing";
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
            <p className="mt-0.5 max-w-[220px] truncate rounded-lg bg-muted px-2 py-1 text-muted-foreground">
              {msg.reply_to.content || "[Attachment]"}
            </p>
          </div>
        )}
        <div className="group flex items-center gap-1">
          {isOutgoing && actions}
          <div className="relative">
            <div
              className={`rounded-2xl px-3 py-2 text-sm ${
                isOutgoing ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              <p>{msg.content || "[Attachment]"}</p>
            </div>
            {reaction && (
              <span className="absolute -bottom-2 -right-2 flex size-5 items-center justify-center rounded-full border border-background bg-background text-xs shadow-sm">
                {reaction}
              </span>
            )}
          </div>
          {!isOutgoing && actions}
        </div>
        <p
          className="px-1 text-[10px] text-muted-foreground"
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

  const activeConversation =
    conversations.find((user) => user.id === selectedConversation) ??
    conversations[0] ??
    null;

  // The selected conversation's messages, oldest first.
  useEffect(() => {
    if (storeCode && selectedAccount && activeConversation) {
      dispatch(
        fetchSocialDms({
          storeCode,
          accountId: selectedAccount.external_id,
          userId: activeConversation.id,
        }),
      );
    }
  }, [storeCode, selectedAccount, activeConversation, dispatch]);

  // Guard against the previous conversation's rows flashing while the
  // newly selected one is still fetching: every DM row's social_user is
  // the conversation contact, so drop anything that isn't theirs.
  const messages: SocialDm[] = useMemo(
    () =>
      (FetchSocialDmsData?.results ?? []).filter(
        (msg) => msg.social_user?.id === activeConversation?.id,
      ),
    [FetchSocialDmsData, activeConversation?.id],
  );

  const refetchMessages = () => {
    if (storeCode && selectedAccount && activeConversation) {
      dispatch(
        fetchSocialDms({
          storeCode,
          accountId: selectedAccount.external_id,
          userId: activeConversation.id,
        }),
      );
    }
  };

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
  }, [activeConversation?.id]);

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
    activeConversation?.name || activeConversation?.username || "Unknown";

  const handleReply = async (text: string) => {
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
    try {
      await dispatch(
        replyToMetaMessage({
          storeCode,
          userId: activeConversation.id,
          messageId: targetMessageId,
          message: text,
          isExplicitReply,
        }),
      ).unwrap();
      setReplyingToMessage(null);
      refetchMessages();
    } catch {
      // The thunk already surfaces the error toast.
    }
  };

  const handleSelectConversation = (userId: number) => {
    setSelectedConversation(userId);
    setReplyingToMessage(null);
  };

  return (
    <ChannelContext.Provider value={channel}>
      <AccountContext.Provider value={account}>
        <div className="flex flex-col h-full flex-1 gap-4 min-h-0 bg-background overflow-hidden p-4">
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-[320px_minmax(0,1fr)]">
            <div className="flex flex-col gap-4 min-h-0">
              <AccountCard
                loading={FetchSocialAccountsSubscriptionsIsLoading}
                accounts={accounts}
                selectedAccount={selectedAccount}
                onSelectAccount={setSelectedAccountId}
                className="md:w-full"
              />
              <Card className="flex min-h-0 flex-1 flex-col overflow-hidden h-[88vh]!">
                <div className="border-b border-border/50 p-3">
                  <div className="relative">
                    <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search conversations…"
                      className="h-8 w-full rounded-md border border-input bg-muted/40 pl-8 pr-3 text-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1.5">
                  {loading ? (
                    <div className="flex h-full items-center justify-center">
                      <Spinner />
                    </div>
                  ) : !accounts.length ? (
                    <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                      No connected {channel.label} accounts for this store.
                    </div>
                  ) : !conversations.length ? (
                    <div className="flex h-full flex-col items-center justify-center gap-1 p-6 text-center text-sm text-muted-foreground">
                      {debouncedSearchQuery ? (
                        <>
                          <IconSearch className="mb-1 h-6 w-6 opacity-40" />
                          <p className="font-medium text-foreground">
                            No matches
                          </p>
                          <p>
                            No conversations match &quot;{debouncedSearchQuery}
                            &quot;.
                          </p>
                        </>
                      ) : (
                        <>
                          <IconMessage2 className="mb-1 h-6 w-6 opacity-40" />
                          <p className="font-medium text-foreground">
                            No conversations yet
                          </p>
                          <p>DMs for this account will show up here.</p>
                        </>
                      )}
                    </div>
                  ) : (
                    conversations.map((conversation) => {
                      const isSelected =
                        conversation.id === activeConversation?.id;
                      const contactName =
                        conversation.name || conversation.username || "Unknown";
                      return (
                        <button
                          key={conversation.id}
                          type="button"
                          onClick={() =>
                            handleSelectConversation(conversation.id)
                          }
                          className={`w-full rounded-xl border-l-[3px] p-3 text-left transition ${
                            isSelected
                              ? "border-l-primary bg-primary/[0.07] shadow-sm"
                              : "border-l-transparent hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="relative shrink-0">
                              <CustomerAvatar name={contactName} />
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center border border-background">
                                <ChannelIcon className="w-3 h-3" stroke={2.5} />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className="truncate text-sm font-medium">
                                  {contactName}
                                </p>
                                <span className="shrink-0 text-[11px] text-muted-foreground">
                                  {conversation.last_message_at
                                    ? formatRelativeTime(
                                        conversation.last_message_at,
                                      )
                                    : ""}
                                </span>
                              </div>
                              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                {conversation.last_message || "[Attachment]"}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </Card>
            </div>

            <Card className="flex min-h-0 flex-col overflow-hidden h-[88vh]!">
              {!activeConversation ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  {loading ? (
                    <Spinner />
                  ) : (
                    "Select a conversation to view messages."
                  )}
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 border-b border-border/50 p-4">
                    <CustomerAvatar name={activeContactName} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {activeContactName}
                      </p>
                      {activeConversation.username && (
                        <p className="truncate text-xs text-muted-foreground">
                          @{activeConversation.username}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="relative min-h-0 flex-1">
                    <div
                      ref={messagesContainerRef}
                      onScroll={handleMessagesScroll}
                      className="h-full overflow-y-auto p-4 space-y-3"
                    >
                      {FetchSocialDmsIsLoading && !messages.length ? (
                        <div className="flex h-full items-center justify-center">
                          <Spinner />
                        </div>
                      ) : (
                        messages.map((msg) => (
                          <DmMessageBubble
                            key={msg.id}
                            msg={msg}
                            storeCode={storeCode}
                            userId={activeConversation.id}
                            onReacted={refetchMessages}
                            onReply={setReplyingToMessage}
                          />
                        ))
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
                  <div className="border-t border-border/50 p-3">
                    {replyingToMessage && (
                      <div className="mb-2 flex items-start justify-between gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">
                            Replying to{" "}
                            <span className="font-semibold">
                              {replyingToMessage.message_direction ===
                              "outgoing"
                                ? "yourself"
                                : activeContactName}
                            </span>
                          </p>
                          <p className="mt-0.5 truncate text-muted-foreground">
                            {replyingToMessage.content || "[Attachment]"}
                          </p>
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
                      <div className="mb-2 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                        <IconClock className="mt-0.5 size-4 shrink-0" />
                        <p>
                          It&apos;s been more than 24 hours since{" "}
                          {activeContactName} last messaged you. Meta only
                          allows replies within 24 hours of their last message —
                          you can&apos;t send anything until they message again.
                        </p>
                      </div>
                    )}
                    <ReplyBox
                      replyingTo={activeContactName}
                      onSubmit={handleReply}
                      textareaId={DM_REPLY_TEXTAREA_ID}
                      placeholder={
                        messagingWindowOpen
                          ? "Message..."
                          : "Messaging window closed"
                      }
                      disabled={!messagingWindowOpen}
                    />
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      </AccountContext.Provider>
    </ChannelContext.Provider>
  );
}
