"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconArrowLeft, IconListSearch } from "@tabler/icons-react";

import { PageHeading } from "@/components/custom/page-heading";
import { QuestionsPanel } from "@/components/custom/knowledge/test-ai/questions-panel";
import { TestChatPanel } from "@/components/custom/knowledge/test-ai/test-chat-panel";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsBelowLg } from "@/hooks/use-narrow-viewport";
import { KNOWLEDGE_TEST_AI_TABS, type KnowledgeTestAiTab } from "@/lib/config";
import {
  AskTestQuestion,
  FetchTestMessages,
} from "@/redux/api-slice/knowledge-test-ai-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

/**
 * The Test AI screen. On a wide screen the AI test chat takes the larger left
 * side and the questions sit in a panel on the right with two tabs, "Test
 * Questions" and "Unanswered Questions". On a phone or tablet the chat fills
 * the screen, and a button at the top right opens the same panel in a drawer
 * from the right. Every question has an Ask button, and the user can type their
 * own question; the AI answers in the chat, where each answer is shown and
 * saved. While it answers, the input and every Ask button are off.
 */
export function TestAiPage() {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { TestChatPendingQuestion: pendingQuestion, TestChatError: error } =
    useAppSelector((state) => state.GetKnowledgeTestAiReducer.TestChatState);
  const [tab, setTab] = useState<KnowledgeTestAiTab>(
    KNOWLEDGE_TEST_AI_TABS.questions,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  // The panel is in the drawer below the desktop layout, in the page above it.
  const isBelowLg = useIsBelowLg();

  // A question is being answered until it succeeds or fails.
  const isAsking = pendingQuestion !== null && error === null;

  useEffect(() => {
    if (storeCode) dispatch(FetchTestMessages({ storeCode }));
  }, [dispatch, storeCode]);

  const handleAsk = (question: string) => {
    if (!storeCode || isAsking) return;
    dispatch(AskTestQuestion({ storeCode, question }));
    // From the drawer: close it, so the chat showing the answer is in view.
    setDrawerOpen(false);
  };

  const panelProps = {
    tab,
    onTabChange: setTab,
    onAsk: handleAsk,
    isAsking,
  };

  return (
    <div className="flex h-app-screen flex-col gap-3 overflow-hidden p-3 sm:gap-4 sm:p-4">
      <div className="flex flex-col gap-2 sm:gap-3">
        {/* The drawer button shares the back link's row, to save a line. */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/knowledge"
            className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <IconArrowLeft className="size-4" />
            Knowledge
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 desktop:hidden"
            onClick={() => setDrawerOpen(true)}
          >
            <IconListSearch className="size-4" />
            Questions
          </Button>
        </div>
        <PageHeading
          title="Test AI"
          description="Try questions on your AI and see what customers asked that it couldn't answer."
          descriptionClassName="hidden sm:block"
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-4 desktop:grid desktop:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] desktop:grid-rows-[minmax(0,1fr)]">
        <div className="min-h-0 min-w-0 flex-1 desktop:h-full desktop:flex-none">
          <TestChatPanel onAsk={handleAsk} isAsking={isAsking} />
        </div>

        {!isBelowLg && (
          <QuestionsPanel
            {...panelProps}
            // Hidden below the desktop layout until the viewport check below
            // takes it out, so it never flashes on a phone.
            className="hidden rounded-xl border desktop:flex desktop:h-full desktop:min-h-0"
          />
        )}
      </div>

      <Sheet open={isBelowLg && drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full gap-0 sm:max-w-md">
          <SheetHeader className="border-b pr-14">
            <SheetTitle>Questions</SheetTitle>
            <SheetDescription>
              Pick one to ask your AI, or see what customers asked that it
              couldn&apos;t answer.
            </SheetDescription>
          </SheetHeader>
          <QuestionsPanel {...panelProps} className="min-h-0 flex-1" />
        </SheetContent>
      </Sheet>
    </div>
  );
}
