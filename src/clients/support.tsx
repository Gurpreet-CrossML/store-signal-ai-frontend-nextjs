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
} from "@/redux/api-slice/thread-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { Spinner } from "@/components/ui/spinner";
import {
  IconMessage2,
  IconMoodSmile,
  IconPaperclip,
  IconUser,
  IconX,
} from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { toast } from "sonner";
import { ENDPOINTS } from "@/lib/config";

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

function ThreadChatControls({
  activeThreadId,
  isThreadActive = true,
  className,
  isAgentConnected,
  transitionState,
  agentMessage,
  setAgentMessage,
  selectedFiles,
  isEmojiPickerOpen,
  setIsEmojiPickerOpen,
  onTakeOver,
  onReturnToAI,
  onSendAgentMessage,
  onFileSelection,
  onEmojiSelect,
  onRemoveSelectedFile,
}: {
  activeThreadId?: string | null;
  isThreadActive?: boolean;
  className?: string;
  isAgentConnected: boolean;
  transitionState: "idle" | "taking_over" | "returning_to_ai";
  agentMessage: string;
  setAgentMessage: (value: string) => void;
  selectedFiles: File[];
  isEmojiPickerOpen: boolean;
  setIsEmojiPickerOpen: (value: boolean) => void;
  onTakeOver: () => void;
  onReturnToAI: () => void;
  onSendAgentMessage: () => void;
  onFileSelection: (event: ChangeEvent<HTMLInputElement>) => void;
  onEmojiSelect: (emoji: string) => void;
  onRemoveSelectedFile: (index: number) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!activeThreadId || !isThreadActive) {
    return null;
  }

  return (
    <div
      className={`relative border-t border-border/50 bg-background/95 p-4 ${className ?? ""}`}
    >
      {isAgentConnected && (
        <div className="rounded-xl border border-border/60 bg-background/80 p-2 shadow-sm">
          {isEmojiPickerOpen && (
            <div className="mb-2 flex flex-wrap gap-2 rounded-lg border border-border/60 bg-muted/40 p-2">
              {["😀", "😊", "👍", "❤️", "🎉", "🙏"].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="rounded-md px-2 py-1 text-lg transition hover:bg-background"
                  onClick={() => onEmojiSelect(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {selectedFiles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/60 px-2 py-2 text-xs text-muted-foreground"
                >
                  {file.type.startsWith("image/") ? (
                    <Image
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      width={40}
                      height={40}
                      unoptimized
                      className="h-10 w-10 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-background/70">
                      <IconPaperclip className="h-4 w-4" />
                    </div>
                  )}
                  <span className="max-w-[140px] truncate">{file.name}</span>
                  <button
                    type="button"
                    className="ml-1 rounded-full p-0.5 text-muted-foreground transition hover:bg-background hover:text-foreground"
                    onClick={() => onRemoveSelectedFile(index)}
                    title="Remove attachment"
                  >
                    <IconX className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-background text-muted-foreground transition hover:bg-muted"
              onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
              title="Add emoji"
            >
              <IconMoodSmile className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-background text-muted-foreground transition hover:bg-muted"
              onClick={() => fileInputRef.current?.click()}
              title="Attach image or file"
            >
              <IconPaperclip className="h-4 w-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={onFileSelection}
              className="hidden"
            />
            <div className="flex-1">
              <input
                placeholder="Type your message…"
                value={agentMessage}
                onChange={(event) => setAgentMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    onSendAgentMessage();
                  }
                }}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <button
              type="button"
              onClick={onSendAgentMessage}
              disabled={
                (!agentMessage.trim() && selectedFiles.length === 0) ||
                transitionState !== "idle"
              }
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              title="Send message"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 20l18-8-18-8 4 8-4 8z" />
              </svg>
            </button>
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
  const { FetchUserMetadataData, FetchUserMetadataIsLoading } = useAppSelector(
    (state) => state.GetThreadReducer.FetchUserMetadataState,
  );

  const threads = useMemo(
    () => FetchThreadsListData?.results ?? [],
    [FetchThreadsListData],
  );
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([]);
  const [isAgentConnected, setIsAgentConnected] = useState(false);
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);
  const [transitionState, setTransitionState] = useState<
    "idle" | "taking_over" | "returning_to_ai"
  >("idle");
  const [agentMessage, setAgentMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const { data: session } = useSession();
  const wsRef = useRef<WebSocket | null>(null);

  const activeThreadId = selectedThreadId ?? threads[0]?.id ?? null;

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) ?? null,
    [activeThreadId, threads],
  );

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
    };

    void loadThreadData();
  }, [dispatch, activeThreadId, storeCode]);

  const handleThreadMessageAdded = useCallback((message: ThreadMessage) => {
    setThreadMessages((prev) => [...prev, message]);
  }, []);

  const handleCloseRequest = useCallback(() => {
    setIsCloseConfirmOpen(true);
  }, []);

  const handleConfirmClose = useCallback(() => {
    setSelectedThreadId(null);
    setIsCloseConfirmOpen(false);
  }, []);

  const handleCancelClose = useCallback(() => {
    setIsCloseConfirmOpen(false);
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

  const handleSendAgentMessage = useCallback(() => {
    const message = agentMessage.trim();
    const attachmentText = selectedFiles.length
      ? `\nAttachments: ${selectedFiles.map((file) => file.name).join(", ")}`
      : "";
    const outgoingMessage = `${message}${attachmentText}`.trim();

    if (!outgoingMessage || !wsRef.current) {
      return;
    }

    handleThreadMessageAdded({
      role: "assistant",
      message: outgoingMessage,
      created_at: new Date().toISOString(),
      messaged_by: "You",
    });

    wsRef.current.send(JSON.stringify({ message: outgoingMessage }));
    setAgentMessage("");
    setSelectedFiles([]);
    setIsEmojiPickerOpen(false);
  }, [agentMessage, handleThreadMessageAdded, selectedFiles]);

  const handleFileSelection = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      if (!files.length) {
        return;
      }

      setSelectedFiles((prev) => [...prev, ...files]);
      event.target.value = "";
    },
    [],
  );

  const handleEmojiSelect = useCallback((emoji: string) => {
    setAgentMessage((prev) => `${prev}${emoji}`);
    setIsEmojiPickerOpen(false);
  }, []);

  const removeSelectedFile = useCallback((index: number) => {
    setSelectedFiles((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index),
    );
  }, []);

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

    const url = ENDPOINTS.chatSocket(activeThreadId, session.user.access_token);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.info("Agent connected");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (!data?.success && data?.action_type === "handler_change") {
        toast.error("Permission Issue!", {
          description: data?.message || "",
        });
        setTransitionState("idle");
        return;
      }

      if (!data?.success || data?.sender === "agent") {
        return;
      }

      if (data?.success && data?.action_type === "connection") {
        setIsAgentConnected(data?.chat_handler === "human");
        return;
      }

      if (data?.success && data?.action_type === "handler_change") {
        setIsAgentConnected(data?.chat_handler === "human");
        setTransitionState("idle");
        return;
      }

      if (
        data?.success &&
        data?.action_type === "message" &&
        data?.final_update
      ) {
        handleThreadMessageAdded({
          role: data?.final_update?.role,
          message: data?.final_update?.message,
          json_content: data?.final_update?.json_content || {},
          created_at: new Date().toISOString(),
          messaged_by: "",
        });
      }
    };

    ws.onclose = () => {
      console.info("Agent disconnected");
    };

    ws.onerror = (error) => {
      console.error("WebSocket error", error);
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [
    activeThreadId,
    handleThreadMessageAdded,
    selectedThread?.is_active,
    session?.user?.access_token,
  ]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-[320px_minmax(0,1fr)_520px]">
        <Card className="flex min-h-0 flex-col overflow-hidden gap-2">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="flex items-center gap-2 text-base">
              <IconMessage2 className="size-4" />
              Active Chats
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 overflow-y-auto p-3">
            {FetchThreadsIsLoading ? (
              <div className="flex h-full items-center justify-center">
                <Spinner />
              </div>
            ) : threads.length ? (
              <div className="space-y-2">
                {threads.map((thread: Thread) => {
                  const isSelected = thread.id === activeThreadId;

                  return (
                    <button
                      key={thread.id}
                      type="button"
                      onClick={() => setSelectedThreadId(thread.id)}
                      className={`w-full rounded-lg border p-3 text-left transition ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border/60 bg-background hover:border-primary/50 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="mt-0.5 h-9 w-9 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                            <IconUser className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              {thread.customer?.name ? (
                                <p className="truncate text-sm font-medium">
                                  {thread.customer.name}
                                </p>
                              ) : null}
                              <p
                                className={`line-clamp-2 text-xs text-muted-foreground ${
                                  thread.customer?.name ? "mt-1" : "mt-0"
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
            ) : (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                No active chats matched the current store scope.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex min-h-0 flex-col overflow-hidden">
          <CardHeader className="border-b border-border/50">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Avatar className="mt-0.5 h-9 w-9 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                    <IconUser className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    {selectedThread?.customer?.name ||
                      selectedThread?.name ||
                      "Conversation"}
                  </CardTitle>
                  {selectedThread?.is_active ? (
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${isAgentConnected ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"}`}
                      >
                        {isAgentConnected ? "Live" : "AI Mode"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {isAgentConnected
                          ? "Connected with agent"
                          : "Assistant ready"}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {selectedThread?.is_active ? (
                  !isAgentConnected ? (
                    <Button
                      type="button"
                      onClick={handleTakeOver}
                      disabled={transitionState !== "idle"}
                    >
                      Take Over
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleReturnToAI}
                      disabled={transitionState !== "idle"}
                    >
                      Return to AI
                    </Button>
                  )
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCloseRequest}
                >
                  Close
                </Button>
              </div>
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
                      <MessagePan messages={threadMessages} />
                    ) : (
                      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
                        No messages were returned for this thread yet.
                      </div>
                    )}
                  </div>
                  {selectedThread?.is_active ? (
                    <ThreadChatControls
                      activeThreadId={activeThreadId}
                      isThreadActive={selectedThread.is_active}
                      className="border-t"
                      isAgentConnected={isAgentConnected}
                      transitionState={transitionState}
                      agentMessage={agentMessage}
                      setAgentMessage={setAgentMessage}
                      selectedFiles={selectedFiles}
                      isEmojiPickerOpen={isEmojiPickerOpen}
                      setIsEmojiPickerOpen={setIsEmojiPickerOpen}
                      onTakeOver={handleTakeOver}
                      onReturnToAI={handleReturnToAI}
                      onSendAgentMessage={handleSendAgentMessage}
                      onFileSelection={handleFileSelection}
                      onEmojiSelect={handleEmojiSelect}
                      onRemoveSelectedFile={removeSelectedFile}
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

        <Card className="flex min-h-0 flex-col overflow-hidden">
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
                <CartDetailsCard
                  cartData={FetchCartData}
                  loading={FetchCartDataIsLoading}
                />
                <UserMetadataCard
                  userMetadata={FetchUserMetadataData}
                  loading={FetchUserMetadataIsLoading}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {isCloseConfirmOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border/60 bg-background p-6 shadow-xl">
            <h3 className="text-lg font-semibold">Close conversation?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This will clear the current conversation view. You can reopen it
              later from the thread list.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelClose}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleConfirmClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
