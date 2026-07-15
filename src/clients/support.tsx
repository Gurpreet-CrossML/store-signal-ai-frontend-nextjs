"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import MessagePan from "@/components/custom/message-pan";
import {
  CartDetailsCard,
  UserMetadataCard,
  OrdersCard,
} from "@/components/custom/thread-detail-panels";
import {
  FetchAIInsight,
  FetchCart,
  FetchConversationSummary,
  FetchFeedbackSequence,
  FetchFreshdeskTicketId,
  FetchThreadDetails,
  FetchThreads,
  FetchUserMetadata,
  type Thread,
  type ThreadMessage,
  FetchOrders,
  UploadMessageAttachments,
  SyncOrders,
} from "@/redux/api-slice/thread-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { Spinner } from "@/components/ui/spinner";
import {
  IconAlertTriangle,
  IconHeadset,
  IconMessage2,
  IconMoodSmile,
  IconPaperclip,
  IconRobot,
  IconSearch,
  IconSend,
  IconUser,
  IconX,
} from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { toast } from "sonner";
import { ENDPOINTS } from "@/lib/config";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";

// Extends the shared Thread type with a local read-state flag. Ideally
// `is_read` becomes a real field on Thread (and maybe comes from the API),
// but until then we track it client-side, defaulting to true on load.
type ThreadWithReadState = Thread & { is_read?: boolean };

function normalizeThreads(threads: Thread[] | undefined) {
  return (threads ?? []).map((thread) => ({
    ...thread,
    is_read: (thread as ThreadWithReadState).is_read ?? true,
  }));
}

function formatRelativeTime(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) return `${diffMinutes}m`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks}w`;

  return `${Math.max(1, Math.floor(diffDays / 30))}mo`;
}

// Deterministic avatar accent so the same customer always gets the same color.
const AVATAR_PALETTE = [
  "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
];

function getAvatarColor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function getInitials(name: string | null | undefined) {
  if (!name) return null;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return null;
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase());
  return initials.join("");
}

function CustomerAvatar({
  name,
  size = "h-9 w-9",
  online,
}: {
  name?: string | null;
  size?: string;
  online?: boolean;
}) {
  const initials = getInitials(name);

  return (
    <div className="relative shrink-0">
      <Avatar className={`${size} mt-0.5`}>
        <AvatarFallback
          className={`text-sm font-medium ${
            initials ? getAvatarColor(name ?? "") : "bg-primary/10 text-primary"
          }`}
        >
          {initials ?? <IconUser className="h-5 w-5" />}
        </AvatarFallback>
      </Avatar>
      {online !== undefined && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${
            online ? "bg-green-500" : "bg-muted-foreground/40"
          }`}
        />
      )}
    </div>
  );
}

type AttachmentStatus = "uploading" | "uploaded" | "error";

type AttachmentUpload = {
  id: string;
  file: File;
  previewUrl: string;
  url: string | null;
  status: AttachmentStatus;
};

function ThreadChatControls({
  activeThreadId,
  isThreadActive = true,
  className,
  connectedAgent,
  user,
  transitionState,
  agentMessage,
  setAgentMessage,
  attachments,
  isEmojiPickerOpen,
  setIsEmojiPickerOpen,
  onTakeOver,
  onReturnToAI,
  onSendAgentMessage,
  onFileSelection,
  onEmojiSelect,
  onRemoveAttachment,
  onRetryAttachment,
}: {
  activeThreadId?: string | null;
  isThreadActive?: boolean;
  className?: string;
  connectedAgent: string | null;
  user: string | null;
  transitionState: "idle" | "taking_over" | "returning_to_ai";
  agentMessage: string;
  setAgentMessage: (value: string) => void;
  attachments: AttachmentUpload[];
  isEmojiPickerOpen: boolean;
  setIsEmojiPickerOpen: (value: boolean) => void;
  onTakeOver: () => void;
  onReturnToAI: () => void;
  onSendAgentMessage: () => void;
  onFileSelection: (event: ChangeEvent<HTMLInputElement>) => void;
  onEmojiSelect: (emoji: string) => void;
  onRemoveAttachment: (id: string) => void;
  onRetryAttachment: (id: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-grow the composer like a chat app, capped at a few lines.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [agentMessage]);

  if (!activeThreadId || !isThreadActive) {
    return null;
  }

  const isUploadingAttachments = attachments.some(
    (attachment) => attachment.status === "uploading",
  );
  const hasFailedAttachments = attachments.some(
    (attachment) => attachment.status === "error",
  );
  const inputsDisabled = isUploadingAttachments || transitionState !== "idle";

  const canSend =
    (agentMessage.trim().length > 0 || attachments.length > 0) &&
    transitionState === "idle" &&
    !isUploadingAttachments &&
    !hasFailedAttachments;

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
  };

  return (
    <div
      className={`relative border-t border-border/50 bg-background/95 p-4 ${className ?? ""}`}
    >
      {!connectedAgent && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <IconRobot className="h-4 w-4 shrink-0" />
            <span>
              The AI assistant is currently handling this conversation.
            </span>
          </div>
          {activeThreadId && connectedAgent !== user && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={onTakeOver}
                disabled={
                  transitionState !== "idle" ||
                  !!(connectedAgent && connectedAgent !== user)
                }
              >
                <IconHeadset className="h-4 w-4" />
                Take Over
              </Button>
            </div>
          )}
        </div>
      )}

      {connectedAgent && connectedAgent !== user && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <IconRobot className="h-4 w-4 shrink-0" />
            <span>A human agent is currently handling this conversation.</span>
          </div>
        </div>
      )}

      {connectedAgent === user && (
        <div className="rounded-2xl border border-border/60 bg-background shadow-sm transition-shadow focus-within:border-primary/50 focus-within:shadow-md">
          <div className="flex items-center justify-between border-b border-border/50 px-3 py-1.5">
            <span className="text-[11px] font-medium text-muted-foreground">
              Replying as agent
            </span>
          </div>

          {isEmojiPickerOpen && (
            <div className="border-b border-border/50 p-2">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                width="100%"
                height={320}
                theme={Theme.AUTO}
                previewConfig={{ showPreview: false }}
                searchPlaceholder="Search emoji…"
              />
            </div>
          )}

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 border-b border-border/50 p-2">
              {attachments.map((attachment) => {
                const isImage = attachment.file.type.startsWith("image/");
                const isUploading = attachment.status === "uploading";
                const isError = attachment.status === "error";

                return (
                  <div
                    key={attachment.id}
                    className="group relative flex items-center gap-2 rounded-xl border border-border/60 bg-muted/60 py-1.5 pl-1.5 pr-2.5 text-xs text-muted-foreground"
                  >
                    <div className="relative h-8 w-8 shrink-0">
                      {isImage ? (
                        <Image
                          src={attachment.previewUrl}
                          alt={attachment.file.name}
                          width={32}
                          height={32}
                          unoptimized
                          className={`h-8 w-8 rounded-lg object-cover ${
                            isUploading ? "opacity-40" : ""
                          } ${isError ? "opacity-60" : ""}`}
                        />
                      ) : (
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg bg-background/70 ${
                            isUploading ? "opacity-40" : ""
                          }`}
                        >
                          <IconPaperclip className="h-4 w-4" />
                        </div>
                      )}
                      {isUploading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Spinner className="size-4" />
                        </div>
                      )}
                      {isError && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/60">
                          <IconAlertTriangle className="size-4 text-destructive" />
                        </div>
                      )}
                    </div>
                    <span className="max-w-[140px] truncate">
                      {attachment.file.name}
                    </span>
                    {isError && (
                      <button
                        type="button"
                        className="text-[11px] font-medium text-primary underline-offset-2 hover:underline"
                        onClick={() => onRetryAttachment(attachment.id)}
                      >
                        Retry
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isUploading}
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-background/80 text-muted-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-0"
                      onClick={() => onRemoveAttachment(attachment.id)}
                      title={isUploading ? "Uploading…" : "Remove attachment"}
                    >
                      <IconX className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Text input row */}
          <div className="px-3 pt-2">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder={
                isUploadingAttachments ? "Uploading image…" : "Type your reply…"
              }
              value={agentMessage}
              disabled={inputsDisabled}
              onChange={(event) => setAgentMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  onSendAgentMessage();
                }
              }}
              className="max-h-[120px] w-full resize-none bg-transparent py-1 text-sm leading-6 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {/* Controls row: emoji + attach on the left, send on the right */}
          <div className="flex items-center justify-between gap-2 p-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={inputsDisabled}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted transition-colors hover:bg-muted/80 ${
                  isEmojiPickerOpen
                    ? "text-foreground ring-1 ring-primary/40"
                    : "text-muted-foreground"
                }`}
                onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                title="Add emoji"
              >
                <IconMoodSmile className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={inputsDisabled}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => fileInputRef.current?.click()}
                title="Attach image or file"
              >
                <IconPaperclip className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                disabled={inputsDisabled}
                onChange={onFileSelection}
                className="hidden"
              />
            </div>

            <button
              type="button"
              onClick={onSendAgentMessage}
              disabled={!canSend}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all disabled:cursor-not-allowed ${
                canSend
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105"
                  : "bg-muted text-muted-foreground"
              }`}
              title={
                isUploadingAttachments ? "Waiting for upload…" : "Send message"
              }
            >
              <IconSend className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-border/50 px-3 py-1.5 text-[11px] text-muted-foreground">
            <span>
              {isUploadingAttachments
                ? "Uploading attachment…"
                : "Enter to send · Shift + Enter for a new line"}
            </span>
            {attachments.length > 0 && (
              <span>{attachments.length} attached</span>
            )}
          </div>
        </div>
      )}

      {transitionState !== "idle" && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="flex min-w-[280px] flex-col items-center gap-3 rounded-lg border bg-background p-6 shadow-lg">
            <Spinner className="size-6" />
            <div className="text-center">
              <p className="font-medium">
                {transitionState === "taking_over"
                  ? "Connecting..."
                  : "Returning to AI..."}
              </p>
              <p className="text-sm text-muted-foreground">
                {transitionState === "taking_over"
                  ? "Taking over this conversation"
                  : "Handing conversation back to AI assistant"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Shape of the "message" event data coming from the dashboard socket.
type DashboardMessageEvent = {
  id: string;
  message: string;
  role: string;
  thread_id: string;
  is_active: boolean;
  created_at: string;
};

type DashboardSocketPayload =
  | { success: boolean; action_type: "connection"; data?: unknown }
  | { success: boolean; action_type: "message"; data: DashboardMessageEvent }
  | {
      success: boolean;
      action_type: "thread_closed";
      data: { thread_id: string };
    };

const useNotificationSound = (soundUrl: string = "/notification_sound.mp3") => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(soundUrl);
      audioRef.current.volume = 0.5;
    }
    // reset so rapid consecutive messages still replay the sound
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch((err) => {
      // browsers block autoplay until user has interacted with the page
      console.warn("Notification sound blocked:", err);
    });
  }, [soundUrl]);

  return play;
};

export default function Support() {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { FetchThreadsListData, FetchThreadsIsLoading } = useAppSelector(
    (state) => state.GetThreadReducer.FetchThreadsState,
  );
  const { FetchThreadDetailsIsLoading } = useAppSelector(
    (state) => state.GetThreadReducer.FetchThreadDetailsState,
  );
  const { FetchCartData, FetchCartDataIsLoading } = useAppSelector(
    (state) => state.GetThreadReducer.FetchCartDataState,
  );
  const { FetchOrderData, FetchOrderDataIsLoading } = useAppSelector(
    (state) => state.GetThreadReducer.FetchOrderDataState,
  );
  const { FetchUserMetadataData, FetchUserMetadataIsLoading } = useAppSelector(
    (state) => state.GetThreadReducer.FetchUserMetadataState,
  );
  const { SyncOrdersIsLoading } = useAppSelector(
    (state) => state.GetThreadReducer.SyncOrdersState,
  );

  // Local, mutable copy of the thread list. Seeded from Redux (is_read
  // defaults to true), then patched in place by the dashboard socket (new
  // messages / thread_closed events) without waiting on a refetch.
  const [previousThreadsData, setPreviousThreadsData] =
    useState(FetchThreadsListData);
  const [localThreads, setLocalThreads] = useState<ThreadWithReadState[]>(() =>
    normalizeThreads(FetchThreadsListData?.results),
  );
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([]);
  const [connectedAgent, setConnectedAgent] = useState<string | null>(null);
  const [transitionState, setTransitionState] = useState<
    "idle" | "taking_over" | "returning_to_ai"
  >("idle");
  const [agentMessage, setAgentMessage] = useState("");
  const [attachments, setAttachments] = useState<AttachmentUpload[]>([]);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [threadSearch, setThreadSearch] = useState("");
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">(
    "all",
  );
  const [replyWithAILoadingId, setReplyWithAILoadingId] = useState<
    string | number | null
  >(null);

  const { data: session } = useSession();

  const wsRef = useRef<WebSocket | null>(null);
  const dashboardWsRef = useRef<WebSocket | null>(null);
  const connectedAgentRef = useRef<string | null>(null);
  const activeThreadIdRef = useRef<string | null>(null);

  // Generate a unique client ID for this session. This is used to identify messages sent by this client, so we can ignore them when they come back from the server.
  const [clientID, setClientID] = useState<string | null>(crypto.randomUUID());

  // Reset the socket-mutable copy when Redux supplies a new response. React
  // applies this guarded render-time adjustment before committing children,
  // avoiding an extra render with stale thread data.
  if (FetchThreadsListData !== previousThreadsData) {
    setPreviousThreadsData(FetchThreadsListData);
    setLocalThreads(normalizeThreads(FetchThreadsListData?.results));
  }

  const selectedThreadStillExists =
    selectedThreadId !== null &&
    localThreads.some((thread) => thread.id === selectedThreadId);
  if (selectedThreadId !== null && !selectedThreadStillExists) {
    setSelectedThreadId(localThreads[0]?.id ?? null);
  }
  const activeThreadId = selectedThreadStillExists
    ? selectedThreadId
    : (localThreads[0]?.id ?? null);

  const playNotificationSound = useNotificationSound();

  // The open conversation is read by definition. Keep that as derived state
  // so defaulting or advancing to the first thread needs no effect.
  const visibleThreads = useMemo(
    () =>
      localThreads.map((thread) =>
        thread.id === activeThreadId && thread.is_read === false
          ? { ...thread, is_read: true }
          : thread,
      ),
    [activeThreadId, localThreads],
  );

  const selectedThread = useMemo(
    () => visibleThreads.find((thread) => thread.id === activeThreadId) ?? null,
    [activeThreadId, visibleThreads],
  );

  const unreadCount = useMemo(
    () => visibleThreads.filter((thread) => thread.is_read === false).length,
    [visibleThreads],
  );

  const filteredThreads = useMemo(() => {
    const query = threadSearch.trim().toLowerCase();

    return visibleThreads.filter((thread: ThreadWithReadState) => {
      if (query) {
        const name = thread.customer?.name?.toLowerCase() ?? "";
        const preview = thread.last_message?.toLowerCase() ?? "";
        if (!name.includes(query) && !preview.includes(query)) {
          return false;
        }
      }

      if (readFilter === "unread" && thread.is_read !== false) {
        return false;
      }
      if (readFilter === "read" && thread.is_read === false) {
        return false;
      }

      return true;
    });
  }, [visibleThreads, threadSearch, readFilter]);

  useEffect(() => {
    if (!storeCode) return;

    dispatch(
      FetchThreads({
        store_code: storeCode,
        page: 1,
        limit: 50,
        filters: { is_active: true },
      }),
    );
  }, [dispatch, storeCode]);

  useEffect(() => {
    if (!activeThreadId || !storeCode) {
      return;
    }

    const loadThreadData = async () => {
      setThreadMessages([]);
      const result = await dispatch(
        FetchThreadDetails(activeThreadId),
      ).unwrap();
      setThreadMessages(result.messages ?? []);
      dispatch(FetchConversationSummary(activeThreadId));
      dispatch(FetchAIInsight(activeThreadId));
      dispatch(FetchCart(activeThreadId));
      dispatch(FetchUserMetadata(activeThreadId));
      dispatch(FetchFeedbackSequence(activeThreadId));
      dispatch(FetchFreshdeskTicketId(activeThreadId));
      dispatch(FetchOrders(activeThreadId));
    };

    void loadThreadData();
  }, [dispatch, activeThreadId, storeCode]);

  const handleThreadMessageAdded = useCallback((message: ThreadMessage) => {
    setThreadMessages((prev) => [...prev, message]);
  }, []);

  const handleTakeOver = useCallback(async () => {
    if (!activeThreadId || !wsRef.current) {
      return;
    }

    try {
      setTransitionState("taking_over");
      wsRef.current.send(
        JSON.stringify({
          action_type: "handler_change",
          chat_handler: "human",
        }),
      );
    } catch (error) {
      console.error(error);
      setTransitionState("idle");
    }
  }, [activeThreadId]);

  const handleReturnToAI = useCallback(async () => {
    if (!activeThreadId || !wsRef.current) {
      return;
    }

    try {
      setTransitionState("returning_to_ai");
      wsRef.current.send(
        JSON.stringify({ action_type: "handler_change", chat_handler: "ai" }),
      );
    } catch (error) {
      console.error(error);
      setTransitionState("idle");
    }
  }, [activeThreadId]);

  // Uploads a batch of newly-selected files immediately (one POST for the
  // whole batch, matching the "images" multi-append shape of the API) and
  // patches each attachment's status/url in place as the response resolves.
  const uploadAttachments = useCallback(
    async (threadId: string, items: AttachmentUpload[]) => {
      const formData = new FormData();
      formData.append("thread_id", threadId);
      items.forEach((item) => formData.append("images", item.file));

      try {
        const result = await dispatch(
          UploadMessageAttachments({ formData }),
        ).unwrap();

        setAttachments((prev) =>
          prev.map((attachment) => {
            const index = items.findIndex((item) => item.id === attachment.id);
            if (index === -1) return attachment;
            const image = result[index];
            return {
              ...attachment,
              url: image.url,
              status: image?.url ? "uploaded" : "error",
            };
          }),
        );

        if (result.every((image: AttachmentUpload) => !image.url)) {
          toast.error("Upload failed", {
            description: "Could not upload the selected image(s).",
          });
        }
      } catch (error) {
        console.error("Failed to upload attachment(s)", error);
        setAttachments((prev) =>
          prev.map((attachment) =>
            items.some((item) => item.id === attachment.id)
              ? { ...attachment, status: "error" }
              : attachment,
          ),
        );
        toast.error("Upload failed", {
          description: "Could not upload the selected image(s). Try again.",
        });
      }
    },
    [],
  );

  const handleSendAgentMessage = useCallback(() => {
    const message = agentMessage.trim();
    const isUploadingAttachments = attachments.some(
      (attachment) => attachment.status === "uploading",
    );
    const hasFailedAttachments = attachments.some(
      (attachment) => attachment.status === "error",
    );

    if (isUploadingAttachments) {
      toast.error("Please wait", {
        description: "Attachments are still uploading.",
      });
      return;
    }

    if (hasFailedAttachments) {
      toast.error("Attachment failed", {
        description: "Remove or retry the failed attachment before sending.",
      });
      return;
    }

    const imageUrls = attachments
      .filter(
        (attachment) => attachment.status === "uploaded" && attachment.url,
      )
      .map((attachment) => attachment.url as string);

    if ((!message && imageUrls.length === 0) || !wsRef.current) {
      return;
    }

    handleThreadMessageAdded({
      id: crypto.randomUUID(),
      role: "assistant",
      message: message,
      created_at: new Date().toISOString(),
      messaged_by: "You",
      image_url: imageUrls,
    });

    wsRef.current.send(
      JSON.stringify({
        message,
        client_id: clientID,
        image_url: imageUrls,
      }),
    );

    setAgentMessage("");
    setAttachments([]);
    setIsEmojiPickerOpen(false);
  }, [agentMessage, attachments, handleThreadMessageAdded]);

  const handleReplyWithAI = useCallback(
    (message_id: number | string) => {
      if (!wsRef.current) return;

      setReplyWithAILoadingId(message_id);

      // Tell the backend to generate an AI reply for this specific user turn.
      // Adjust the payload shape to match whatever your socket/API expects.
      wsRef.current.send(
        JSON.stringify({
          action_type: "reply_with_ai",
          message_id: message_id,
          client_id: clientID,
        }),
      );

      toast.success("Asked AI to reply", {
        description: "Generating a response for this message…",
      });
    },
    [clientID],
  );

  const handleFileSelection = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      event.target.value = "";
      if (!files.length || !activeThreadId) {
        return;
      }

      const newAttachments: AttachmentUpload[] = files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        url: null,
        status: "uploading",
      }));

      setAttachments((prev) => [...prev, ...newAttachments]);
      void uploadAttachments(activeThreadId, newAttachments);
    },
    [activeThreadId, uploadAttachments],
  );

  const handleEmojiSelect = useCallback((emoji: string) => {
    setAgentMessage((prev) => `${prev}${emoji}`);
    setIsEmojiPickerOpen(false);
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const target = prev.find((attachment) => attachment.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((attachment) => attachment.id !== id);
    });
  }, []);

  const retryAttachment = useCallback(
    (id: string) => {
      if (!activeThreadId) return;
      setAttachments((prev) => {
        const target = prev.find((attachment) => attachment.id === id);
        if (!target) return prev;

        const retried: AttachmentUpload = { ...target, status: "uploading" };
        void uploadAttachments(activeThreadId, [retried]);

        return prev.map((attachment) =>
          attachment.id === id ? retried : attachment,
        );
      });
    },
    [activeThreadId, uploadAttachments],
  );

  const handleSelectThread = useCallback((threadId: string) => {
    // Close the previously open thread's chat socket immediately on click,
    // rather than waiting for the effect below to notice the id changed.
    wsRef.current?.close();
    wsRef.current = null;
    setLocalThreads((prev) =>
      prev.map((thread) =>
        thread.id === threadId && thread.is_read === false
          ? { ...thread, is_read: true }
          : thread,
      ),
    );
    setSelectedThreadId(threadId);
    setAttachments([]);
  }, []);

  // Insert or patch a thread in localThreads based on an incoming dashboard
  // "message" event. Existing threads keep their position; brand-new
  // threads are prepended. Marks the thread unread unless it's the one
  // currently open.
  const upsertThreadFromMessage = useCallback(
    (data: DashboardMessageEvent) => {
      const belongsToOpenThread = data.thread_id === activeThreadIdRef.current;

      setLocalThreads((prev) => {
        const existingIndex = prev.findIndex((t) => t.id === data.thread_id);

        if (existingIndex === -1) {
          const newThread: ThreadWithReadState = {
            id: data.thread_id,
            last_message: data.message,
            is_active: data.is_active,
            total_messages: 1,
            created_at: new Date().toISOString(),
            customer: null,
            is_read: belongsToOpenThread,
          } as ThreadWithReadState;
          return [newThread, ...prev];
        }

        const existingThread = prev[existingIndex];
        const updatedThread: ThreadWithReadState = {
          ...existingThread,
          last_message: data.message,
          is_active: data.is_active,
          total_messages: (existingThread.total_messages ?? 0) + 1,
          is_read: belongsToOpenThread,
        };

        const rest = prev.filter((thread) => thread.id !== data.thread_id);
        return [updatedThread, ...rest];
      });

      if (!belongsToOpenThread) {
        playNotificationSound();
      }
    },
    [activeThreadId, handleThreadMessageAdded],
  );

  useEffect(() => {
    activeThreadIdRef.current = activeThreadId;
  }, [activeThreadId]);

  const removeClosedThread = useCallback((threadId: string) => {
    setLocalThreads((prev) => prev.filter((t) => t.id !== threadId));
  }, []);

  // ---- Dashboard-wide socket: opens once the page has an authenticated
  // session, independent of which thread is selected. Drives live updates
  // to the thread list (new messages, new threads, closed threads). ----
  useEffect(() => {
    const token = session?.user?.access_token;
    if (!token || !storeCode) {
      dashboardWsRef.current?.close();
      dashboardWsRef.current = null;
      return;
    }

    if (dashboardWsRef.current) {
      dashboardWsRef.current.close();
      dashboardWsRef.current = null;
    }

    const dashboardUrl = ENDPOINTS.dashboardSocket(storeCode, token);
    const dashboardWs = new WebSocket(dashboardUrl);
    dashboardWsRef.current = dashboardWs;

    dashboardWs.onopen = () => {
      console.info("Dashboard socket connected");
    };

    dashboardWs.onmessage = (event) => {
      let data: DashboardSocketPayload;
      try {
        data = JSON.parse(event.data);
      } catch (error) {
        console.error("Failed to parse dashboard socket message", error);
        return;
      }

      if (!data?.success) {
        return;
      }

      if (data.action_type === "connection") {
        return;
      }

      if (data.action_type === "message") {
        upsertThreadFromMessage(data.data);
        return;
      }

      if (data.action_type === "thread_closed") {
        removeClosedThread(data.data.thread_id);
      }
    };

    dashboardWs.onclose = () => {
      if (dashboardWsRef.current === dashboardWs) {
        dashboardWsRef.current = null;
      }
      console.info("Dashboard socket disconnected");
    };

    dashboardWs.onerror = (error) => {
      console.error("Dashboard socket error", error);
    };

    return () => {
      dashboardWs.close();
      if (dashboardWsRef.current === dashboardWs) {
        dashboardWsRef.current = null;
      }
    };
  }, [session?.user?.access_token, storeCode]);

  // ---- Per-thread chat socket: opens/closes as the selected thread changes. ----
  useEffect(() => {
    if (
      !activeThreadId ||
      !selectedThread?.is_active ||
      !session?.user?.access_token
    ) {
      wsRef.current?.close();
      wsRef.current = null;
      return;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const url = ENDPOINTS.chatSocket(activeThreadId, session.user.access_token);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.info("Agent connected");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data?.success && data?.action_type === "message" && data?.chunk) {
        return;
      }

      if (!data?.success && data?.action_type === "handler_change") {
        toast.error("Permission Issue!", {
          description: data?.message || "",
        });
        setTransitionState("idle");
        return;
      }

      if (
        !data?.success ||
        (data?.sender === "agent" &&
          connectedAgentRef.current === session?.user?.email &&
          data?.client_id === clientID)
      ) {
        return;
      }

      if (data?.success && data?.action_type === "connection") {
        if (data?.chat_handler === "human" && data?.chat_handler_user) {
          setConnectedAgent(data?.chat_handler_user);
          connectedAgentRef.current = data?.chat_handler_user;
        } else {
          setConnectedAgent(null);
          connectedAgentRef.current = null;
        }
        return;
      }

      if (data?.success && data?.action_type === "handler_change") {
        if (data?.chat_handler === "human" && data?.chat_handler_user) {
          setConnectedAgent(data?.chat_handler_user);
          connectedAgentRef.current = data?.chat_handler_user;
        } else {
          setConnectedAgent(null);
          connectedAgentRef.current = null;
        }
        setTransitionState("idle");
        return;
      }

      if (
        data?.success &&
        data?.action_type === "message" &&
        data?.final_update
      ) {
        handleThreadMessageAdded({
          id: data?.final_update?.id,
          role: data?.final_update?.role,
          message: data?.final_update?.message,
          json_content: data?.final_update?.json_content || {},
          created_at: new Date().toISOString(),
          messaged_by: data?.sender === "agent" ? "agent" : "",
          image_url: data?.final_update?.image_url || null,
        });
        setReplyWithAILoadingId(null);
      }
    };

    ws.onclose = () => {
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
      console.info("Agent disconnected");
    };

    ws.onerror = (error) => {
      console.error("WebSocket error", error);
    };

    return () => {
      ws.close();
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
    };
  }, [
    activeThreadId,
    handleThreadMessageAdded,
    selectedThread?.is_active,
    session?.user?.access_token,
  ]);

  const handleOrdersSync = async () => {
    try {
      await dispatch(SyncOrders({ threadID: activeThreadId })).unwrap();

      dispatch(FetchOrders(activeThreadId));
      toast.error("Order Sync", {
        description: "Orders synced successfully.",
      });
    } catch (error) {
      toast.error("Order Sync failed", {
        description: "Could not sync orders. Try again.",
      });
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-[320px_minmax(0,1fr)_420px]">
        <Card className="flex min-h-0 flex-col overflow-hidden gap-2 h-[88vh]!">
          <CardHeader className="border-b border-border/50 space-y-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <IconMessage2 className="size-4" />
              Active Chats
              {localThreads.length > 0 && (
                <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                  {localThreads.length}
                </span>
              )}
            </CardTitle>
            <div className="relative">
              <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={threadSearch}
                onChange={(event) => setThreadSearch(event.target.value)}
                placeholder="Search conversations…"
                className="h-8 w-full border border-input bg-muted/40 pl-8 pr-3 text-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex items-center gap-1.5">
              {(
                [
                  { key: "all", label: "All" },
                  { key: "unread", label: "Unread" },
                  { key: "read", label: "Read" },
                ] as const
              ).map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setReadFilter(option.key)}
                  className={`flex items-center gap-1 border px-2.5 py-1 text-[11px] font-medium transition ${
                    readFilter === option.key
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/60 bg-background text-muted-foreground hover:bg-muted/60"
                  }`}
                >
                  {option.label}
                  {option.key === "unread" && unreadCount > 0 && (
                    <span
                      className={`rounded-full px-1.5 text-[10px] ${
                        readFilter === "unread"
                          ? "bg-primary-foreground/20"
                          : "bg-muted text-foreground/70"
                      }`}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 overflow-y-auto p-3">
            {FetchThreadsIsLoading ? (
              <div className="flex h-full items-center justify-center">
                <Spinner />
              </div>
            ) : filteredThreads.length ? (
              <div className="space-y-1.5">
                {filteredThreads.map((thread: ThreadWithReadState) => {
                  const isSelected = thread.id === activeThreadId;
                  const isUnread = thread.is_read === false;

                  return (
                    <button
                      key={thread.id}
                      type="button"
                      onClick={() => handleSelectThread(thread.id)}
                      className={`w-full rounded-xl border-l-[3px] p-3 text-left transition ${
                        isSelected
                          ? "border-l-primary bg-primary/[0.07] shadow-sm"
                          : isUnread
                            ? "border-l-sky-500 bg-sky-500/[0.06] hover:bg-sky-500/[0.1] dark:bg-sky-400/[0.08]"
                            : "border-l-transparent hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <CustomerAvatar
                          name={thread.customer?.name}
                          online={thread.is_active}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                {thread.customer?.name ? (
                                  <p
                                    className={`truncate text-sm ${
                                      isUnread
                                        ? "font-semibold text-foreground"
                                        : "font-medium"
                                    }`}
                                  >
                                    {thread.customer.name}
                                  </p>
                                ) : (
                                  <p
                                    className={`truncate text-sm text-muted-foreground ${
                                      isUnread ? "font-semibold" : "font-medium"
                                    }`}
                                  >
                                    Anonymous visitor
                                  </p>
                                )}
                              </div>
                              <p
                                className={`mt-0.5 line-clamp-2 text-xs ${
                                  isUnread
                                    ? "text-foreground/70 font-bold"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {thread.last_message ||
                                  "No message preview available."}
                              </p>
                            </div>
                            <span className="shrink-0 text-[11px] text-muted-foreground">
                              {formatRelativeTime(thread.created_at)}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>{thread.total_messages} messages</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : threadSearch || readFilter !== "all" ? (
              <div className="flex h-full flex-col items-center justify-center gap-1 p-6 text-center text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  {readFilter === "unread"
                    ? "No unread conversations"
                    : readFilter === "read"
                      ? "No read conversations"
                      : "No matches"}
                </p>
                <p>
                  {threadSearch
                    ? "Try a different name or keyword."
                    : "Try a different filter."}
                </p>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                No active chats matched the current store scope.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex min-h-0 flex-col overflow-hidden h-[88vh]!">
          <CardHeader className="border-b border-border/50 bg-background/95 py-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CustomerAvatar
                  name={selectedThread?.customer?.name}
                  online={selectedThread?.is_active}
                />
                <div>
                  <CardTitle className="text-base leading-tight">
                    {selectedThread?.customer?.name || "Anonymous visitor"}
                  </CardTitle>
                  {selectedThread?.is_active ? (
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {connectedAgent
                          ? "Connected with agent"
                          : "Assistant ready"}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
              {activeThreadId && connectedAgent === session?.user?.email && (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReturnToAI}
                    disabled={transitionState !== "idle"}
                  >
                    <IconRobot className="h-4 w-4" />
                    Return to AI
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
            {activeThreadId ? (
              FetchThreadDetailsIsLoading ? (
                <div className="flex h-full items-center justify-center gap-2 text-muted-foreground">
                  <Spinner />
                  Loading conversation…
                </div>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="flex-1 min-h-0 overflow-y-auto p-3">
                    {threadMessages.length > 0 ? (
                      <MessagePan
                        messages={threadMessages}
                        onReplyWithAI={
                          connectedAgent === session?.user?.email
                            ? handleReplyWithAI
                            : undefined
                        }
                        replyWithAILoadingId={replyWithAILoadingId}
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-1 p-6 text-center text-sm text-muted-foreground">
                        <IconMessage2 className="mb-1 h-6 w-6 opacity-40" />
                        <p className="font-medium text-foreground">
                          Nothing here yet
                        </p>
                        <p>Messages for this thread will show up here.</p>
                      </div>
                    )}
                  </div>
                  {selectedThread?.is_active ? (
                    <ThreadChatControls
                      activeThreadId={activeThreadId}
                      isThreadActive={selectedThread.is_active}
                      className="border-t"
                      connectedAgent={connectedAgent}
                      user={session?.user?.email || null}
                      transitionState={transitionState}
                      agentMessage={agentMessage}
                      setAgentMessage={setAgentMessage}
                      attachments={attachments}
                      isEmojiPickerOpen={isEmojiPickerOpen}
                      setIsEmojiPickerOpen={setIsEmojiPickerOpen}
                      onTakeOver={handleTakeOver}
                      onReturnToAI={handleReturnToAI}
                      onSendAgentMessage={handleSendAgentMessage}
                      onFileSelection={handleFileSelection}
                      onEmojiSelect={handleEmojiSelect}
                      onRemoveAttachment={removeAttachment}
                      onRetryAttachment={retryAttachment}
                    />
                  ) : null}
                </div>
              )
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
                Select a chat from the left to view the live conversation.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex min-h-0 flex-col overflow-hidden h-[88vh]!">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-base">Thread Details</CardTitle>
            <CardDescription>
              Customer context and metadata for the selected thread.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 space-y-4 overflow-y-auto p-3">
            {!activeThreadId ? (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                Select a conversation to inspect its details.
              </div>
            ) : (
              <>
                <OrdersCard
                  orders={FetchOrderData}
                  loading={FetchOrderDataIsLoading}
                  handleOrdersSync={handleOrdersSync}
                  orderSyncLoading={SyncOrdersIsLoading}
                  custometData={selectedThread?.customer || null}
                />
                <CartDetailsCard
                  cartData={FetchCartData}
                  loading={FetchCartDataIsLoading}
                />
                <UserMetadataCard
                  userMetadata={FetchUserMetadataData}
                  custometData={selectedThread?.customer || null}
                  loading={FetchUserMetadataIsLoading}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
