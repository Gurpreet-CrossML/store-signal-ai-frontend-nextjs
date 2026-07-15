"use client";

import {
  IconBrain,
  IconCheck,
  IconClock,
  IconHelpCircle,
  IconMessageCircle,
  IconShieldCheck,
  IconUserCircle,
  IconWaveSine,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TestConversationPanel } from "@/components/custom/test-conversation-panel";
import { cn } from "@/lib/utils";

const explainabilityItems = [
  {
    label: "Detected Intent",
    value: "Greeting",
    icon: IconMessageCircle,
    className: "bg-primary/10 text-primary",
  },
  {
    label: "Confidence Score",
    value: "98%",
    icon: IconShieldCheck,
    className: "bg-blue-50 text-blue-600",
    meter: true,
  },
  {
    label: "Matched Knowledge",
    value: "Welcome Message",
    icon: IconBrain,
    className: "bg-emerald-50 text-emerald-600",
  },
  {
    label: "Persona Used",
    value: "Friendly Assistant",
    icon: IconUserCircle,
    className: "bg-primary/10 text-primary",
  },
  {
    label: "Tone Used",
    value: "Warm",
    icon: IconWaveSine,
    className: "bg-orange-50 text-orange-500",
  },
  {
    label: "Model",
    value: "GPT-4o-mini",
    icon: IconBrain,
    className: "bg-sky-50 text-sky-600",
  },
];

const responseReasons = [
  "User started a new conversation",
  "Used greeting template from knowledge base",
  "Applied friendly & warm tone",
  "Added quick replies for better UX",
];

function ExplainabilityItem({
  item,
}: {
  item: (typeof explainabilityItems)[number];
}) {
  const Icon = item.icon;

  return (
    <div className="flex min-h-16 items-center justify-between gap-3 rounded-md border bg-background px-3 py-2.5 shadow-xs">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-md",
            item.className,
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{item.label}</p>
          <p className="truncate text-sm text-muted-foreground">{item.value}</p>
        </div>
      </div>
      {item.meter ? (
        <span className="size-5 rounded-full border-2 border-primary border-l-transparent" />
      ) : null}
    </div>
  );
}

export default function TestSimulate() {
  return (
    <div className="flex h-full min-h-[calc(100vh-var(--header-height)-3rem)] flex-col gap-6 px-4 lg:px-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <Tabs defaultValue="conversation" className="w-full xl:w-auto">
          <TabsList
            variant="line"
            className="h-10 w-full justify-start gap-8 border-b px-0 xl:w-[360px]"
          >
            <TabsTrigger
              value="conversation"
              className="px-5 data-active:text-primary data-active:after:bg-primary"
            >
              Test Conversation
            </TabsTrigger>
            <TabsTrigger value="replay" className="px-5">
              Historical Replay
            </TabsTrigger>
          </TabsList>
          <TabsContent value="conversation" className="hidden" />
          <TabsContent value="replay" className="hidden" />
        </Tabs>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:justify-end">
          <Button className="h-10 gap-2">
            <IconMessageCircle className="size-4" />
            New Conversation
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <TestConversationPanel />
        <Card className="min-h-[620px] gap-4 py-5">
          <CardHeader className="flex flex-row items-center justify-between px-5">
            <CardTitle className="text-lg font-semibold">
              Explainability
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-primary hover:text-primary"
            >
              <IconHelpCircle className="size-4" />
              Why this response?
            </Button>
          </CardHeader>

          <CardContent className="space-y-3 px-5">
            {explainabilityItems.map((item) => (
              <ExplainabilityItem key={item.label} item={item} />
            ))}

            <div className="rounded-md bg-primary/5 px-4 py-3">
              <p className="mb-3 text-sm font-semibold">Response Reasoning</p>
              <div className="space-y-3">
                {responseReasons.map((reason) => (
                  <div key={reason} className="flex items-center gap-3 text-sm">
                    <IconCheck className="size-4 shrink-0 text-primary" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex min-h-12 items-center justify-between rounded-md border bg-background px-3 py-2 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-full text-primary">
                  <IconClock className="size-5" />
                </span>
                <span className="text-sm font-semibold">Latency</span>
              </div>
              <span className="text-sm font-semibold">1.23s</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
