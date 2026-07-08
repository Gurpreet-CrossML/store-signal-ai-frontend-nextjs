import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDateTime } from "@/lib/helpers";
import type {
  CartDataResponse,
  ThreadTicketData,
  UserMetadata,
} from "@/redux/api-slice/thread-slice";
import {
  IconBrain,
  IconBrowser,
  IconDeviceDesktop,
  IconDeviceLaptop,
  IconLocationPin,
  IconNetwork,
  IconShoppingBag,
  IconTicket,
  IconUser,
} from "@tabler/icons-react";

function CardLoadingState() {
  return (
    <div className="flex items-center justify-center py-6 text-muted-foreground">
      <Spinner className="size-5" />
    </div>
  );
}

export function ThreadSummaryCard({
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

export function ThreadAIInsightCard({
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

export function CartDetailsCard({
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

export function UserMetadataCard({
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
          <div className="flex flex-col gap-3">
            <div className="flex min-w-0 flex-wrap items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-2 text-sm text-muted-foreground">
              <div className="flex min-w-0 items-center gap-2">
                <span className="bg-primary/20 p-1">
                  <IconLocationPin className="size-5 inline text-primary" />
                </span>
                <span className="shrink-0">Location</span>
              </div>
              <span className="ml-auto min-w-0 break-words text-right">
                {userMetadata?.geo_location || "Unknown Location"}
              </span>
            </div>
            <div className="flex min-w-0 flex-wrap items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-2 text-sm text-muted-foreground">
              <div className="flex min-w-0 items-center gap-2">
                <span className="bg-primary/20 p-1">
                  <IconNetwork className="size-5 inline text-primary" />
                </span>
                <span className="shrink-0">IP Address</span>
              </div>
              <span className="ml-auto min-w-0 break-all text-right">
                {userMetadata?.ip_address || "Unknown IP Address"}
              </span>
            </div>
            <div className="flex min-w-0 flex-wrap items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-2 text-sm text-muted-foreground">
              <div className="flex min-w-0 items-center gap-2">
                <span className="bg-primary/20 p-1">
                  <IconDeviceLaptop className="size-5 inline text-primary" />
                </span>
                <span className="shrink-0">Device</span>
              </div>
              <span className="ml-auto min-w-0 break-words text-right">
                {userMetadata?.device_type || "Unknown Device"}
              </span>
            </div>
            <div className="flex min-w-0 flex-wrap items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-2 text-sm text-muted-foreground">
              <div className="flex min-w-0 items-center gap-2">
                <span className="bg-primary/20 p-1">
                  <IconBrowser className="size-5 inline text-primary" />
                </span>
                <span className="shrink-0">Browser</span>
              </div>
              <span className="ml-auto min-w-0 break-words text-right">
                {userMetadata?.browser || "Unknown Browser"}
              </span>
            </div>
            <div className="flex min-w-0 flex-wrap items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-2 text-sm text-muted-foreground">
              <div className="flex min-w-0 items-center gap-2">
                <span className="bg-primary/20 p-1">
                  <IconDeviceDesktop className="size-5 inline text-primary" />
                </span>
                <span className="shrink-0">OS</span>
              </div>
              <span className="ml-auto min-w-0 break-words text-right">
                {userMetadata?.os || "Unknown OS"}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function FreshdeskTicketCard({
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
