"use client";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  CartDataResponse,
  FetchAIInsight,
  FetchCart,
  FetchConversationSummary,
  FetchFeedbackSequence,
  FetchFreshdeskTicketId,
  FetchThreadDetails,
  FetchUserMetadata,
  Thread,
  ThreadTicketData,
  UserMetadata,
  ThreadMessage,
} from "@/redux/api-slice/thread-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { useEffect, useRef, useState } from "react";
import MessagePan from "@/components/custom/message-pan";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  IconBrain,
  IconBrowser,
  IconCheck,
  IconDeviceDesktop,
  IconDeviceLaptop,
  IconLocationPin,
  IconNetwork,
  IconShoppingBag,
  IconTicket,
  IconTimeDuration0,
  IconUser,
  IconX,
  IconSend,
  IconRobot,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateTime, getDuration } from "@/lib/helpers";
import { Progress } from "@/components/ui/progress";
import { Field, FieldLabel } from "@/components/ui/field";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { FEEDBACK_RATINGS } from "@/lib/config";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "../ui/skeleton";
import { createWebSocketUrl } from "@/lib/config";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

/** Centered spinner used while a card's data is still being fetched. */
function CardLoadingState() {
  return (
    <div className="flex items-center justify-center py-6 text-muted-foreground">
      <Spinner className="size-5" />
    </div>
  );
}

function ThreadSummaryCard({
  summary,
  loading,
}: {
  summary: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent>
        <CardTitle>AI Summary</CardTitle>
        {loading ? (
          <CardLoadingState />
        ) : (
          <CardDescription>
            {summary || "No summary available."}
          </CardDescription>
        )}
      </CardContent>
    </Card>
  );
}

function ThreadAIInsightCard({
  nextActionableItems,
  resolutionSuccessRate,
  reasonForScore,
  overperformingCases,
  underperformingCases,
  loading,
}: {
  nextActionableItems: string[];
  resolutionSuccessRate: string;
  reasonForScore: string;
  overperformingCases: string[];
  underperformingCases: string[];
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <CardTitle className="flex items-center gap-2">
          <IconBrain className="size-4" />
          AI Insights
        </CardTitle>
        {loading ? (
          <CardLoadingState />
        ) : (
          <div className="flex flex-col gap-4">
            {nextActionableItems?.length > 0 && (
              <div className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 p-4">
                <span>Next Actionable Items</span>
                <ul className="mt-1 flex flex-col gap-2">
                  {nextActionableItems?.map((item, index) => (
                    <li key={index} className="flex gap-2 text-sm">
                      <span className="bg-amber-700 dark:bg-amber-950 p-1" />
                      {item}
                    </li>
                  )) || (
                    <p className="text-sm text-muted-foreground italic">
                      No data available.
                    </p>
                  )}
                </ul>
              </div>
            )}
            <Field className="w-full">
              <FieldLabel htmlFor="progress-upload">
                <span>Resolution Success Rate</span>
                <span className="ml-auto">{resolutionSuccessRate || 0}%</span>
              </FieldLabel>
              <Progress
                value={parseInt(resolutionSuccessRate || "0")}
                id="progress-upload"
              />
            </Field>

            <div>
              <span>Score Rationale</span>
              <p className="text-sm text-muted-foreground mt-1 italic">
                {reasonForScore || "No insights available."}
              </p>
            </div>

            <div>
              <span>Performing Matrix</span>
              {overperformingCases &&
              underperformingCases &&
              overperformingCases?.length === 0 &&
              underperformingCases?.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  No Matrix available.
                </p>
              ) : (
                <ul className="mt-1 flex flex-col gap-2">
                  {overperformingCases?.map((item, index) => (
                    <li key={index} className="flex gap-2 text-sm">
                      <span className="bg-green-700 dark:bg-green-950 p-1" />
                      {item}
                    </li>
                  ))}
                  {underperformingCases?.map((item, index) => (
                    <li key={index} className="flex gap-2 text-sm">
                      <span className="bg-red-700 dark:bg-red-950 p-1" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CartDetailsCard({
  cartData,
  loading,
}: {
  cartData: CartDataResponse | null;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <CardTitle className="flex items-center gap-2">
          <IconShoppingBag className="size-4" />
          Cart Details
        </CardTitle>
        {loading ? (
          <CardLoadingState />
        ) : !Object.values(cartData?.updated_cart_data || {}).length ? (
          <p className="text-sm text-muted-foreground italic">
            No cart data available.
          </p>
        ) : (
          cartData?.updated_cart_data?.map(
            (
              item: CartDataResponse["updated_cart_data"][number],
              index: number,
            ) => (
              <div
                key={index}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <Avatar>
                    {item.product_image ? (
                      <AvatarImage
                        src={item.product_image}
                        alt={item.name}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                        N/A
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="flex flex-col items-start gap-2">
                    <span>{item.name}</span>
                    <span className="text-muted-foreground text-xs">
                      Qty: {item.qty}
                    </span>
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {item.price || "N/A"}
                </span>
              </div>
            ),
          )
        )}
      </CardContent>
    </Card>
  );
}

function UserMetadataCard({
  userMetadata,
  loading,
}: {
  userMetadata: UserMetadata | null;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <CardTitle className="flex items-center gap-2">
          <IconUser className="size-4" />
          User Metadata
        </CardTitle>
        {loading ? (
          <CardLoadingState />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground border bg-primary/5 border-primary/20 p-2">
              <span className="bg-primary/20 p-1">
                <IconLocationPin className="size-5 inline text-primary" />
              </span>
              Location
              <span className="ml-auto">
                {userMetadata?.geo_location || "Unknown Location"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground border bg-primary/5 border-primary/20 p-2">
              <span className="bg-primary/20 p-1">
                <IconNetwork className="size-5 inline text-primary" />
              </span>
              IP Address
              <span className="ml-auto">
                {userMetadata?.ip_address || "Unknown IP Address"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground border bg-primary/5 border-primary/20 p-2">
              <span className="bg-primary/20 p-1">
                <IconDeviceLaptop className="size-5 inline text-primary" />
              </span>
              Device
              <span className="ml-auto">
                {userMetadata?.device_type || "Unknown Device"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground border bg-primary/5 border-primary/20 p-2">
              <span className="bg-primary/20 p-1">
                <IconBrowser className="size-5 inline text-primary" />
              </span>
              Browser
              <span className="ml-auto">
                {userMetadata?.browser || "Unknown Browser"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground border bg-primary/5 border-primary/20 p-2">
              <span className="bg-primary/20 p-1">
                <IconDeviceDesktop className="size-5 inline text-primary" />
              </span>
              OS
              <span className="ml-auto">
                {userMetadata?.os || "Unknown OS"}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FreshdeskTicketCard({
  ticketData,
  loading,
}: {
  ticketData: ThreadTicketData[] | null;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconTicket className="size-4" />
          Freshdesk Ticket
        </CardTitle>
      </CardHeader>
      {loading ? (
        <CardLoadingState />
      ) : ticketData?.length == 0 ? (
        <CardContent>
          <p className="text-sm text-muted-foreground italic">
            No Ticket data available.
          </p>
        </CardContent>
      ) : (
        <CardContent className="space-y-2">
          {ticketData?.map((ticket: ThreadTicketData, index: number) => (
            <Card key={index}>
              <CardContent className="space-y-2">
                <CardTitle>Ticket TCK-{ticket.ticket_id}</CardTitle>
                <CardTitle className="flex items-start justify-between gap-2 pb-2 border-b">
                  {ticket.subject}
                  <Badge>Open</Badge>
                </CardTitle>
                <CardDescription className="space-y-1 border-b pb-2">
                  {ticket.description || "No description available."}
                </CardDescription>
                <CardDescription className="text-xs">
                  Created:{" "}
                  {formatDateTime(ticket.created_at) || "Unknown creation date"}
                </CardDescription>
              </CardContent>
            </Card>
          )) || (
            <p className="text-sm text-muted-foreground italic">
              No Freshdesk ticket data available.
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function ThreadDetailDrawer({
  open,
  setOpen,
  thread,
  threadId,
  onClose,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  thread: Thread | null;
  /**
   * Id of the thread to show. Falls back to this when the full `thread` object
   * isn't on the loaded page yet (e.g. a freshly opened shared/deep link).
   */
  threadId?: string | null;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );

  const { FetchThreadDetailsData, FetchThreadDetailsIsLoading } =
    useAppSelector((state) => state.GetThreadReducer.FetchThreadDetailsState);
  const { FetchConversationSummaryData, FetchConversationSummaryIsLoading } =
    useAppSelector(
      (state) => state.GetThreadReducer.FetchConversationSummaryState,
    );
  const { FetchAIInsightData, FetchAIInsightIsLoading } = useAppSelector(
    (state) => state.GetThreadReducer.FetchAIInsightState,
  );
  const { FetchCartData, FetchCartDataIsLoading } = useAppSelector(
    (state) => state.GetThreadReducer.FetchCartDataState,
  );
  const { FetchUserMetadataData, FetchUserMetadataIsLoading } = useAppSelector(
    (state) => state.GetThreadReducer.FetchUserMetadataState,
  );
  const { FetchFeedbackSequenceData, FetchFeedbackSequenceIsLoading } =
    useAppSelector(
      (state) => state.GetThreadReducer.FetchFeedbackSequenceState,
    );
  const { FetchFreshdeskTicketIdData } = useAppSelector(
    (state) => state.GetThreadReducer.FetchFreshdeskTicketIdState,
  );

  const { data: session } = useSession();
  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([]);
  const [isAgentConnected, setIsAgentConnected] = useState(false);
  const [transitionState, setTransitionState] = useState<
    "idle" | "taking_over" | "returning_to_ai"
  >("idle");
  const [agentMessage, setAgentMessage] = useState("");

  const wsRef = useRef<WebSocket | null>(null);

  // Prefer the id from the loaded row, but fall back to the deep-linked id so
  // the drawer still loads when opened directly from a shared URL.
  const activeThreadId = thread?.id || threadId || "";

  useEffect(() => {
    if (!open) return; // Only fetch when the drawer is opened
    if (!storeCode) return;
    if (!activeThreadId) return;

    const loadData = async () => {
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

    loadData();
  }, [dispatch, storeCode, activeThreadId, open]);

  useEffect(() => {
    if (!activeThreadId || !thread?.is_active || !session?.user?.access_token) {
      return;
    }

    // Websocket connection
    const url = createWebSocketUrl(
      `/chat/${activeThreadId}/?role=agent&token=${session?.user?.access_token}`,
    );
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

      if (!data?.success || data?.sender == "agent") {
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
        setThreadMessages((prev) => [
          ...prev,
          {
            id: data?.final_update?.id,
            role: data?.final_update?.role,
            message: data?.final_update?.message,
            json_content: data?.final_update?.json_content || {},
            created_at: new Date().toISOString(),
            threadId: activeThreadId,
            messaged_by: "",
          },
        ]);
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
      setAgentMessage("");
      setIsAgentConnected(false);
      setTransitionState("idle");
      setThreadMessages([]);
    };
  }, [activeThreadId]);

  const handleTakeOver = async () => {
    if (!activeThreadId || !wsRef.current) {
      return;
    }

    try {
      setTransitionState("taking_over");
      const message = JSON.stringify({
        action_type: "handler_change",
        chat_handler: "human",
      });
      wsRef.current.send(message);
    } catch (error) {
      console.error(error);
      setTransitionState("idle");
    }
  };

  const handleReturnToAI = async () => {
    if (!activeThreadId || !wsRef.current) {
      return;
    }

    try {
      setTransitionState("returning_to_ai");
      const message = JSON.stringify({
        action_type: "handler_change",
        chat_handler: "ai",
      });
      wsRef.current.send(message);
    } catch (error) {
      console.error(error);
      setTransitionState("idle");
    }
  };

  const handleSendAgentMessage = () => {
    const message = agentMessage.trim();

    if (!message || !wsRef.current) {
      return;
    }

    // Add immediately to UI
    setThreadMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        role: "assistant",
        message,
        created_at: new Date().toISOString(),
        threadId: activeThreadId,
        messaged_by: "You",
      },
    ]);

    // Send websocket message
    wsRef.current.send(
      JSON.stringify({
        message,
      }),
    );

    setAgentMessage("");
  };

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="right">
      <DrawerContent className="max-w-full! w-[60%]! overflow-hidden py-2">
        <DrawerHeader className="flex-row justify-between">
          <div className="flex flex-col gap-2 max-w-1/3">
            <DrawerTitle className="flex items-center gap-2">
              {thread?.name || FetchThreadDetailsData?.name || "Thread"}
              {FetchThreadDetailsIsLoading ? (
                <Skeleton className="w-18 h-5" />
              ) : (
                <Badge className="font-normal">
                  {FetchThreadDetailsData?.is_active ? "Active" : "Closed"}
                </Badge>
              )}
              {FetchThreadDetailsIsLoading ? (
                <Skeleton className="w-22 h-5" />
              ) : (
                <Badge
                  className={cn(
                    "font-normal",
                    FetchThreadDetailsData?.verdict?.verdict == "resolved"
                      ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                      : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
                  )}
                >
                  {FetchThreadDetailsData?.verdict?.verdict == "resolved" ? (
                    <IconCheck data-icon="inline-start" />
                  ) : (
                    <IconX data-icon="inline-start" />
                  )}
                  {FetchThreadDetailsData?.verdict?.verdict == "resolved"
                    ? "Resolved"
                    : "Unresolved"}
                </Badge>
              )}
              {FetchFeedbackSequenceIsLoading ? (
                <Skeleton className="w-22 h-5" />
              ) : (
                FetchFeedbackSequenceData?.feedback && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge className="font-normal">
                        {FEEDBACK_RATINGS.find(
                          (rating) =>
                            rating.value ===
                            FetchFeedbackSequenceData.feedback?.rating,
                        )?.label ?? "No Feedback"}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {FetchFeedbackSequenceData.feedback?.feedback_message ||
                          "No feedback message provided."}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )
              )}
            </DrawerTitle>
            <DrawerDescription>{activeThreadId}</DrawerDescription>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {thread?.tags?.map((tag, idx) => (
                <Badge key={idx} variant="secondary" className="font-normal">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex flex-row gap-2">
            <Card>
              <CardContent>
                <CardTitle className="flex items-center gap-2">
                  <IconTimeDuration0 className="size-4" />
                  Started at
                </CardTitle>
                <CardDescription className="flex flex-col">
                  {FetchThreadDetailsIsLoading ? (
                    <Skeleton className="w-28 h-5" />
                  ) : (
                    formatDateTime(FetchThreadDetailsData?.created_at || "-")
                  )}
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <CardTitle className="flex items-center gap-2">
                  <IconTimeDuration0 className="size-4" />
                  Closed at
                </CardTitle>
                <CardDescription className="flex flex-col">
                  {FetchThreadDetailsIsLoading ? (
                    <Skeleton className="w-28 h-5" />
                  ) : (
                    formatDateTime(FetchThreadDetailsData?.ended_at || "-")
                  )}
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <CardTitle className="flex items-center gap-2">
                  <IconTimeDuration0 className="size-4" />
                  Duration
                </CardTitle>
                <CardDescription className="flex flex-col">
                  {FetchThreadDetailsIsLoading ? (
                    <Skeleton className="w-28 h-5" />
                  ) : (
                    getDuration(
                      FetchThreadDetailsData?.created_at,
                      FetchThreadDetailsData?.ended_at,
                    ) || "-"
                  )}
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <CardTitle className="flex items-center gap-2">
                  <IconUser className="size-4" />
                  Customer Info
                </CardTitle>
                <CardDescription className="flex flex-col">
                  {FetchThreadDetailsIsLoading ? (
                    <Skeleton className="w-28 h-5" />
                  ) : (
                    <>
                      {thread?.customer?.name ||
                        FetchThreadDetailsData?.customer_name ||
                        "Anonymous"}

                      {(thread?.customer?.email ||
                        FetchThreadDetailsData?.customer_email) && (
                        <>
                          <br />
                          {thread?.customer?.email ||
                            FetchThreadDetailsData?.customer_email ||
                            "-"}
                        </>
                      )}
                    </>
                  )}
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </DrawerHeader>
        <div className="grid grid-cols-1 lg:grid-cols-2 p-4 pb-0 h-full overflow-hidden">
          <div className="relative flex flex-col h-full overflow-hidden border-0 border-r-1 border-r-border/50">
            <div className="border-b border-gray-200 dark:border-slate-800 px-6 py-4 bg-gradient-to-r from-white dark:from-slate-900 to-gray-50 dark:to-slate-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Messages
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {isAgentConnected ? "Connected with agent" : "AI Assistant"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isAgentConnected ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-full">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs font-medium text-green-700 dark:text-green-400">
                        Live
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                      <IconRobot className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                        AI Mode
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {FetchThreadDetailsIsLoading ? (
              <div className="flex-1 flex items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
                <Spinner className="h-5 w-5" />
                <span className="text-sm font-medium">Loading messages…</span>
              </div>
            ) : (
              <>
                {threadMessages && threadMessages?.length > 0 ? (
                  <>
                    <div className="flex-1 overflow-y-auto">
                      <MessagePan messages={threadMessages} />
                    </div>

                    {FetchThreadDetailsData?.is_active && (
                      <div className="border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        {!isAgentConnected ? (
                          /* AI Mode */
                          <div className="p-4">
                            <Button
                              className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                              onClick={handleTakeOver}
                              disabled={transitionState !== "idle"}
                            >
                              Take Over Chat
                            </Button>
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
                              Help this customer directly
                            </p>
                          </div>
                        ) : (
                          <div className="p-4 space-y-3">
                            <div className="flex gap-2">
                              <Input
                                placeholder="Type your message…"
                                value={agentMessage}
                                onChange={(e) =>
                                  setAgentMessage(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendAgentMessage();
                                  }
                                }}
                                className="flex-1 h-10 bg-gray-50 dark:bg-slate-800 border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent placeholder:text-gray-500 dark:placeholder:text-gray-400"
                              />
                              <Button
                                onClick={handleSendAgentMessage}
                                disabled={
                                  !agentMessage.trim() ||
                                  transitionState !== "idle"
                                }
                                className="h-10 w-10 p-0 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="Send message"
                              >
                                <IconSend className="h-4 w-4" />
                              </Button>
                            </div>

                            <Button
                              variant="outline"
                              className="w-full h-10 border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                              onClick={handleReturnToAI}
                              disabled={transitionState !== "idle"}
                            >
                              Return to AI
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center px-6">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        No messages found
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs">
                        This conversation has no messages yet.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {transitionState !== "idle" && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-3 rounded-lg border bg-background p-6 shadow-lg min-w-[280px]">
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

          <div className="flex flex-col h-full overflow-hidden px-4 gap-2">
            <h3 className="text-lg font-semibold mb-2">Thread Details</h3>
            <div className="h-full space-y-4 p-2 overflow-y-auto">
              <ThreadSummaryCard
                summary={
                  FetchConversationSummaryData?.conversation_summary || ""
                }
                loading={FetchConversationSummaryIsLoading}
              />
              <ThreadAIInsightCard
                nextActionableItems={
                  FetchAIInsightData?.next_actionable_items || []
                }
                resolutionSuccessRate={
                  FetchAIInsightData?.resolution_success_rate || "0"
                }
                reasonForScore={FetchAIInsightData?.reason_for_score || ""}
                overperformingCases={
                  FetchAIInsightData?.overperforming_cases || []
                }
                underperformingCases={
                  FetchAIInsightData?.underperforming_cases || []
                }
                loading={FetchAIInsightIsLoading}
              />
              <FreshdeskTicketCard
                ticketData={FetchFreshdeskTicketIdData || []}
                loading={FetchThreadDetailsIsLoading}
              />
              <CartDetailsCard
                cartData={FetchCartData}
                loading={FetchCartDataIsLoading}
              />
              <UserMetadataCard
                userMetadata={FetchUserMetadataData}
                loading={FetchUserMetadataIsLoading}
              />
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
