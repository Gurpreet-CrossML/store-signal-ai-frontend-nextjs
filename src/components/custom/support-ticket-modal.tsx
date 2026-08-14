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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  CreateSupportTicket,
  GenerateTicketContent,
} from "@/redux/api-slice/thread-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

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
  onTicketCreated?: (ticket: unknown) => void;
}) {
  const dispatch = useAppDispatch();
  const { GenerateTicketContentIsLoading } = useAppSelector(
    (state) => state.GetThreadReducer.GenerateTicketContentState,
  );
  const { CreateSupportTicketIsLoading } = useAppSelector(
    (state) => state.GetThreadReducer.CreateSupportTicketState,
  );
  const [customerEmail, setCustomerEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [generateDescription, setGenerateDescription] = useState(false);
  const hasThreadCustomerEmail = Boolean(threadCustomerEmail);
  const ticketCustomerEmail = hasThreadCustomerEmail
    ? threadCustomerEmail
    : customerEmail;
  const sourceId = threadId || socialUserId;

  const resetForm = () => {
    setCustomerEmail("");
    setSubject("");
    setDescription("");
    setGenerateDescription(false);
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
    const payload: CreateSupportTicket = {
      channel,
      customer_email: ticketCustomerEmail,
      subject,
      description,
    };
    if (threadId) {
      payload.thread_id = threadId;
    }
    if (socialUserId) {
      payload.social_user_id = socialUserId;
    }
    try {
      const ticket = await dispatch(
        CreateSupportTicket({
          store_code: storeCode,
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

  const handleGenerateDescription = async (checked: boolean) => {
    setGenerateDescription(checked);
    if (!checked || !threadId || !storeCode) return;

    try {
      const data = await dispatch(
        GenerateTicketContent({ thread_id: threadId, store_code: storeCode }),
      ).unwrap();
      setSubject(data.subject || "");
      setDescription(data.description || "");
    } catch {
      setGenerateDescription(false);
    }
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

          <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
            <Label htmlFor="generate-description" className="text-sm">
              {GenerateTicketContentIsLoading
                ? "Generating description..."
                : "Generate description using AI"}
            </Label>
            <Switch
              id="generate-description"
              checked={generateDescription}
              onCheckedChange={handleGenerateDescription}
              disabled={GenerateTicketContentIsLoading || !threadId}
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={
                CreateSupportTicketIsLoading ||
                GenerateTicketContentIsLoading ||
                !ticketCustomerEmail.trim() ||
                !subject.trim() ||
                !description.trim()
              }
            >
              {CreateSupportTicketIsLoading ? "Creating..." : "Create Ticket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
