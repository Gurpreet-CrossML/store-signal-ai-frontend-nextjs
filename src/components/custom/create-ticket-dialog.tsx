"use client";

import { useState } from "react";
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

export function CreateTicketDialog({
  threadId,
  customerEmail: threadCustomerEmail = "",
}: {
  threadId: string;
  customerEmail?: string;
}) {
  const [open, setOpen] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [generateDescription, setGenerateDescription] = useState(false);
  const hasThreadCustomerEmail = Boolean(threadCustomerEmail);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <IconTicket className="size-4" />
          Create Ticket
        </Button>
      </DialogTrigger>
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
              value={hasThreadCustomerEmail ? threadCustomerEmail : customerEmail}
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
              Generate description using AI
            </Label>
            <Switch
              id="generate-description"
              checked={generateDescription}
              onCheckedChange={setGenerateDescription}
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!subject.trim()}>
              Create Ticket
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
