"use client";

import { useState } from "react";
import { IconDownload, IconReceipt } from "@tabler/icons-react";
import { toast } from "sonner";

import {
  PAYMENT_STATUS,
  formatDate,
  formatMoney,
  paymentLabel,
} from "@/components/custom/billing/billing-format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Typography } from "@/components/ui/typography";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import {
  fetchPaymentInvoice,
  type BillingPayment,
} from "@/redux/api-slice/billing-slice";
import { useAppDispatch } from "@/redux/hooks";

/** The latest payments, newest first, each paid one with its invoice. */
export default function PaymentHistory({
  payments,
}: {
  payments: BillingPayment[];
}) {
  const dispatch = useAppDispatch();
  // The payment whose invoice is being fetched, so only its button spins.
  const [loadingId, setLoadingId] = useState<number | null>(null);

  /** Get the invoice link (the backend builds the PDF once) and download it. */
  const downloadInvoice = async (payment: BillingPayment) => {
    setLoadingId(payment.id);
    try {
      const invoice = await dispatch(fetchPaymentInvoice(payment.id)).unwrap();
      // S3 sends the file as an attachment, so this saves it, not navigates.
      const link = document.createElement("a");
      link.href = invoice.url;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error("Couldn't download the invoice.", {
        description: typeof error === "string" ? error : undefined,
      });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment history</CardTitle>
        <CardDescription>
          Your latest payments. Download an invoice for any paid one.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {payments.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>For</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">
                  Payment ID
                </TableHead>
                <TableHead className="text-right">Invoice</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => {
                const status = PAYMENT_STATUS[payment.status];
                return (
                  <TableRow key={payment.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(payment.created_at)}
                    </TableCell>
                    <TableCell>{paymentLabel(payment)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(payment.amount, payment.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={BADGE_TONE_STYLES[status.tone]}
                        title={payment.error_message || undefined}
                      >
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">
                      {payment.razorpay_payment_id ?? "–"}
                    </TableCell>
                    <TableCell className="text-right">
                      {payment.status === "paid" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={loadingId !== null}
                          title={payment.invoice_number ?? undefined}
                          onClick={() => downloadInvoice(payment)}
                        >
                          {loadingId === payment.id ? (
                            <Spinner className="size-4" />
                          ) : (
                            <IconDownload className="size-4" />
                          )}
                          Download
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">–</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <IconReceipt className="size-8 text-muted-foreground/60" />
            <Typography variant="muted">No payments yet.</Typography>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
