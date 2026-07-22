"use client";

import { useEffect, useRef, useState } from "react";
import { getSession } from "next-auth/react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  IconCircleCheck,
  IconAlertTriangle,
  IconInfoCircle,
  IconArrowRight,
} from "@tabler/icons-react";
import { createAPIUrl, ENDPOINTS } from "@/lib/config";

type ShopifyCheck = { api: string; status_code: number; message: string };
type Phase = "loading" | "streaming" | "done" | "error";

function CheckRow({ check }: { check: ShopifyCheck }) {
  const ok = check.status_code === 200;
  const info = check.status_code === 204;
  const Icon = ok ? IconCircleCheck : info ? IconInfoCircle : IconAlertTriangle;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex items-center justify-between gap-3 border-t py-3 first:border-t-0"
    >
      <div className="flex items-center gap-3">
        <Icon
          className={cn(
            "size-5 shrink-0",
            ok
              ? "text-emerald-600"
              : info
                ? "text-muted-foreground"
                : "text-amber-600",
          )}
        />
        <span className="font-medium">{check.api}</span>
      </div>
      <span className="text-sm text-muted-foreground">
        {ok ? "Verified" : check.message}
      </span>
    </motion.div>
  );
}

export function StepAiReady({ onNext }: { onNext: () => void }) {
  const [checks, setChecks] = useState<ShopifyCheck[]>([]);
  const [phase, setPhase] = useState<Phase>("loading");
  const startedRef = useRef(false);

  useEffect(() => {
    // Fetch exactly once. A ref guard (not a cleanup `cancelled` flag) is what
    // survives StrictMode's mount→unmount→mount: the flag approach would let the
    // first invoke's cleanup cancel the only stream, freezing the UI on
    // "Connecting…". setState after a real unmount is a harmless no-op.
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      try {
        const session = await getSession();
        const token = session?.user?.access_token;
        // Stream directly from Django (axios buffers, so it can't stream). The
        // endpoint replies with NDJSON — one probe result per line.
        const res = await fetch(
          createAPIUrl(ENDPOINTS.shopifyVerify(), "django"),
          { headers: token ? { Authorization: `Bearer ${token}` } : {} },
        );
        if (!res.ok || !res.body) {
          setPhase("error");
          return;
        }
        setPhase("streaming");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        const pushLine = (line: string) => {
          const trimmed = line.trim();
          if (!trimmed) return;
          try {
            const check = JSON.parse(trimmed) as ShopifyCheck;
            setChecks((prev) => [...prev, check]);
          } catch {
            /* ignore a partial/garbled line */
          }
        };

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          lines.forEach(pushLine);
        }
        pushLine(buffer);
        setPhase("done");
      } catch {
        setPhase("error");
      }
    })();
  }, []);

  const verified = checks.filter((c) => c.status_code === 200).length;
  const streaming = phase === "loading" || phase === "streaming";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold tracking-widest text-primary uppercase">
          Step 4 of 6
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">
            Your AI is ready. Talk to it.
          </h1>
        </div>
        <p className="max-w-xl text-sm text-muted-foreground">
          We connected to your store and are checking every data surface your AI
          needs — products, policies, orders, discounts, and more.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-1">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">What it learned about your store</p>
              <p className="text-sm text-muted-foreground">
                Verified live, one surface at a time.
              </p>
            </div>
            {phase === "done" && checks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Badge className="shrink-0 border-emerald-200 bg-emerald-50 text-emerald-600">
                  {verified}/{checks.length} verified
                </Badge>
              </motion.div>
            )}
          </div>

          {phase === "error" && checks.length === 0 ? (
            <div className="py-6 text-sm text-muted-foreground">
              We couldn&apos;t reach your store to verify access just now. You
              can continue — we&apos;ll keep learning in the background.
            </div>
          ) : (
            <>
              <AnimatePresence initial={false}>
                {checks.map((c) => (
                  <CheckRow key={c.api} check={c} />
                ))}
              </AnimatePresence>
              {streaming && (
                <motion.div
                  layout
                  className="flex items-center gap-3 border-t py-3 text-sm text-muted-foreground first:border-t-0"
                >
                  <Spinner className="size-4" />
                  {checks.length === 0
                    ? "Connecting to your store…"
                    : "Checking the next surface…"}
                </motion.div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={onNext}>
          Looks good — let&apos;s set it up <IconArrowRight />
        </Button>
      </div>
    </div>
  );
}
