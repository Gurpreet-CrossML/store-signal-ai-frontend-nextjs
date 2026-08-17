"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IconSparkles } from "@tabler/icons-react";
import {
  CreateSocialSupportTicket,
  CreateSupportTicket,
  GenerateSocialTicketContent,
  GenerateTicketContent,
} from "@/redux/api-slice/thread-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

type CreatedTicket = {
  id?: string | number;
};

export function CreateTicketDialog({
  threadId,
  storeCode,
  customerEmail: threadCustomerEmail = "",
  channel = "web",
  socialUserId = "",
  sourceLabel = "Thread ID",
  open,
  onOpenChange,
  onTicketCreated,
}: {
  threadId?: string;
  storeCode: string;
  customerEmail?: string;
  channel?: string;
  socialUserId?: string;
  sourceLabel?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTicketCreated?: (ticket: CreatedTicket) => void;
}) {
  const dispatch = useAppDispatch();
  const { GenerateTicketContentIsLoading } = useAppSelector(
    (state) => state.GetThreadReducer.GenerateTicketContentState,
  );
  const { GenerateSocialTicketContentIsLoading } = useAppSelector(
    (state) => state.GetThreadReducer.GenerateSocialTicketContentState,
  );
  const { CreateSupportTicketIsLoading } = useAppSelector(
    (state) => state.GetThreadReducer.CreateSupportTicketState,
  );
  const { CreateSocialSupportTicketIsLoading } = useAppSelector(
    (state) => state.GetThreadReducer.CreateSocialSupportTicketState,
  );
  const [customerEmail, setCustomerEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const hasThreadCustomerEmail = Boolean(threadCustomerEmail);
  const ticketCustomerEmail = hasThreadCustomerEmail
    ? threadCustomerEmail
    : customerEmail;
  const sourceId = threadId || socialUserId;
  const isSocialTicket = channel === "facebook" || channel === "instagram";
  const generateLoading =
    GenerateTicketContentIsLoading || GenerateSocialTicketContentIsLoading;
  const createLoading =
    CreateSupportTicketIsLoading || CreateSocialSupportTicketIsLoading;

  const resetForm = () => {
    setCustomerEmail("");
    setSubject("");
    setDescription("");
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      resetForm();
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sourceId || !storeCode) return;
    if (!isSocialTicket && !threadId) return;
    const payload: CreateSupportTicket = {
      customer_email: ticketCustomerEmail,
      subject,
      description,
    };
    try {
      const ticket =
        isSocialTicket && socialUserId
          ? await dispatch(
              CreateSocialSupportTicket({
                store_code: storeCode,
                social_user_id: socialUserId,
                payload: {
                  channel,
                  customer_email: ticketCustomerEmail,
                  subject,
                  description,
                },
              }),
            ).unwrap()
          : await dispatch(
              CreateSupportTicket({
                store_code: storeCode,
                thread_id: threadId || "",
                payload,
              }),
            ).unwrap();
      onTicketCreated?.(ticket);
      onOpenChange(false);
      resetForm();
    } catch {
      // Error toast is handled in the thunk.
    }
  };

  const handleGenerateDescription = async () => {
    if (!sourceId || !storeCode) return;

    try {
      const data =
        isSocialTicket && socialUserId
          ? await dispatch(
              GenerateSocialTicketContent({
                social_user_id: socialUserId,
                store_code: storeCode,
              }),
            ).unwrap()
          : await dispatch(
              GenerateTicketContent({
                thread_id: threadId,
                store_code: storeCode,
              }),
            ).unwrap();
      setSubject(data.subject || "");
      setDescription(data.description || "");
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
            <DialogDescription>
              Add the details needed to create a ticket for this conversation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="ticket-source-id">{sourceLabel}</Label>
            <Input id="ticket-source-id" value={sourceId} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket-customer-email">Customer Email</Label>
            <Input
              id="ticket-customer-email"
              type="email"
              value={ticketCustomerEmail}
              onChange={(event) => setCustomerEmail(event.target.value)}
              disabled={hasThreadCustomerEmail}
              placeholder="customer@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket-subject">Subject</Label>
            <Input
              id="ticket-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Enter ticket subject"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket-description">Description</Label>
            <Textarea
              id="ticket-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the issue"
              rows={4}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium">Generate description</p>
              <p className="text-sm text-muted-foreground">
                Let AI help you draft a clear and accurate description based on
                this conversation.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="shrink-0 border-primary/50 text-primary hover:bg-primary/10 hover:text-primary"
              onClick={handleGenerateDescription}
              disabled={generateLoading || !sourceId}
            >
              <IconSparkles className="size-4" />
              {generateLoading ? "Generating..." : "Generate"}
            </Button>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={createLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={
                createLoading ||
                generateLoading ||
                !ticketCustomerEmail.trim() ||
                !subject.trim() ||
                !description.trim()
              }
            >
              {createLoading ? "Creating..." : "Create Ticket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
