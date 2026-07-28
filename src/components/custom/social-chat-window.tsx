"use client";
import { useState, useEffect } from "react";

import { SocialConversation } from "@/lib/mock-social-data";
import { SocialChatMessage } from "./social-chat-message";
import { SocialChatInput } from "./social-chat-input";
import { CustomerAvatar } from "@/components/custom/customer-avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconInfoCircle, IconTag, IconStar, IconCheck, IconDots } from "@tabler/icons-react";

interface SocialChatWindowProps {
  conversation: SocialConversation | null;
}

export function SocialChatWindow({ conversation }: SocialChatWindowProps) {
  const [localMessages, setLocalMessages] = useState(conversation?.messages || []);

  useEffect(() => {
    if (conversation) {
      setLocalMessages(conversation.messages);
    }
  }, [conversation]);

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col h-full bg-background border-r">
        <div className="flex-1 flex items-center justify-center text-muted-foreground bg-muted/20">
          Select a conversation to view messages
        </div>
      </div>
    );
  }

  const { contact } = conversation;

  const handleSendMessage = (text: string) => {
    const newMessage = {
      id: `msg-${Date.now()}`,
      sender: "agent" as const,
      content: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false
    };
    setLocalMessages(prev => [...prev, newMessage]);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background border-r overflow-hidden min-w-0">
      {/* Chat Header */}
      <div className="h-16 border-b flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <CustomerAvatar name={contact.name} src={contact.avatar} />
          <div className="flex flex-col">
            <span className="font-semibold text-sm leading-tight">{contact.name}</span>
            <span className="text-xs text-muted-foreground hover:underline cursor-pointer">
              View profile
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <IconInfoCircle className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <IconTag className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <IconStar className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 ml-2 gap-1.5 font-medium text-xs rounded-md">
            <IconCheck className="h-3.5 w-3.5 text-primary" />
            Mark as done
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground ml-1">
            <IconDots className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 px-6 overflow-y-auto min-h-0">
        <div className="py-6 flex flex-col justify-end min-h-full">
          <div className="w-full flex justify-center mb-6">
            <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground bg-muted/50 border-0 rounded-full px-3 py-1">
              May 16, 2024
            </Badge>
          </div>
          
          <div className="space-y-1">
            {localMessages.map((message) => (
              <SocialChatMessage 
                key={message.id} 
                message={message} 
                contact={contact} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* Chat Input */}
      <SocialChatInput onSend={handleSendMessage} />
    </div>
  );
}
