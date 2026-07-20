import { formatPrice, useTestChatbotContext } from "@/clients/test-simulate";
import {
  SaveBotEvent,
  type ThreadJsonContent,
  type TicketDetails,
} from "@/redux/api-slice/thread-slice";
import { useAppDispatch } from "@/redux/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, User } from "lucide-react";
import { ProductCarousel } from "../ProductCarousel";

function toTitleCase(value?: string | null) {
  if (!value) return "";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatMoney(value: unknown, currency?: string) {
  if (typeof value === "number") return formatPrice(value, currency);
  if (typeof value === "string" && value.trim()) return value;
  return "";
}

function formatOrderDate(value: unknown) {
  if (typeof value !== "string" || !value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function MessageAttachments({ json }: { json?: ThreadJsonContent }) {
  const dispatch = useAppDispatch();
  const { session } = useTestChatbotContext();
  const threadId = session?.session_id ?? "";

  if (!json) return null;

  const { products, related_products, order_details, cart_details } = json;

  if (json.ticket_details) {
    const ticket: TicketDetails = json.ticket_details;

    return (
      <Card className="max-w-sm gap-3 border border-border bg-background py-4 shadow-xs">
        <CardHeader className="px-4">
          <CardTitle className="text-sm">
            Ticket TCK-{ticket.ticket_id}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-4 text-sm">
          {(ticket.customer_email || ticket.customer_name) && (
            <div className="flex items-center gap-3 rounded-md bg-muted/40 p-3">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="size-4" />
              </span>
              <div className="min-w-0">
                {ticket.customer_email ? (
                  <p className="truncate font-medium">
                    {ticket.customer_email}
                  </p>
                ) : null}
                {ticket.customer_name ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {ticket.customer_name}
                  </p>
                ) : null}
              </div>
            </div>
          )}
          {ticket.description ? (
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                User Query
              </p>
              <p className="mt-1">{ticket.description}</p>
            </div>
          ) : null}
          <p className="border-t pt-3 text-xs text-muted-foreground">
            Created {formatOrderDate(ticket.created_at)}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (
    (products && products.length > 0) ||
    (related_products && related_products.length > 0)
  ) {
    return (
      <div className="space-y-3">
        {products && products.length > 0 ? (
          <ProductCarousel
            products={products}
            showDescription={false}
            addCart={true}
          />
        ) : null}
        {related_products && related_products.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">
              Related Products
            </p>
            <ProductCarousel
              products={related_products}
              showDescription={false}
              addCart={true}
            />
          </div>
        ) : null}
      </div>
    );
  }

  if (order_details) {
    const order = order_details;
    const orderId = order.order_id ?? order.orderId;
    const placedAt = formatOrderDate(order.created_at ?? order.placedAt);
    const financialStatus = toTitleCase(order.financial_status ?? order.status);
    const fulfillmentStatus =
      toTitleCase(order.fulfillment_status) || "Processing";
    const items = Array.isArray(order.items) ? order.items : [];
    const totalQuantity = items.reduce(
      (sum, item) => sum + (Number(item.quantity ?? item.quantity) || 0),
      0,
    );
    const subtotal = formatMoney(order.subtotal, order.currency);
    const discount = formatMoney(order.discount, order.currency);
    const tax = formatMoney(order.tax, order.currency);
    const total = formatMoney(order.total, order.currency);

    return (
      <Card className="max-w-sm gap-3 py-4">
        <CardHeader className="px-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-sm">
                Order #{String(orderId)}
              </CardTitle>
              {placedAt ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Placed {placedAt}
                </p>
              ) : null}
            </div>
            {financialStatus ? <Badge>{financialStatus}</Badge> : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 px-4 text-sm">
          <div className="flex justify-between rounded-md bg-muted/40 px-3 py-2">
            <span className="text-muted-foreground">Fulfillment</span>
            <strong>{fulfillmentStatus}</strong>
          </div>

          <div className="space-y-2">
            {items.map((item, index) => {
              const quantity = Number(item.quantity) || 0;
              const itemPrice = formatMoney(item.price, order.currency);
              return (
                <div
                  key={String(
                    item.line_item_id ??
                      item.variant_id ??
                      item.product_id ??
                      index,
                  )}
                  className="flex justify-between gap-3 border-b pb-2 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Qty {quantity}
                    </p>
                  </div>
                  {itemPrice ? <span>{itemPrice}</span> : null}
                </div>
              );
            })}
          </div>

          <div className="space-y-1 border-t pt-3">
            {totalQuantity > 0 ? (
              <div className="flex justify-between">
                <span>Items</span>
                <span>{totalQuantity}</span>
              </div>
            ) : null}
            {subtotal ? (
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{subtotal}</span>
              </div>
            ) : null}
            {discount && discount !== "$0.00" ? (
              <div className="flex justify-between">
                <span>Discount</span>
                <span>{discount}</span>
              </div>
            ) : null}
            {tax ? (
              <div className="flex justify-between">
                <span>Tax</span>
                <span>{tax}</span>
              </div>
            ) : null}
            {total ? (
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{total}</span>
              </div>
            ) : null}
          </div>

          {typeof order.order_url === "string" && order.order_url ? (
            <Button asChild className="w-full">
              <a
                href={order.order_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                View order
              </a>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  if (cart_details) {
    const totalQuantity =
      cart_details.items?.reduce(
        (sum, item) => sum + (item.quantity || 0),
        0,
      ) ?? 0;
    const formattedSubTotal =
      typeof cart_details.sub_total === "number"
        ? formatPrice(cart_details.sub_total)
        : String(cart_details.sub_total);

    return (
      <Card className="max-w-sm gap-3 py-4">
        <CardHeader className="px-4">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ShoppingCart className="size-4" />
              Your Cart
            </CardTitle>
            <Badge variant="secondary">
              {totalQuantity} item{totalQuantity === 1 ? "" : "s"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 px-4">
          {cart_details.items?.map((item, index) => {
            const itemPrice =
              typeof item.price === "number"
                ? formatPrice(item.price)
                : String(item.price);
            return (
              <div
                key={`${item.product_id}-${item.name}-${index}`}
                className="flex items-center gap-3 rounded-md border p-2"
              >
                <img
                  className="size-12 rounded-md bg-muted object-cover"
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {itemPrice} · Quantity {item.quantity}
                  </p>
                </div>
              </div>
            );
          })}

          <div className="flex justify-between border-t pt-3 text-sm font-semibold">
            <span>Grand Total</span>
            <span>{formattedSubTotal}</span>
          </div>

          {cart_details.checkout_url ? (
            <Button asChild className="w-full">
              <a
                href={cart_details.checkout_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  void dispatch(
                    SaveBotEvent({
                      event_type: "checkout_link",
                      thread_id: threadId,
                    }),
                  )
                }
              >
                Checkout
              </a>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return null;
}
