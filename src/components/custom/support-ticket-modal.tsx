"use client";

import { useEffect, useState } from "react";
import { IconTicket } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  open,
  onOpenChange,
  onTicketCreated,
  showTrigger = true,
}: {
  threadId: string;
  storeCode: string;
  customerEmail?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onTicketCreated?: (ticket: unknown) => void;
  showTrigger?: boolean;
}) {
  const dispatch = useAppDispatch();
  const { GenerateTicketContentIsLoading } = useAppSelector(
    (state) => state.GetThreadReducer.GenerateTicketContentState,
  );
  const { CreateSupportTicketIsLoading } = useAppSelector(
    (state) => state.GetThreadReducer.CreateSupportTicketState,
  );
  const [internalOpen, setInternalOpen] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [generateDescription, setGenerateDescription] = useState(false);
  const dialogOpen = open ?? internalOpen;
  const setDialogOpen = onOpenChange ?? setInternalOpen;
  const hasThreadCustomerEmail = Boolean(threadCustomerEmail);
  const ticketCustomerEmail = hasThreadCustomerEmail
    ? threadCustomerEmail
    : customerEmail;

  const resetForm = () => {
    setCustomerEmail("");
    setSubject("");
    setDescription("");
    setGenerateDescription(false);
  };

  useEffect(() => {
    setCustomerEmail("");
    setSubject("");
    setDescription("");
    setGenerateDescription(false);
  }, [threadId]);

  const handleDialogOpenChange = (nextOpen: boolean) => {
    setDialogOpen(nextOpen);
    if (!nextOpen) {
      resetForm();
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!threadId || !storeCode) return;
    const payload = {
      thread: threadId,
      customer_email: ticketCustomerEmail,
      subject,
      description,
    };
    try {
      const ticket = await dispatch(
        CreateSupportTicket({
          store_code: storeCode,
          payload,
        }),
      ).unwrap();
      onTicketCreated?.(ticket);
      setDialogOpen(false);
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
    <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
      {showTrigger ? (
        <DialogTrigger asChild>
          <Button size="sm">
            <IconTicket className="size-4" />
            Create Ticket
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
            <DialogDescription>
              Add the details needed to create a ticket for this thread.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="ticket-thread-id">Thread ID</Label>
            <Input id="ticket-thread-id" value={threadId} disabled />
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
              disabled={GenerateTicketContentIsLoading}
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
