"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  IconArrowLeft,
  IconExternalLink,
  IconHeadphones,
  IconHome,
  IconMaximize,
  IconMessage,
  IconMessageCircle,
  IconMicrophone,
  IconMoodSmile,
  IconPaperclip,
  IconSend,
  IconVolume,
  IconX,
} from "@tabler/icons-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isValidUrl, normalizeUrl } from "@/lib/url";
import type { ActionButton, QuickLinkItem } from "@/components/custom/customization-types";

type CustomizationLivePreviewProps = {
  storeLabel: string;
  logoUrl: string | null;
  welcomeMessage: string;
  greetingMessage: string;
  themeColor: string;
  secondaryColor: string;
  themeVars: React.CSSProperties;
  actionButtons: ActionButton[];
  quickLinks: QuickLinkItem[];
};

export default function CustomizationLivePreview({
  storeLabel,
  logoUrl,
  welcomeMessage,
  greetingMessage,
  themeColor,
  secondaryColor,
  themeVars,
  actionButtons,
  quickLinks,
}: CustomizationLivePreviewProps) {
  const [previewTab, setPreviewTab] = useState<"home" | "messages">("home");
  const [inputMessage, setInputMessage] = useState("");

  return (
    <div className="lg:sticky lg:top-6">
      <Card className="overflow-hidden shadow-lg">
        <CardHeader>
          <CardTitle>Live Chatbot Preview</CardTitle>
          <CardDescription>
            Preview for{" "}
            <span className="font-medium text-foreground">{storeLabel}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4" style={themeVars}>
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gray-100 shadow-sm">
              {previewTab === "home" ? (
                <>
                  <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-2">
                    {logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logoUrl}
                        alt="Chatbot logo"
                        className="h-10 w-auto object-contain"
                      />
                    ) : (
                      <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--cb-icon-bg)]">
                        <IconHeadphones className="size-5 text-[var(--cb-primary)]" />
                      </div>
                    )}
                    <IconX className="size-5 text-slate-400" />
                  </div>

                  <div className="max-h-[65vh] h-[60vh]! space-y-4 overflow-y-auto p-4">
                    <p className="px-2 text-sm font-medium text-slate-800">
                      {welcomeMessage}
                    </p>

                    {actionButtons.length > 0 && (
                      <div className="rounded-2xl border border-slate-200 bg-white p-3">
                        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                          <span className="inline-flex size-7 items-center justify-center rounded-md bg-[var(--cb-icon-bg)]">
                            <IconHeadphones className="size-4 text-[var(--cb-primary)]" />
                          </span>
                          Need Help?
                        </p>
                        <div className="space-y-2">
                          {actionButtons.map((button, index) => (
                            <button
                              key={button.id ?? index}
                              type="button"
                              onClick={() => setPreviewTab("messages")}
                              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium transition hover:bg-slate-50"
                            >
                              <span className="flex items-center gap-2">
                                <span className="flex size-7 items-center justify-center rounded-md bg-[var(--cb-icon-bg)] text-[var(--cb-primary)]">
                                  <IconMessageCircle className="size-3.5" />
                                </span>
                                {button.name}
                              </span>
                              <span className="text-slate-400">›</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {quickLinks.length > 0 && (
                      <div className="rounded-2xl border border-slate-200 bg-white">
                        <p className="px-3 pt-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Quick Links
                        </p>
                        <div className="divide-y divide-slate-200">
                          {quickLinks.map((link, index) => (
                            <button
                              key={link.id ?? index}
                              type="button"
                              disabled={!isValidUrl(link.url)}
                              onClick={() => {
                                const normalized = normalizeUrl(link.url);
                                if (isValidUrl(normalized)) {
                                  window.open(
                                    normalized,
                                    "_blank",
                                    "noopener,noreferrer",
                                  );
                                }
                              }}
                              className="flex w-full items-center justify-between px-3 py-3 text-sm font-medium text-slate-700 transition enabled:hover:bg-[var(--cb-hover-bg)] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {link.label}
                              <IconExternalLink className="size-4 text-slate-400" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-white px-3 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewTab("home")}
                        className="inline-flex size-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100"
                      >
                        <IconArrowLeft className="size-4" />
                      </button>
                      <p className="text-sm font-semibold text-slate-900">
                        Your Support Team
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-slate-600">
                      <span className="inline-flex size-9 items-center justify-center rounded-full transition hover:bg-slate-100">
                        <IconVolume className="size-4" />
                      </span>
                      <span className="inline-flex size-9 items-center justify-center rounded-full transition hover:bg-slate-100">
                        <IconMaximize className="size-4" />
                      </span>
                      <span className="inline-flex size-9 items-center justify-center rounded-full transition hover:bg-slate-100">
                        <IconX className="size-4" />
                      </span>
                    </div>
                  </div>

                  <div className="flex max-h-[65vh] h-[60vh]! flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto bg-white p-4">
                      <div
                        className="w-fit max-w-[86%] rounded-2xl px-4 py-2 text-sm text-slate-900"
                        style={{ backgroundColor: secondaryColor }}
                      >
                        <ReactMarkdown>{greetingMessage}</ReactMarkdown>
                      </div>

                      <div className="mt-6 flex justify-end">
                        <div
                          className="w-fit rounded-2xl px-4 py-2 text-sm font-medium text-[var(--cb-header-text)]"
                          style={{ backgroundColor: themeColor }}
                        >
                          Hello Chatbot
                        </div>
                      </div>

                      <div className="mt-6">
                        <div
                          className="w-fit max-w-[86%] rounded-2xl px-4 py-2 text-sm text-slate-900"
                          style={{ backgroundColor: secondaryColor }}
                        >
                          I&apos;m here to help with your shopping needs!
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-3">
                      <div className="rounded-3xl border border-slate-300 bg-white px-4 pt-3 pb-2">
                        <input
                          type="text"
                          placeholder="Message..."
                          value={inputMessage}
                          onChange={(event) =>
                            setInputMessage(event.target.value)
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") setInputMessage("");
                          }}
                          className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                        />
                        <div className="mt-1 flex items-center justify-between text-slate-500">
                          <div className="flex items-center gap-1">
                            <IconMoodSmile className="size-5" />
                            <IconMicrophone className="size-5" />
                            <IconPaperclip className="size-5" />
                          </div>
                          <button
                            type="button"
                            onClick={() => setInputMessage("")}
                            className="inline-flex size-8 items-center justify-center rounded-full bg-slate-200 text-slate-500 transition hover:bg-slate-300"
                          >
                            <IconSend className="size-4" />
                          </button>
                        </div>
                      </div>
                      <p className="mt-2 text-center text-[11px] text-slate-400">
                        This AI-Chatbot can make mistakes.
                      </p>
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 border-t border-slate-200 bg-gray-100">
                <button
                  type="button"
                  onClick={() => setPreviewTab("home")}
                  className={`flex flex-col items-center gap-1 px-3 py-3 text-xs font-semibold transition hover:bg-slate-50 ${previewTab === "home" ? "text-[var(--cb-primary)]" : "text-slate-500"}`}
                >
                  <IconHome className="size-5" />
                  <span>Home</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("messages")}
                  className={`flex flex-col items-center gap-1 px-3 py-3 text-xs font-medium transition hover:bg-slate-50 ${previewTab === "messages" ? "text-[var(--cb-primary)]" : "text-slate-500"}`}
                >
                  <IconMessage className="size-5" />
                  <span>Messages</span>
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
