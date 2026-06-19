"use client";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  FetchTicketDetails,
  type Ticket,
} from "@/redux/api-slice/ticket-slice";
import { useEffect } from "react";
import { formatDateTime } from "@/lib/helpers";
import type { NormalizedTicketDetail } from "@/lib/platform-tickets/types";
import ReactMarkdown from "react-markdown";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { IconPaperclip } from "@tabler/icons-react";

function stripImagesAndFiles(text: string | null | undefined): string {
  if (!text) return "";
  
  // 1. Remove markdown images: ![alt](url)
  let clean = text.replace(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/gi, "");
  
  // 2. Remove HTML images: <img ...>
  clean = clean.replace(/<img[^>]*>/gi, "");
  
  // 3. Remove divider lines like *** or * * * or ---
  clean = clean.replace(/^\s*([*-]){3,}\s*$/gm, "");
  
  // 4. Remove lines like "**Images (3):**", "Images (3):", "**Image 1:**", "Image 1:"
  clean = clean.replace(/^\s*(\*\*)?Images(\s*\(\d+\))?:?(\*\*)?\s*$/gim, "");
  clean = clean.replace(/^\s*(\*\*)?Image\s*\d+:?(\*\*)?\s*$/gim, "");
  
  // 5. Clean up multiple empty lines or trailing/leading whitespace
  return clean.replace(/\n{3,}/g, "\n\n").trim();
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  );
}

function ConversationThread({
  conversation,
}: {
  conversation: NormalizedTicketDetail["conversation"];
}) {
  if (!conversation.length) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No conversation messages.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {conversation.map((msg, i) => (
        <div
          key={i}
          className="rounded-lg border border-border/50 bg-muted/40 p-3 text-sm space-y-1"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-foreground text-xs">
              {msg.author || "Unknown"}
            </span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDateTime(msg.created_at)}
            </span>
          </div>
          <div className="text-muted-foreground text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                img: () => null,
                a: ({ node, ...props }) => (
                  <a
                    {...props}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
                  />
                ),
              }}
            >
              {stripImagesAndFiles(msg.body || "—")}
            </ReactMarkdown>
          </div>
        </div>
      ))}
    </div>
  );
}

function AttachmentList({
  attachments,
}: {
  attachments: NormalizedTicketDetail["attachments"];
}) {
  if (!attachments.length) {
    return (
      <p className="text-sm text-muted-foreground italic">No attachments.</p>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {attachments.map((att, i) => (
        <li key={i}>
          <a
            href={att.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-sm text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            <IconPaperclip className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate max-w-xs">{att.name || att.url}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function ExternalTicketCard({
  externalDetails,
  loading,
}: {
  externalDetails: Record<string, unknown> | null;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10 text-muted-foreground">
          <Spinner className="size-5 mr-2" />
          <span className="text-sm">Loading external details…</span>
        </CardContent>
      </Card>
    );
  }

  if (!externalDetails) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No external ticket details available.
        </CardContent>
      </Card>
    );
  }

  // Surface API errors gracefully
  if (typeof externalDetails.error === "string") {
    return (
      <Card className="border-destructive/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-destructive">
            External API Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {externalDetails.error}
          </p>
        </CardContent>
      </Card>
    );
  }

  const ext = externalDetails as unknown as NormalizedTicketDetail;

  return (
    <div className="flex flex-col gap-4 overflow-y-auto h-full pr-1">
      <Accordion
        type="multiple"
        defaultValue={["info", "description", "conversation", "attachments"]}
        className="w-full space-y-3"
      >
        {/* Ticket Info */}
        <AccordionItem value="info" className="border rounded-lg bg-card text-card-foreground shadow-xs">
          <AccordionTrigger className="px-6 py-4 hover:no-underline [&[data-state=open]]:border-b [&[data-state=open]]:border-border/50">
            <span className="text-sm font-semibold">Ticket Info</span>
          </AccordionTrigger>
          <AccordionContent className="px-6 pt-4 pb-4">
            <div className="space-y-3">
              {ext.requester && (
                <DetailRow
                  label="Requester"
                  value={
                    <span>
                      {ext.requester.name || ext.requester.email || "—"}
                      {ext.requester.name && ext.requester.email && (
                        <span className="ml-1 text-muted-foreground text-xs">
                          ({ext.requester.email})
                        </span>
                      )}
                    </span>
                  }
                />
              )}
              <div className="flex flex-wrap gap-4">
                {ext.status && (
                  <DetailRow
                    label="Status"
                    value={
                      <Badge variant="secondary" className="h-fit py-0.5 font-normal capitalize">
                        {ext.status}
                      </Badge>
                    }
                  />
                )}
                {ext.priority && (
                  <DetailRow
                    label="Priority"
                    value={
                      <Badge variant="outline" className="h-fit py-0.5 font-normal capitalize">
                        {ext.priority}
                      </Badge>
                    }
                  />
                )}
              </div>
              {ext.created_at && (
                <DetailRow
                  label="Created"
                  value={formatDateTime(ext.created_at)}
                />
              )}
              {ext.updated_at && (
                <DetailRow
                  label="Updated"
                  value={formatDateTime(ext.updated_at)}
                />
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Description */}
        {ext.description && (
          <AccordionItem value="description" className="border rounded-lg bg-card text-card-foreground shadow-xs">
            <AccordionTrigger className="px-6 py-4 hover:no-underline [&[data-state=open]]:border-b [&[data-state=open]]:border-border/50">
              <span className="text-sm font-semibold">Description</span>
            </AccordionTrigger>
            <AccordionContent className="px-6 pt-4 pb-4 text-sm text-muted-foreground leading-relaxed prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  img: () => null,
                  a: ({ node, ...props }) => (
                    <a
                      {...props}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
                    />
                  ),
                }}
              >
                {stripImagesAndFiles(ext.description)}
              </ReactMarkdown>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Conversation */}
        <AccordionItem value="conversation" className="border rounded-lg bg-card text-card-foreground shadow-xs">
          <AccordionTrigger className="px-6 py-4 hover:no-underline [&[data-state=open]]:border-b [&[data-state=open]]:border-border/50">
            <span className="text-sm font-semibold">
              Conversation
              {ext.conversation?.length > 0 && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  ({ext.conversation.length} message{ext.conversation.length !== 1 ? "s" : ""})
                </span>
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-6 pt-4 pb-4">
            <ConversationThread conversation={ext.conversation ?? []} />
          </AccordionContent>
        </AccordionItem>

        {/* Attachments */}
        <AccordionItem value="attachments" className="border rounded-lg bg-card text-card-foreground shadow-xs">
          <AccordionTrigger className="px-6 py-4 hover:no-underline [&[data-state=open]]:border-b [&[data-state=open]]:border-border/50">
            <span className="text-sm font-semibold">
              Attachments
              {ext.attachments?.length > 0 && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  ({ext.attachments.length})
                </span>
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-6 pt-4 pb-4">
            <AttachmentList attachments={ext.attachments ?? []} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────

export default function TicketDetailDrawer({
  open,
  setOpen,
  ticket,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  ticket: Ticket | null;
}) {
  const dispatch = useAppDispatch();

  const { FetchTicketDetailsData, FetchTicketDetailsIsLoading } =
    useAppSelector(
      (state) => state.GetTicketReducer.FetchTicketDetailsState,
    );

  const ticketId = ticket?.ticket_id;

  useEffect(() => {
    if (!open || !ticketId) return;
    dispatch(FetchTicketDetails(ticketId));
  }, [dispatch, open, ticketId]);

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="right">
      <DrawerContent className="max-w-full! w-[60%]! h-full overflow-hidden py-2">
        <DrawerHeader className="flex-row justify-between">
          <div className="flex flex-col gap-2 max-w-1/3">
            <DrawerTitle className="flex items-center gap-2">
              Ticket TCK-{ticket?.ticket_id}
              <Badge className="h-fit py-0.5 font-normal">
                {ticket?.platform || "Unknown Platform"}
              </Badge>
              <Badge className="h-fit py-0.5 font-normal">
                {ticket?.status || "Unknown Status"}
              </Badge>
            </DrawerTitle>
            <DrawerDescription>{ticket?.subject || "No subject"}</DrawerDescription>
          </div>
          <div className="flex flex-row gap-2">
            <Card>
              <CardContent>
                <CardTitle>Created</CardTitle>
                <CardDescription>
                  {formatDateTime(ticket?.created_at || "")}
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <CardTitle>Updated</CardTitle>
                <CardDescription>
                  {formatDateTime(ticket?.updated_at || "")}
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </DrawerHeader>

        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 p-4 pb-4 overflow-hidden gap-4">
          {/* Left – local summary */}
          <div className="flex flex-col h-full overflow-hidden border-0 border-r-1 border-r-border/50 pr-4">
            <h3 className="text-lg font-semibold mb-2">Summary</h3>
            <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <CardContent className="space-y-4 overflow-y-auto flex-1 p-6">
                <div>
                  <p className="text-sm font-medium">Description</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {stripImagesAndFiles(ticket?.description) || "No description provided."}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Thread</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {ticket?.thread || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Agent</p>
                  <p className="text-sm text-muted-foreground">
                    {ticket?.agent_name || ticket?.agent_email || "Unassigned"}
                  </p>
                </div>
                {ticket?.ticket_url && (
                  <div>
                    <p className="text-sm font-medium">Ticket URL</p>
                    <a
                      href={ticket.ticket_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline"
                    >
                      View ticket
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right – live external details */}
          <div className="flex flex-col h-full overflow-hidden gap-2">
            <h3 className="text-lg font-semibold">External Details</h3>
            <ExternalTicketCard
              externalDetails={FetchTicketDetailsData?.external_details || null}
              loading={FetchTicketDetailsIsLoading}
            />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
