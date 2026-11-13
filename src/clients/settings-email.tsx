"use client";

import { useEffect, useState } from "react";
import {
  IconAlertTriangle,
  IconCheck,
  IconCircleCheck,
  IconCopy,
  IconExternalLink,
  IconMail,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { LoadingState } from "@/components/custom/loading-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useNow } from "@/hooks/use-now";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  ConnectEmailChannel,
  DisconnectEmailChannel,
  FetchEmailChannel,
  SendEmailChannelTest,
  type EmailChannel,
} from "@/redux/api-slice/email-channel-slice";

const POLL_MS = 3000;
// How long to wait for each email before suggesting what may be wrong.
const CONFIRMATION_WAIT_MS = 3 * 60 * 1000;
const TEST_WAIT_MS = 2 * 60 * 1000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Gmail's steps. A new mailbox provider adds its own list here.
const GMAIL_STEPS = [
  'In Gmail open Settings → See all settings → "Forwarding and POP/IMAP".',
  'Click "Add a forwarding address", paste the address above, then Next → Proceed → OK.',
  "Google emails a confirmation to that address. It appears on this page within a minute.",
  'Confirm it in Gmail, then select "Forward a copy of incoming mail to" the new address and Save Changes.',
  "Come back here and send the test email.",
];

/** The server's message for the email field, whatever shape it came in. */
function connectMessage(error: unknown): string | null {
  const data = (error as { data?: Record<string, unknown> } | null)?.data;
  return typeof data?.email === "string" ? data.email : null;
}

function ForwardingAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Select the address and copy it by hand.");
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between">
      <code className="text-sm font-medium break-all">{address}</code>
      <Button type="button" variant="outline" size="sm" onClick={copy}>
        {copied ? <IconCheck /> : <IconCopy />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
      <IconAlertTriangle className="mt-0.5 size-4 shrink-0" />
      <p>{children}</p>
    </div>
  );
}

/** Step 1: the merchant names the mailbox customers write to. */
function ConnectForm({ storeCode }: { storeCode: string }) {
  const dispatch = useAppDispatch();
  const { isSaving, connectError } = useAppSelector(
    (state) => state.GetEmailChannelReducer,
  );
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);

  const value = email.trim();
  const error =
    touched && !EMAIL_PATTERN.test(value)
      ? "Enter a valid email address."
      : touched
        ? connectMessage(connectError)
        : null;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (EMAIL_PATTERN.test(value)) {
      dispatch(ConnectEmailChannel({ storeCode, email: value }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconMail className="size-5" /> Connect your support mailbox
        </CardTitle>
        <CardDescription>
          Enter the address customers write to. We&apos;ll give you an address
          to forward it to — no DNS changes needed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-3" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="support-email">Support email address</Label>
            <Input
              id="support-email"
              type="email"
              placeholder="support@yourstore.com"
              value={email}
              aria-invalid={Boolean(error)}
              onChange={(event) => setEmail(event.target.value)}
              onBlur={() => setTouched(true)}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Spinner />}
            Continue
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/** Steps 2-4: forward the mailbox, confirm it, then prove it with a test. */
function SetupCard({
  channel,
  storeCode,
}: {
  channel: EmailChannel;
  storeCode: string;
}) {
  const dispatch = useAppDispatch();
  const { isSaving } = useAppSelector((state) => state.GetEmailChannelReducer);
  const now = useNow(5000);

  const confirmed = channel.status === "confirmation_received";
  const waitedForConfirmation =
    now - new Date(channel.created_at).getTime() > CONFIRMATION_WAIT_MS;
  const testSentAt = channel.test_sent_at
    ? new Date(channel.test_sent_at).getTime()
    : null;
  const waitingForTest = testSentAt !== null && now - testSentAt < TEST_WAIT_MS;
  const testLost = testSentAt !== null && !waitingForTest;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forward {channel.email} to Store Signal</CardTitle>
        <CardDescription>
          Add this address as a forwarding destination in your mailbox.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ForwardingAddress address={channel.forwarding_address} />

        <ol className="list-decimal space-y-1.5 pl-5 text-sm">
          {GMAIL_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>

        {!confirmed && (
          <>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="size-3.5" /> Waiting for Google&apos;s
              confirmation…
            </p>
            {waitedForConfirmation && (
              <Hint>
                Nothing yet. Check the address was pasted exactly and that you
                clicked Proceed. If it still doesn&apos;t arrive, remove the
                address in Gmail and add it again. A Google Workspace admin may
                also have blocked forwarding to outside addresses.
              </Hint>
            )}
          </>
        )}

        {confirmed && (
          <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
            <p className="text-sm font-medium">Google sent a confirmation</p>
            {channel.confirmation_code && (
              <p className="text-sm">
                Enter this code in Gmail:{" "}
                <span className="font-mono text-lg font-semibold tracking-widest">
                  {channel.confirmation_code}
                </span>
              </p>
            )}
            {channel.confirmation_link && (
              <div className="space-y-1.5">
                <p className="text-sm text-muted-foreground">
                  Open the link below while signed in only as{" "}
                  <strong>{channel.email}</strong>. With several Google accounts
                  open it may show an error.
                </p>
                <Button asChild size="sm">
                  <a
                    href={channel.confirmation_link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <IconExternalLink /> Open confirmation link
                  </a>
                </Button>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Then turn forwarding on in Gmail and send the test email.
            </p>
            <Button
              disabled={isSaving || waitingForTest}
              onClick={() => dispatch(SendEmailChannelTest({ storeCode }))}
            >
              {(isSaving || waitingForTest) && <Spinner />}
              {testSentAt ? "Send another test" : "Send test email"}
            </Button>
            {waitingForTest && (
              <p className="text-sm text-muted-foreground">
                Waiting for the test email to come back…
              </p>
            )}
            {testLost && (
              <Hint>
                The test email didn&apos;t come back. Confirming the address is
                not enough — you must also select &quot;Forward a copy of
                incoming mail to&quot; it and save. Also check the test
                didn&apos;t land in spam, which Gmail doesn&apos;t forward.
              </Hint>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Done: forwarding was proven, so customer emails become tickets. */
function VerifiedCard({ channel }: { channel: EmailChannel }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconCircleCheck className="size-5 text-emerald-600" />
          {channel.email} is connected
        </CardTitle>
        <CardDescription>
          Emails sent to this address become tickets in the helpdesk
          {channel.verified_at
            ? ` (verified ${new Date(channel.verified_at).toLocaleString()}).`
            : "."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ForwardingAddress address={channel.forwarding_address} />
      </CardContent>
    </Card>
  );
}

/**
 * Settings → Email Channel for the selected store.
 *
 * Not connected: ask for the mailbox. Connected but not verified: show the
 * steps and refresh every few seconds until the confirmation and then the
 * test email have arrived. Verified: show the status.
 */
export default function SettingsEmail() {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { channel, isLoaded, isSaving } = useAppSelector(
    (state) => state.GetEmailChannelReducer,
  );
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  useEffect(() => {
    if (storeCode) dispatch(FetchEmailChannel({ storeCode }));
  }, [dispatch, storeCode]);

  const waiting = Boolean(channel) && channel?.status !== "verified";
  useEffect(() => {
    if (!storeCode || !waiting) return;
    const handle = setInterval(() => {
      if (document.visibilityState === "visible") {
        dispatch(FetchEmailChannel({ storeCode, silent: true }));
      }
    }, POLL_MS);
    return () => clearInterval(handle);
  }, [dispatch, storeCode, waiting]);

  if (!storeCode) return <LoadingState label="Select a store first." />;
  if (!isLoaded) return <LoadingState label="Loading email connection…" />;
  if (!channel) return <ConnectForm storeCode={storeCode} />;

  return (
    <div className="space-y-3">
      {channel.status === "verified" ? (
        <VerifiedCard channel={channel} />
      ) : (
        <SetupCard channel={channel} storeCode={storeCode} />
      )}
      <Button
        variant="outline"
        size="sm"
        disabled={isSaving}
        onClick={() => setConfirmDisconnect(true)}
      >
        Disconnect / change email
      </Button>

      <AlertDialog open={confirmDisconnect} onOpenChange={setConfirmDisconnect}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect this mailbox?</AlertDialogTitle>
            <AlertDialogDescription>
              Emails forwarded to the address will no longer become tickets.
              Remember to remove the forwarding rule in your mailbox too.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => dispatch(DisconnectEmailChannel({ storeCode }))}
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
