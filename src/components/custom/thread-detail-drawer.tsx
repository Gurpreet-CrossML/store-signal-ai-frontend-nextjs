"use client";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  FetchAIInsight,
  FetchCart,
  FetchConversationSummary,
  FetchFeedbackSequence,
  FetchFreshdeskTicketId,
  FetchThreadDetails,
  FetchUserMetadata,
  Thread,
  ThreadMessage,
} from "@/redux/api-slice/thread-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { useEffect, useState } from "react";
import MessagePan from "@/components/custom/message-pan";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  IconCheck,
  IconTimeDuration0,
  IconUser,
  IconX,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTime, getDuration } from "@/lib/helpers";
import { Spinner } from "@/components/ui/spinner";
import { FEEDBACK_RATINGS } from "@/lib/config";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "../ui/skeleton";
import {
  CartDetailsCard,
  FreshdeskTicketCard,
  ThreadAIInsightCard,
  ThreadSummaryCard,
  UserMetadataCard,
} from "@/components/custom/thread-detail-panels";

export default function ThreadDetailDrawer({
  open,
  setOpen,
  thread,
  threadId,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  thread: Thread | null;
  /**
   * Id of the thread to show. Falls back to this when the full `thread` object
   * isn't on the loaded page yet (e.g. a freshly opened shared/deep link).
   */
  threadId?: string | null;
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

  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([]);

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
                </div>
              </div>
            </div>

            {FetchThreadDetailsIsLoading ? (
              <div className="flex-1 flex items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
                <Spinner className="h-5 w-5" />
                Loading messages…
              </div>
            ) : (
              <>
                {threadMessages && threadMessages?.length > 0 ? (
                  <>
                    <div className="flex-1 overflow-y-auto">
                      <MessagePan messages={threadMessages} />
                    </div>
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
