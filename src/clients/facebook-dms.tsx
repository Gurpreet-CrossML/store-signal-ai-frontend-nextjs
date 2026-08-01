"use client";

import { useEffect, useMemo, useState } from "react";
import { SocialAccountSelector } from "@/components/custom/social-account-selector";
import { SocialChatWindow } from "@/components/custom/social-chat-window";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { IconBrandFacebook, IconMessage2 } from "@tabler/icons-react";
import { CustomerAvatar } from "@/components/custom/customer-avatar";
import { formatRelativeTime } from "@/lib/helpers";
import { groupDmsByContact } from "@/lib/social-dm";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchFacebookDms,
  fetchFacebookPages,
} from "@/redux/api-slice/social-ai-slice";

export default function FbDms() {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { FetchFacebookPagesData, FetchFacebookPagesIsLoading } =
    useAppSelector((state) => state.GetSocialAIReducer.FetchFacebookPagesState);
  const { FetchFacebookDmsData, FetchFacebookDmsIsLoading } = useAppSelector(
    (state) => state.GetSocialAIReducer.FetchFacebookDmsState,
  );

  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);

  // Load the connected Facebook pages for the active store.
  useEffect(() => {
    if (!storeCode) return;
    dispatch(fetchFacebookPages(storeCode));
  }, [dispatch, storeCode]);

  // Default to the first page once pages arrive (or fall back to it when the
  // previously selected one disappears — e.g. the store changed). Derived
  // during render, mirroring the `activeThreadId` pattern in clients/support.tsx,
  // rather than a setState-in-effect that would trigger an extra render.
  const selectedAccountStillExists =
    selectedAccount !== null &&
    FetchFacebookPagesData.some((page) => page.id === selectedAccount);
  if (FetchFacebookPagesData.length > 0 && !selectedAccountStillExists) {
    setSelectedAccount(FetchFacebookPagesData[0].id);
  }
  const activeAccountId = selectedAccountStillExists
    ? selectedAccount
    : (FetchFacebookPagesData[0]?.id ?? null);

  // Load DMs for the selected page.
  useEffect(() => {
    if (!activeAccountId || !storeCode) return;
    dispatch(fetchFacebookDms({ accountId: activeAccountId, storeCode }));
  }, [dispatch, activeAccountId, storeCode]);

  const conversations = useMemo(
    () => groupDmsByContact(FetchFacebookDmsData),
    [FetchFacebookDmsData],
  );

  // Same derived-default pattern for the conversation list.
  const selectedConversationStillExists = conversations.some(
    (c) => c.contactKey === selectedConversation,
  );
  if (conversations.length > 0 && !selectedConversationStillExists) {
    setSelectedConversation(conversations[0].contactKey);
  }
  const activeConversation = selectedConversationStillExists
    ? (conversations.find((c) => c.contactKey === selectedConversation) ?? null)
    : (conversations[0] ?? null);

  return (
    <div className="flex flex-col h-full flex-1 gap-4 min-h-0 bg-background overflow-hidden p-4">
      {/* Main Content */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-[320px_minmax(0,1fr)]">
        {/* List Column */}
        <Card className="flex min-h-0 flex-col overflow-hidden h-full">
          <div className="p-4 border-b border-border/50">
            <SocialAccountSelector
              label="Select Facebook Page"
              platform="facebook"
              accounts={FetchFacebookPagesData}
              selectedId={activeAccountId}
              onSelect={setSelectedAccount}
            />
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1.5">
            {FetchFacebookPagesIsLoading || FetchFacebookDmsIsLoading ? (
              <div className="flex h-full items-center justify-center">
                <Spinner />
              </div>
            ) : !FetchFacebookPagesData.length ? (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                No connected Facebook pages for this store.
              </div>
            ) : !conversations.length ? (
              <div className="flex h-full flex-col items-center justify-center gap-1 p-6 text-center text-sm text-muted-foreground">
                <IconMessage2 className="mb-1 h-6 w-6 opacity-40" />
                <p className="font-medium text-foreground">
                  No conversations yet
                </p>
                <p>DMs for this page will show up here.</p>
              </div>
            ) : (
              conversations.map((conversation) => {
                const isSelected =
                  conversation.contactKey === activeConversation?.contactKey;
                return (
                  <button
                    key={conversation.contactKey}
                    type="button"
                    onClick={() =>
                      setSelectedConversation(conversation.contactKey)
                    }
                    className={`w-full rounded-xl border-l-[3px] p-3 text-left transition ${
                      isSelected
                        ? "border-l-primary bg-primary/[0.07] shadow-sm"
                        : "border-l-transparent hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative shrink-0">
                        <CustomerAvatar name={conversation.contactName} />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center border border-background">
                          <IconBrandFacebook className="w-3 h-3" stroke={2.5} />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-medium">
                            {conversation.contactName}
                          </p>
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {formatRelativeTime(conversation.lastMessageAt)}
                          </span>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {conversation.lastMessage || "[Attachment]"}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </Card>

        {/* Chat Column */}
        <Card className="flex min-h-0 flex-col overflow-hidden h-full">
          <SocialChatWindow
            key={activeConversation?.contactKey ?? "empty"}
            conversation={activeConversation}
          />
        </Card>
      </div>
    </div>
  );
}
