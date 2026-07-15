"use client";

import {
  IconAlertTriangle,
  IconBrain,
  IconCheck,
  IconClock,
  IconHelpCircle,
  IconInfoCircle,
  IconLock,
  IconMaximize,
  IconMessageCircle,
  IconMicrophone,
  IconMoodSmile,
  IconPaperclip,
  IconRobot,
  IconSend,
  IconShieldCheck,
  IconSpeakerphone,
  IconUserCircle,
  IconWaveSine,
  IconX,
} from "@tabler/icons-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const quickReplies = [
  "Which products you sell?",
  "Can you check my order status?",
  "What's in my cart?",
];

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

function BotAvatar() {
  return (
    <div className="relative mt-1 flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
      <IconRobot className="size-7" />
      <span className="absolute -right-0.5 bottom-1 size-3 rounded-full border-2 border-background bg-emerald-500" />
    </div>
  );
}

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
        <Card className="min-h-[620px] gap-0 overflow-hidden py-0">
          <CardHeader className="flex min-h-14 flex-row items-center justify-between border-b-2 px-5">
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg font-semibold">
                StoreSignal AI
              </CardTitle>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                Active
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Button variant="ghost" size="icon-sm" aria-label="Toggle sound">
                <IconSpeakerphone className="size-5" />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Expand chat">
                <IconMaximize className="size-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex min-h-[540px] flex-1 flex-col px-5 py-5">
            <div className="flex gap-4">
              <div className="min-w-0">
                <div className="w-fit max-w-full rounded-md border bg-muted/50 px-5 py-4 text-sm font-medium shadow-xs">
                  Hi there! How can I help you today?
                </div>
                <p className="mt-3 text-sm text-muted-foreground">6:56 PM</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 pl-0 md:pl-0">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  className="h-9 rounded-full border border-primary px-5 text-sm font-medium text-primary transition hover:bg-primary/5"
                  type="button"
                >
                  {reply}
                </button>
              ))}
            </div>

            <div className="mt-auto pt-8">
              <div className="rounded-md border bg-background px-4 py-3 shadow-xs">
                <textarea
                  className="min-h-9 w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  placeholder="Message..."
                  rows={1}
                />
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Button variant="ghost" size="icon-sm" aria-label="Emoji">
                      <IconMoodSmile className="size-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Attach file"
                    >
                      <IconPaperclip className="size-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Voice input"
                    >
                      <IconMicrophone className="size-5" />
                    </Button>
                  </div>
                  <Button size="icon-lg" className="rounded-full">
                    <IconSend className="size-5" />
                  </Button>
                </div>
              </div>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                This AI-Chatbot can make mistakes.{" "}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="font-semibold text-foreground underline">
                      Learn more
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-[500px] gap-0 rounded-xl p-6 shadow-2xl lg:max-w-[500px]">
                    <div className="mb-4 flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <IconInfoCircle className="size-5" />
                      </span>
                      <AlertDialogTitle className="text-left text-lg font-semibold">
                        About this AI Chatbot
                      </AlertDialogTitle>
                      <AlertDialogCancel
                        variant="ghost"
                        size="icon-sm"
                        className="ml-auto rounded-full bg-muted text-muted-foreground hover:bg-muted/80"
                      >
                        <IconX className="size-5" />
                      </AlertDialogCancel>
                    </div>

                    <AlertDialogDescription asChild>
                      <div className="space-y-3 text-left text-sm leading-6 text-foreground">
                        <p>
                          This chatbot is powered by artificial intelligence and
                          is designed to assist you with product discovery, and
                          general support.
                        </p>

                        <div className="rounded-md bg-muted p-3">
                          <div className="mb-2 flex items-center gap-1.5 font-semibold">
                            <IconAlertTriangle className="size-4" />
                            <span>Please keep in mind:</span>
                          </div>
                          <div className="space-y-2">
                            <p>
                              AI responses may occasionally be inaccurate or
                              incomplete.
                            </p>
                            <p>
                              Always verify important details like pricing,
                              availability.
                            </p>
                            <p>
                              For critical issues, please contact our human
                              support team.
                            </p>
                          </div>
                        </div>

                        <div className="rounded-md bg-muted p-3">
                          <div className="mb-2 flex items-center gap-1.5 font-semibold">
                            <IconLock className="size-4" />
                            <span>Your privacy matters:</span>
                          </div>
                          <div className="space-y-2">
                            <p>
                              Conversations may be used to improve our service.
                            </p>
                            <p>
                              We do not share your personal data with third
                              parties.
                            </p>
                          </div>
                        </div>
                      </div>
                    </AlertDialogDescription>

                    <AlertDialogAction className="mt-3 h-9 w-full">
                      Got it
                    </AlertDialogAction>
                  </AlertDialogContent>
                </AlertDialog>
              </p>
            </div>
          </CardContent>
        </Card>

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
