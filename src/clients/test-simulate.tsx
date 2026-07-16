"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import {
  IconBrain,
  IconCheck,
  IconClock,
  IconHelpCircle,
  IconMessageCircle,
  IconShieldCheck,
  IconUserCircle,
  IconWaveSine,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TestConversationPanel } from "@/components/custom/test-conversation-panel";
import { createWebSocketUrl } from "@/lib/config";
import { cn } from "@/lib/utils";
import { axiosInstance } from "@/redux/axios-config";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  CreateThread,
  FetchThreadDetails,
  type CartDetails,
  type OrderDetail,
  type ProductData,
  type ProductVariant,
  type RatingChoice,
  type ThreadDetails,
  type ThreadJsonContent,
  type ThreadMessage,
  type TicketDetails,
} from "@/redux/api-slice/thread-slice";

const STREAM_CHUNK_MS = 20;
const CHAT_SESSION_KEY = "chat_session_id";
const CHAT_SOUND_KEY = "chat_sound_enabled";

export type MessageRole = "user" | "assistant";
export type OfflineTask = "" | "view" | "checkout";

export type OfflineTaskData = {
  variant_name?: string;
  variant_id?: number;
  quantity?: number;
  item_id?: number;
} | null;

export type Product = ProductData;
export type MessageJsonContent = ThreadJsonContent;
export type OrderDetails = OrderDetail;
export type {
  CartDetails,
  ProductVariant,
  RatingChoice,
  TicketDetails,
};

export type Message = {
  id: string | number;
  role: MessageRole;
  message: string;
  created_at: Date | string;
  json_content?: MessageJsonContent;
  show_suggestions?: boolean;
  image_url?: string | string[] | null;
  streaming?: boolean;
  chat_hanlder?: string;
};

type Session = {
  session_id: string;
};

type TestChatbotContextValue = {
  store: string | null;
  session: Session | null;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  loading: boolean;
  reInitializing: boolean;
  responseLoading: boolean;
  isStreaming: boolean;
  isSoundEnabled: boolean;
  toggleSound: () => void;
  sendMessage: (
    text: string,
    isOffline?: boolean,
    taskName?: OfflineTask,
    taskData?: OfflineTaskData,
    imageUrl?: string | string[] | null,
  ) => void;
  addMessage: (message: Message) => void;
  handleScroll: () => void;
  resetChat: () => Promise<void>;
  messageContainerRef: MutableRefObject<HTMLDivElement | null>;
};

const TestChatbotContext = createContext<TestChatbotContextValue | null>(null);

export const useTestChatbotContext = () => {
  const context = useContext(TestChatbotContext);
  if (!context) {
    throw new Error(
      "useTestChatbotContext must be used inside <TestChatbotProvider>",
    );
  }
  return context;
};

export const uid = () =>
  Math.random().toString(36).slice(2) + Date.now().toString(36);

const sleep = async (ms: number) =>
  new Promise((resolve) => window.setTimeout(resolve, ms));

export function formatTimestamp(value: string | Date) {
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatPrice(amount: number | string, currency = "USD") {
  if (typeof amount === "string") return amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

const buildSimulationSocketUrl = (threadId: string, token?: string) => {
  const params = new URLSearchParams({ role: "customer" });
  if (token) params.set("token", token);
  return `${createWebSocketUrl(`/chat/${threadId}/`)}?${params.toString()}`;
};

type ConnectWebSocketOptions = {
  token?: string;
  onMessage?: (event: MessageEvent) => void;
  onSocketChange?: (socket: WebSocket | null) => void;
  retryAttempt?: number;
};

const connectWebSocket = (
  sessionId: string,
  {
    token,
    onMessage,
    onSocketChange,
    retryAttempt = 0,
  }: ConnectWebSocketOptions = {},
) => {
  if (!sessionId) return null;

  const ws = new WebSocket(buildSimulationSocketUrl(sessionId, token));

  if (onMessage) {
    ws.onmessage = onMessage;
  }

  ws.onopen = () => {
    console.debug("Test simulation websocket connected");
  };

  ws.onerror = (error) => {
    console.error("Test simulation websocket error:", error);
  };

  ws.onclose = () => {
    onSocketChange?.(null);
    const delay = Math.min(1000 * 2 ** retryAttempt, 30000);
    window.setTimeout(() => {
      const reconnectSocket = connectWebSocket(sessionId, {
        token,
        onMessage,
        onSocketChange,
        retryAttempt: retryAttempt + 1,
      });
      onSocketChange?.(reconnectSocket);
    }, delay);
  };

  return ws;
};

const applySuggestionVisibility = (items: Message[]) => {
  const updated = items.map((message) => ({
    ...message,
    show_suggestions: false,
  }));
  const lastMessage = updated[updated.length - 1];

  if (lastMessage?.role === "assistant") {
    lastMessage.show_suggestions =
      Array.isArray(lastMessage.json_content?.suggestions) &&
      lastMessage.json_content.suggestions.length > 0;
  }

  return updated;
};

type RestoredThreadDetails = ThreadDetails & {
  is_closed?: boolean;
  history?: Message[];
};

const toSimulationMessage = (message: ThreadMessage): Message => ({
  id: message.id,
  role: message.role === "user" ? "user" : "assistant",
  message: message.message || "",
  created_at: message.created_at,
  json_content: message.json_content,
  image_url: message.image_url ?? null,
});

function TestChatbotProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const selectedStore = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { data: authSession } = useSession();
  const accessToken = authSession?.user?.access_token;

  const [store, setStore] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const sessionId = session?.session_id;
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAgentConnected, setIsAgentConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [responseLoading, setResponseLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [reInitializing, setReInitializing] = useState(false);

  const messageContainerRef = useRef<HTMLDivElement | null>(null);
  const chatSocketRef = useRef<WebSocket | null>(null);
  const streamBufferRef = useRef("");
  const selectedStoreRef = useRef<string | null>(null);
  const sessionInitializationRef = useRef<() => Promise<void>>(async () => {});

  const handleSocketMessage = useCallback(async (event: MessageEvent) => {
    try {
      setIsStreaming(true);
      const data = JSON.parse(event.data);

      if (!data?.success || data?.sender === "customer") return;

      if (data.action_type === "connection") {
        setIsAgentConnected(data.chat_handler === "human");
        return;
      }

      if (data.action_type === "handler_change") {
        setIsAgentConnected(data.chat_handler === "human");
        return;
      }

      if (data.action_type === "message" && data.chunk) {
        await sleep(STREAM_CHUNK_MS);
        streamBufferRef.current += data.chunk;

        const messageMatch = streamBufferRef.current.match(
          /"message"\s*:\s*"((?:\\.|[^"\\])*)/,
        );

        if (messageMatch) {
          const extractedMessage = messageMatch[1]
            .replace(/\\"/g, '"')
            .replace(/\\n/g, "\n")
            .replace(/\\\\/g, "\\");

          setMessages((prev) => {
            const updated = [...prev];
            const lastMessage = updated[updated.length - 1];

            if (lastMessage?.role === "assistant") {
              lastMessage.message = extractedMessage;
            } else {
              updated.push({
                id: uid(),
                role: "assistant",
                message: extractedMessage,
                created_at: new Date(),
                streaming: true,
              });
            }

            return [...updated];
          });
        }
      }

      if (data.action_type === "message" && data.final_update) {
        const finalJson = data.final_update;

        if (
          finalJson?.is_active === false ||
          finalJson?.is_active === "false"
        ) {
          setReInitializing(true);
          if (chatSocketRef.current) {
            chatSocketRef.current.onmessage = null;
          }
          window.setTimeout(async () => {
            if (chatSocketRef.current) {
              chatSocketRef.current.onclose = null;
              chatSocketRef.current.close();
              chatSocketRef.current = null;
            }

            localStorage.removeItem(CHAT_SESSION_KEY);
            setMessages([]);
            await sessionInitializationRef.current();
            setReInitializing(false);
          }, 5000);
        }

        setMessages((prev) => {
          const updated: Message[] = prev.map((message) => ({
            ...message,
            show_suggestions: false,
          }));
          const lastMessage = updated[updated.length - 1];
          const jsonContent = finalJson.json_content || {};
          const finalMessage: Message = {
            id: finalJson.id,
            role: finalJson.role === "user" ? "user" : "assistant",
            message: finalJson.message || "",
            created_at: new Date(),
            streaming: false,
            json_content: jsonContent,
            image_url: finalJson.image_url || null,
            show_suggestions:
              Array.isArray(jsonContent?.suggestions) &&
              jsonContent.suggestions.length > 0,
          };

          if (
            lastMessage &&
            lastMessage.role === "assistant" &&
            lastMessage.streaming
          ) {
            updated[updated.length - 1] = {
              ...lastMessage,
              ...finalMessage,
            };
          } else {
            updated.push(finalMessage);
          }

          return updated;
        });

        setResponseLoading(false);
        setIsStreaming(false);
        streamBufferRef.current = "";
      }
    } catch (error) {
      console.error("Event listening failed, Error:", error);
      setResponseLoading(false);
      setIsStreaming(false);
    }
  }, []);

  const sessionInitialization = useCallback(async () => {
    if (!selectedStore) return;

    try {
      setLoading(true);

      if (!selectedStore) return;
      setStore(selectedStore);

      let activeSessionId = localStorage.getItem(CHAT_SESSION_KEY) || "";

      if (activeSessionId) {
        const threadData = (await dispatch(
          FetchThreadDetails(activeSessionId),
        ).unwrap()) as RestoredThreadDetails;

        if (threadData.is_closed || threadData.is_active === false) {
          localStorage.removeItem(CHAT_SESSION_KEY);
          activeSessionId = "";
        } else if (threadData.history?.length) {
          setMessages(applySuggestionVisibility(threadData.history));
        } else if (threadData.messages?.length) {
          setMessages(
            applySuggestionVisibility(
              threadData.messages.map(toSimulationMessage),
            ),
          );
        } else {
          activeSessionId = "";
        }
      }

      if (!activeSessionId) {
        const createdThread = await dispatch(
          CreateThread({ store_code: selectedStore }),
        ).unwrap();
        activeSessionId = createdThread?.thread_id || "";
      }

      if (!activeSessionId) {
        console.error("Failed to create session");
        return;
      }

      localStorage.setItem(CHAT_SESSION_KEY, activeSessionId);
      setSession({ session_id: activeSessionId });

      const chatSoundEnabled = localStorage.getItem(CHAT_SOUND_KEY);
      if (chatSoundEnabled === null) {
        localStorage.setItem(CHAT_SOUND_KEY, "true");
      } else {
        setIsSoundEnabled(chatSoundEnabled === "true");
      }

      chatSocketRef.current = connectWebSocket(activeSessionId, {
        token: accessToken,
        onMessage: handleSocketMessage,
        onSocketChange: (socket) => {
          chatSocketRef.current = socket;
        },
      });
    } catch (error) {
      console.error("Session checking failed, Error:", error);
    } finally {
      setLoading(false);
    }
  }, [accessToken, dispatch, handleSocketMessage, selectedStore]);

  useEffect(() => {
    sessionInitializationRef.current = sessionInitialization;
  }, [sessionInitialization]);

  const resetChat = useCallback(async () => {
    try {
      if (chatSocketRef.current) {
        chatSocketRef.current.onclose = null;
        chatSocketRef.current.onmessage = null;
        chatSocketRef.current.close();
        chatSocketRef.current = null;
      }

      localStorage.removeItem(CHAT_SESSION_KEY);
      setMessages([]);
      setResponseLoading(false);
      setIsStreaming(false);
      setReInitializing(false);
      streamBufferRef.current = "";
      setSession(null);

      await sessionInitialization();
    } catch (error) {
      console.error("Reset chat failed, Error:", error);
    }
  }, [sessionInitialization]);

  const toggleSound = useCallback(() => {
    setIsSoundEnabled((prev) => {
      localStorage.setItem(CHAT_SOUND_KEY, String(!prev));
      return !prev;
    });
  }, []);

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const sendMessage = useCallback(
    async (
      text: string,
      isOffline = false,
      taskName: OfflineTask = "",
      taskData: OfflineTaskData = null,
      imageUrl: string | string[] | null = null,
    ) => {
      void isOffline;
      void taskName;
      void taskData;

      const message = text.trim();
      const hasImage = Array.isArray(imageUrl)
        ? imageUrl.length > 0
        : !!imageUrl;

      if (reInitializing || (!message && !hasImage) || !sessionId) return;

      try {
        setMessages((prev) => [
          ...prev.map((item) => ({ ...item, show_suggestions: false })),
          {
            id: uid(),
            role: "user",
            message,
            created_at: new Date(),
            image_url: imageUrl,
          },
        ]);

        if (!isAgentConnected) {
          setResponseLoading(true);
        }

        if (
          !chatSocketRef.current ||
          chatSocketRef.current.readyState !== WebSocket.OPEN
        ) {
          const payload = JSON.stringify({
            message,
            image_url: imageUrl,
          });
          const socket = connectWebSocket(sessionId, {
            token: accessToken,
            onMessage: handleSocketMessage,
            onSocketChange: (socket) => {
              chatSocketRef.current = socket;
            },
          });
          chatSocketRef.current = socket;
          socket?.addEventListener(
            "open",
            () => {
              socket.send(payload);
            },
            { once: true },
          );
          return;
        }

        chatSocketRef.current.send(
          JSON.stringify({
            message,
            image_url: imageUrl,
          }),
        );
      } catch (error) {
        console.error("Message sending failed, Error:", error);
        setResponseLoading(false);
      }
    },
    [
      accessToken,
      handleSocketMessage,
      isAgentConnected,
      reInitializing,
      sessionId,
    ],
  );

  const handleScroll = useCallback(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (!selectedStore) return;

    if (
      selectedStoreRef.current &&
      selectedStoreRef.current !== selectedStore
    ) {
      localStorage.removeItem(CHAT_SESSION_KEY);
      setMessages([]);
      setSession(null);
    }
    selectedStoreRef.current = selectedStore;

    window.setTimeout(() => {
      void sessionInitialization();
    }, 0);

    return () => {
      if (chatSocketRef.current) {
        chatSocketRef.current.onclose = null;
        chatSocketRef.current.onmessage = null;
        chatSocketRef.current.close();
        chatSocketRef.current = null;
      }
    };
  }, [selectedStore, sessionInitialization]);

  useEffect(() => {
    handleScroll();
  }, [handleScroll, messages]);

  const value: TestChatbotContextValue = {
    store,
    session,
    messages,
    setMessages,
    loading,
    reInitializing,
    responseLoading,
    isStreaming,
    isSoundEnabled,
    toggleSound,
    sendMessage,
    addMessage,
    handleScroll,
    resetChat,
    messageContainerRef,
  };

  return (
    <TestChatbotContext.Provider value={value}>
      {children}
    </TestChatbotContext.Provider>
  );
}

const explainabilityItems = [
  {
    label: "Detected Intent",
    value: "Greeting",
    icon: IconMessageCircle,
    className: "bg-primary/10 text-primary",
  },
  {
    label: "Confidence Score",
    value: "98%",
    icon: IconShieldCheck,
    className: "bg-blue-50 text-blue-600",
    meter: true,
  },
  {
    label: "Matched Knowledge",
    value: "Welcome Message",
    icon: IconBrain,
    className: "bg-emerald-50 text-emerald-600",
  },
  {
    label: "Persona Used",
    value: "Friendly Assistant",
    icon: IconUserCircle,
    className: "bg-primary/10 text-primary",
  },
  {
    label: "Tone Used",
    value: "Warm",
    icon: IconWaveSine,
    className: "bg-orange-50 text-orange-500",
  },
  {
    label: "Model",
    value: "GPT-4o-mini",
    icon: IconBrain,
    className: "bg-sky-50 text-sky-600",
  },
];

const responseReasons = [
  "User started a new conversation",
  "Used greeting template from knowledge base",
  "Applied friendly & warm tone",
  "Added quick replies for better UX",
];

function ExplainabilityItem({
  item,
}: {
  item: (typeof explainabilityItems)[number];
}) {
  const Icon = item.icon;

  return (
    <div className="flex min-h-16 items-center justify-between gap-3 rounded-md border bg-background px-3 py-2.5 shadow-xs">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-md",
            item.className,
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{item.label}</p>
          <p className="truncate text-sm text-muted-foreground">{item.value}</p>
        </div>
      </div>
      {item.meter ? (
        <span className="size-5 rounded-full border-2 border-primary border-l-transparent" />
      ) : null}
    </div>
  );
}

export default function TestSimulate() {
  return (
    <TestChatbotProvider>
      <TestSimulateContent />
    </TestChatbotProvider>
  );
}

function TestSimulateContent() {
  const { resetChat, loading, reInitializing } = useTestChatbotContext();

  return (
    <div className="flex h-full min-h-[calc(100vh-var(--header-height)-3rem)] flex-col gap-6 px-4 lg:px-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <Tabs defaultValue="conversation" className="w-full xl:w-auto">
          <TabsList
            variant="line"
            className="h-10 w-full justify-start gap-8 border-b px-0 xl:w-[360px]"
          >
            <TabsTrigger
              value="conversation"
              className="px-5 data-active:text-primary data-active:after:bg-primary"
            >
              Test Conversation
            </TabsTrigger>
            <TabsTrigger value="replay" className="px-5">
              Historical Replay
            </TabsTrigger>
          </TabsList>
          <TabsContent value="conversation" className="hidden" />
          <TabsContent value="replay" className="hidden" />
        </Tabs>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:justify-end">
          <Button
            className="h-10 gap-2"
            onClick={resetChat}
            disabled={loading || reInitializing}
          >
            <IconMessageCircle className="size-4" />
            New Conversation
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <TestConversationPanel />
        <Card className="min-h-[620px] gap-4 py-5">
          <CardHeader className="flex flex-row items-center justify-between px-5">
            <CardTitle className="text-lg font-semibold">
              Explainability
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-primary hover:text-primary"
            >
              <IconHelpCircle className="size-4" />
              Why this response?
            </Button>
          </CardHeader>

          <CardContent className="space-y-3 px-5">
            {explainabilityItems.map((item) => (
              <ExplainabilityItem key={item.label} item={item} />
            ))}

            <div className="rounded-md bg-primary/5 px-4 py-3">
              <p className="mb-3 text-sm font-semibold">Response Reasoning</p>
              <div className="space-y-3">
                {responseReasons.map((reason) => (
                  <div key={reason} className="flex items-center gap-3 text-sm">
                    <IconCheck className="size-4 shrink-0 text-primary" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex min-h-12 items-center justify-between rounded-md border bg-background px-3 py-2 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-full text-primary">
                  <IconClock className="size-5" />
                </span>
                <span className="text-sm font-semibold">Latency</span>
              </div>
              <span className="text-sm font-semibold">1.23s</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
