"use client";

import { useState } from "react";
import { SocialAccountSelector } from "@/components/custom/social-account-selector";
import { SocialChatWindow } from "@/components/custom/social-chat-window";
import { 
  MOCK_FB_ACCOUNTS, 
  MOCK_CONVERSATIONS 
} from "@/lib/mock-social-data";
import { Card } from "@/components/ui/card";
import { IconBrandFacebook } from "@tabler/icons-react";
import { CustomerAvatar } from "@/components/custom/customer-avatar";
import { SocialContactDetails } from "@/components/custom/social-contact-details";

export default function FbDms() {
  const [selectedAccount, setSelectedAccount] = useState(MOCK_FB_ACCOUNTS[0].id);
  const [selectedConversation, setSelectedConversation] = useState(MOCK_CONVERSATIONS[0].id);

  const activeConversation = MOCK_CONVERSATIONS.find(c => c.id === selectedConversation) || null;
  const activeAccount = MOCK_FB_ACCOUNTS.find(a => a.id === selectedAccount) || MOCK_FB_ACCOUNTS[0];

  return (
    <div className="flex flex-col h-full flex-1 gap-4 min-h-0 bg-background overflow-hidden p-4">

      {/* Main Content */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-[320px_minmax(0,1fr)_420px]">
        {/* List Column */}
        <Card className="flex min-h-0 flex-col overflow-hidden h-full">
          <div className="p-4 border-b border-border/50">
            <SocialAccountSelector
              label="Select Facebook Page"
              accounts={MOCK_FB_ACCOUNTS}
              selectedId={selectedAccount}
              onSelect={setSelectedAccount}
            />
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1.5">
            {MOCK_CONVERSATIONS.map((conversation) => {
              const isSelected = conversation.id === selectedConversation;
              const isUnread = conversation.unreadCount && conversation.unreadCount > 0;
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setSelectedConversation(conversation.id)}
                  className={`w-full rounded-xl border-l-[3px] p-3 text-left transition ${
                    isSelected
                      ? "border-l-primary bg-primary/[0.07] shadow-sm"
                      : isUnread
                        ? "border-l-transparent font-semibold hover:bg-muted/50"
                        : "border-l-transparent hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <CustomerAvatar name={conversation.contact.name} />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center border border-background">
                        <IconBrandFacebook className="w-3 h-3" stroke={2.5} />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`truncate text-sm ${isUnread ? "font-semibold text-foreground" : "font-medium"}`}>
                          {conversation.contact.name}
                        </p>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {conversation.timeAgo}
                        </span>
                      </div>
                      <p className={`mt-0.5 line-clamp-2 text-xs ${isUnread ? "text-foreground/70 font-bold" : "text-muted-foreground"}`}>
                        {conversation.lastMessage}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Chat Column */}
        <Card className="flex min-h-0 flex-col overflow-hidden h-full">
          <SocialChatWindow conversation={activeConversation} />
        </Card>

        {/* Contact Details Column */}
        <Card className="flex min-h-0 flex-col overflow-hidden h-full pt-6">
          <div className="flex-1 min-h-0 overflow-y-auto">
            {activeConversation ? (
              <SocialContactDetails contact={activeConversation.contact} platform={activeAccount.platform} />
            ) : (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                Select a conversation to inspect its details.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
