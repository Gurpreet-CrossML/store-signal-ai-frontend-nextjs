import { SocialMessage, SocialContact } from "@/lib/mock-social-data";
import { CustomerAvatar } from "@/components/custom/customer-avatar";
import { cn } from "@/lib/utils";
import { IconCheck, IconChecks } from "@tabler/icons-react";

interface SocialChatMessageProps {
  message: SocialMessage;
  contact: SocialContact;
}

export function SocialChatMessage({
  message,
  contact,
}: SocialChatMessageProps) {
  const isAgent = message.sender === "agent";

  return (
    <div
      className={cn(
        "flex w-full mb-4",
        isAgent ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "flex gap-3 max-w-[80%]",
          isAgent ? "flex-row-reverse" : "flex-row",
        )}
      >
        {!isAgent && (
          <CustomerAvatar
            name={contact.name}
            src={contact.avatar}
            size="w-8 h-8"
          />
        )}

        <div
          className={cn(
            "flex flex-col gap-1",
            isAgent ? "items-end" : "items-start",
          )}
        >
          <div
            className={cn(
              "px-4 py-2.5 rounded-2xl text-sm leading-relaxed relative group",
              isAgent
                ? "bg-[#F3E8FF] text-[#5B21B6] rounded-br-sm"
                : "bg-muted text-foreground rounded-bl-sm",
            )}
          >
            {message.content}
          </div>
          <div className="flex items-center gap-2 mt-1 px-1 relative">
            <span className="text-[11px] text-muted-foreground mr-1">
              {message.time}
            </span>

            {isAgent && (
              <div className="ml-1">
                {message.isRead ? (
                  <IconChecks className="w-3.5 h-3.5 text-blue-500" />
                ) : (
                  <IconCheck className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
