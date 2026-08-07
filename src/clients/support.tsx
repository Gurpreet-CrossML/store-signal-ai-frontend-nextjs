"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type ReactNode,
} from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { LoadingState } from "@/components/custom/loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { CustomerAvatar } from "@/components/custom/customer-avatar";
import { CardTitle } from "@/components/ui/card";
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
  IconMessageChatbot,
  IconMoodSmile,
  IconPaperclip,
  IconRobot,
  IconSend,
  IconX,
} from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { toast } from "sonner";
import { ENDPOINTS } from "@/lib/config";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { formatRelativeDateTime } from "@/lib/helpers";

// Extends the shared Thread type with a local read-state flag. Ideally
// `is_read` becomes a real field on Thread (and maybe comes from the API),
// but until then we track it client-side, defaulting to true on load.
type ThreadWithReadState = Thread & { is_read?: boolean };

// Message teasers render through react-markdown so formatting like **bold**
// shows properly, but flattened to inline spans: block elements would break
// the two-line clamp, and links/images don't belong inside a list row.
const teaserInline = ({ children }: { children?: ReactNode }) => (
  <span>{children} </span>
);
const TEASER_MARKDOWN_COMPONENTS: Components = {
  p: teaserInline,
  h1: teaserInline,
  h2: teaserInline,
  h3: teaserInline,
  h4: teaserInline,
  h5: teaserInline,
  h6: teaserInline,
  ul: teaserInline,
  ol: teaserInline,
  li: teaserInline,
  blockquote: teaserInline,
  pre: teaserInline,
  a: ({ children }) => <span>{children}</span>,
  img: () => null,
};

function normalizeThreads(threads: Thread[] | undefined) {
  return (threads ?? []).map((thread) => ({
    ...thread,
    is_read: (thread as ThreadWithReadState).is_read ?? true,
  }));
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
        <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/30 p-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <IconMessageChatbot className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                AI Assistant is handling this conversation
              </p>
              <p className="text-xs text-muted-foreground">
                Take over anytime to reply as a human agent.
              </p>
            </div>
          </div>
          {activeThreadId && connectedAgent !== user && (
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
          )}
        </div>
      )}

      {connectedAgent && connectedAgent !== user && (
        <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <IconHeadset className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              Another agent is handling this conversation
            </p>
            <p className="text-xs text-muted-foreground">
              Only the connected agent can reply right now.
            </p>
          </div>
        </div>
      )}

      {connectedAgent === user && (
        <div className="rounded-xl border border-border/60 bg-background shadow-xs transition-shadow focus-within:border-primary/50 focus-within:shadow-sm">
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
                    <span className="max-w-35 truncate">
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
          <div className="px-3 pt-3">
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
              className="max-h-30 w-full resize-none bg-transparent py-1 text-sm leading-6 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {/* Toolbar: emoji + attach + hint on the left, send on the right */}
          <div className="flex items-center gap-1 p-2">
            <button
              type="button"
              disabled={inputsDisabled}
              className={`flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 ${
                isEmojiPickerOpen
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
              title="Add emoji"
            >
              <IconMoodSmile className="size-4" />
            </button>
            <button
              type="button"
              disabled={inputsDisabled}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => fileInputRef.current?.click()}
              title="Attach image or file"
            >
              <IconPaperclip className="size-4" />
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
            <span className="ml-2 hidden truncate text-[11px] text-muted-foreground sm:inline">
              {isUploadingAttachments
                ? "Uploading attachment…"
                : "Enter to send · Shift + Enter for a new line"}
            </span>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              {attachments.length > 0 && (
                <span className="text-[11px] text-muted-foreground">
                  {attachments.length} attached
                </span>
              )}
              <Button
                type="button"
                size="sm"
                onClick={onSendAgentMessage}
                disabled={!canSend}
                title={
                  isUploadingAttachments
                    ? "Waiting for upload…"
                    : "Send message"
                }
              >
                <IconSend className="size-4" />
                Send
              </Button>
            </div>
          </div>
        </div>
      )}

      {transitionState !== "idle" && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="flex min-w-70 flex-col items-center gap-3 rounded-lg border bg-background p-6 shadow-lg">
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
  const [clientID] = useState<string | null>(crypto.randomUUID());

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

    // All thread data loads in parallel — the side panels must not wait on
    // the messages request, or the previous thread's data lingers on screen
    // until it finishes.
    const loadThreadData = () => {
      setThreadMessages([]);
      void dispatch(FetchThreadDetails(activeThreadId))
        .unwrap()
        .then((result) => {
          // Ignore late responses after the user has switched threads.
          if (activeThreadIdRef.current === activeThreadId) {
            setThreadMessages(result.messages ?? []);
          }
        })
        .catch(() => {
          // Errors surface via the slice's fetch state; keep messages empty.
        });
      dispatch(FetchConversationSummary(activeThreadId));
      dispatch(FetchAIInsight(activeThreadId));
      dispatch(FetchCart(activeThreadId));
      dispatch(FetchUserMetadata(activeThreadId));
      dispatch(FetchFeedbackSequence(activeThreadId));
      dispatch(FetchFreshdeskTicketId(activeThreadId));
      dispatch(FetchOrders(activeThreadId));
    };

    loadThreadData();
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
    [dispatch],
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
  }, [agentMessage, attachments, clientID, handleThreadMessageAdded]);

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
    [playNotificationSound],
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

    dashboardWs.onerror = () => {};

    return () => {
      dashboardWs.close();
      if (dashboardWsRef.current === dashboardWs) {
        dashboardWsRef.current = null;
      }
    };
    // Socket lifecycle deliberately keys on auth + store only; the handlers
    // are read fresh via refs inside the socket callbacks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // Reconnect only when the listed inputs change; clientID and the session
    // email are stable for the life of the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    } catch {
      toast.error("Order Sync failed", {
        description: "Could not sync orders. Try again.",
      });
    }
  };

  return (
    <SidebarProvider
      style={{ "--sidebar-width": "350px" } as CSSProperties}
      className="-my-4 h-[calc(100svh-4rem)] min-h-0 w-full overflow-hidden md:-my-6"
    >
      {/* Conversations list — the nested sidebar from the sidebar-09 block. */}
      <Sidebar collapsible="none" className="hidden border-r md:flex">
        <SidebarHeader className="gap-3.5 border-b p-4">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2 text-base font-medium text-foreground">
              <IconMessage2 className="size-4" />
              Active Chats
            </div>
            {localThreads.length > 0 && (
              <Badge variant="secondary">{localThreads.length}</Badge>
            )}
          </div>
          <SidebarInput
            value={threadSearch}
            onChange={(event) => setThreadSearch(event.target.value)}
            placeholder="Search conversations…"
          />
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
                className={cn(
                  "flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors",
                  readFilter === option.key
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/60 bg-background text-muted-foreground hover:bg-muted/60",
                )}
              >
                {option.label}
                {option.key === "unread" && unreadCount > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-[10px]",
                      readFilter === "unread"
                        ? "bg-primary-foreground/20"
                        : "bg-muted text-foreground/70",
                    )}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              {FetchThreadsIsLoading ? (
                <LoadingState label="Loading conversations…" />
              ) : filteredThreads.length ? (
                filteredThreads.map((thread: ThreadWithReadState) => {
                  const isSelected = thread.id === activeThreadId;
                  const isUnread = thread.is_read === false;

                  return (
                    <button
                      key={thread.id}
                      type="button"
                      onClick={() => handleSelectThread(thread.id)}
                      className={cn(
                        "flex w-full items-start gap-3 border-b p-4 text-left text-sm leading-tight transition-colors last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        isSelected &&
                          "bg-sidebar-accent text-sidebar-accent-foreground",
                      )}
                    >
                      <CustomerAvatar
                        name={thread.customer?.name}
                        online={thread.is_active}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex w-full items-center gap-2">
                          <span
                            className={cn(
                              "truncate",
                              isUnread ? "font-semibold" : "font-medium",
                              !thread.customer?.name && "text-muted-foreground",
                            )}
                          >
                            {thread.customer?.name || "Guest"}
                          </span>
                          <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                            {formatRelativeDateTime(thread.created_at)}
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
                          <ReactMarkdown
                            components={TEASER_MARKDOWN_COMPONENTS}
                          >
                            {thread.last_message || "No messages yet."}
                          </ReactMarkdown>
                        </div>
                        <span className="mt-1 block text-[11px] text-muted-foreground">
                          {thread.total_messages} messages
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : threadSearch || readFilter !== "all" ? (
                <div className="flex flex-col items-center justify-center gap-1 p-6 text-center text-sm text-muted-foreground">
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
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No active chats for this store yet.
                </div>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      {/* Conversation + thread details. */}
      <SidebarInset className="min-h-0 overflow-hidden">
        <div className="flex h-full min-h-0">
          <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
            <header className="flex h-16 shrink-0 items-center border-b bg-background px-4">
              <div className="flex w-full items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <CustomerAvatar
                    name={selectedThread?.customer?.name}
                    online={selectedThread?.is_active}
                  />
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base leading-tight">
                      {selectedThread?.customer?.name || "Guest"}
                    </CardTitle>
                    {selectedThread?.is_active ? (
                      <p className="text-xs text-muted-foreground">
                        {connectedAgent
                          ? "Connected with agent"
                          : "Assistant ready"}
                      </p>
                    ) : null}
                  </div>
                </div>
                {activeThreadId && connectedAgent === session?.user?.email && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReturnToAI}
                    disabled={transitionState !== "idle"}
                  >
                    <IconRobot className="h-4 w-4" />
                    Return to AI
                  </Button>
                )}
              </div>
            </header>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {activeThreadId ? (
                FetchThreadDetailsIsLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <LoadingState label="Loading conversation…" />
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
            </div>
          </div>

          <aside className="hidden min-h-0 w-95 shrink-0 flex-col border-l xl:flex">
            <header className="flex h-16 shrink-0 flex-col justify-center border-b px-4">
              <div className="text-base leading-tight font-medium text-foreground">
                Customer Details
              </div>
              <p className="text-xs text-muted-foreground">
                Orders, cart, and profile for this conversation.
              </p>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {!activeThreadId ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Select a chat to see customer details.
                </div>
              ) : (
                <>
                  <OrdersCard
                    orders={FetchOrderData}
                    loading={FetchOrderDataIsLoading}
                    handleOrdersSync={handleOrdersSync}
                    orderSyncLoading={SyncOrdersIsLoading}
                    customerData={selectedThread?.customer || null}
                  />
                  <CartDetailsCard
                    cartData={FetchCartData}
                    loading={FetchCartDataIsLoading}
                  />
                  <UserMetadataCard
                    userMetadata={FetchUserMetadataData}
                    customerData={selectedThread?.customer || null}
                    loading={FetchUserMetadataIsLoading}
                  />
                </>
              )}
            </div>
          </aside>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
