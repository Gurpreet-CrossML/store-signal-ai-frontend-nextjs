import {
    IconArrowUpRight,
    IconCircleCheck,
    IconCircleX,
    IconClock,
    IconCreditCard,
    IconPackage,
    IconReceipt,
    IconRotateClockwise,
    IconShoppingBag,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import type { OrderDetail } from "@/redux/api-slice/thread-slice";

/** Numeric value of a pre-formatted amount string like "Rs.499.00" or "$12.50". */
function toNumber(value?: string | null): number {
    if (!value) return NaN;
    return parseFloat(String(value).replace(/[^0-9.-]/g, ""));
}

/** Leading currency symbol of a pre-formatted amount (e.g. "Rs.", "$", "₹"). */
function currencySymbol(value?: string | null): string {
    if (!value) return "";
    return String(value).match(/^[^\d.-]+/)?.[0]?.trim() ?? "";
}

function hasAmount(value?: string | null): boolean {
    return !Number.isNaN(toNumber(value));
}

function statusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
    const value = status.toLowerCase();
    if (value === "paid") return "default";
    if (value === "pending") return "secondary";
    if (value === "refunded" || value === "voided") return "destructive";
    return "outline";
}

export default function OrderBillCard({ order }: { order: OrderDetail }) {
    const {
        order_id,
        order_url,
        financial_status,
        payment_gateways,
        subtotal,
        tax,
        total,
        discount,
        is_cancelable,
        is_returnable,
        items = [],
    } = order;

    const payment = payment_gateways?.length ? payment_gateways.join(", ") : null;

    return (
        <div className="w-full max-w-sm overflow-hidden border border-border/60 bg-background text-sm shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-border/50 bg-muted/30 px-4 py-3">
                <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center bg-primary/10 text-primary">
                        <IconReceipt className="size-3.5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                            Order
                        </span>
                        <span className="text-sm font-bold leading-tight text-foreground">
                            #{order_id}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {financial_status && (
                        <Badge variant={statusBadgeVariant(financial_status)} className="capitalize">
                            {financial_status.toLowerCase() === "paid" ? (
                                <IconCircleCheck />
                            ) : (
                                <IconClock />
                            )}
                            {financial_status}
                        </Badge>
                    )}
                    {order_url && (
                        <a
                            href={order_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground transition-colors hover:text-foreground"
                            aria-label="Open order"
                        >
                            <IconArrowUpRight className="size-4" />
                        </a>
                    )}
                </div>
            </div>

            {items.length > 0 && (
                <div className="px-4 pt-3 pb-2">
                    <div className="mb-2 flex items-center gap-1.5">
                        <IconShoppingBag className="size-3.5 text-muted-foreground" />
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                            Items
                        </span>
                    </div>
                    <div className="flex flex-col">
                        {items.map((item) => {
                            const unit = toNumber(item.price);
                            const lineTotal = Number.isNaN(unit)
                                ? "—"
                                : `${currencySymbol(item.price)}${(unit * item.quantity).toFixed(2)}`;
                            return (
                                <div
                                    key={item.line_item_id}
                                    className="flex items-start justify-between gap-3 border-b border-border/30 py-2 last:border-0"
                                >
                                    <div className="flex min-w-0 items-start gap-2">
                                        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center bg-muted/60">
                                            <IconPackage className="size-3.5 text-muted-foreground" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-medium leading-snug text-foreground">
                                                {item.name}
                                            </p>
                                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                                                <span>Qty: {item.quantity}</span>
                                                {hasAmount(item.price) && <span>× {item.price}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="mt-0.5 shrink-0 text-xs font-semibold text-foreground">
                                        {lineTotal}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {payment && (
                <div className="mx-4 mb-3 flex items-center gap-2 border border-border/40 bg-muted/30 px-3 py-2">
                    <IconCreditCard className="size-3.5 shrink-0 text-muted-foreground" />
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            Payment
                        </span>
                        <span className="text-xs font-medium capitalize text-foreground">{payment}</span>
                    </div>
                </div>
            )}

            <div className="mx-4 mb-3 overflow-hidden border border-border/50 bg-muted/10">
                {hasAmount(subtotal) && (
                    <div className="flex items-center justify-between border-b border-border/30 px-3 py-2">
                        <span className="text-xs text-muted-foreground">Subtotal</span>
                        <span className="text-xs font-medium text-foreground">{subtotal}</span>
                    </div>
                )}
                {toNumber(discount) > 0 && (
                    <div className="flex items-center justify-between border-b border-border/30 px-3 py-2">
                        <span className="text-xs text-muted-foreground">Discount</span>
                        <span className="text-xs font-medium text-foreground">−{discount}</span>
                    </div>
                )}
                {hasAmount(tax) && (
                    <div className="flex items-center justify-between border-b border-border/30 px-3 py-2">
                        <span className="text-xs text-muted-foreground">Tax</span>
                        <span className="text-xs font-medium text-foreground">{tax}</span>
                    </div>
                )}
                {hasAmount(total) && (
                    <div className="flex items-center justify-between bg-primary/5 px-3 py-2.5">
                        <span className="text-xs font-bold text-foreground">Total</span>
                        <span className="text-sm font-bold text-primary">{total}</span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 px-4 pb-3">
                <Badge variant={is_cancelable ? "secondary" : "outline"} className="text-muted-foreground">
                    <IconCircleX />
                    {is_cancelable ? "Cancellable" : "Not Cancellable"}
                </Badge>
                <Badge variant={is_returnable ? "secondary" : "outline"} className="text-muted-foreground">
                    <IconRotateClockwise />
                    {is_returnable ? "Returnable" : "Not Returnable"}
                </Badge>
            </div>
        </div>
    );
}
