import { SocialConversation } from "@/lib/mock-social-data";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface SocialConversationItemProps {
  conversation: SocialConversation;
  isActive: boolean;
  onClick: (id: string) => void;
}

export function SocialConversationItem({
  conversation,
  isActive,
  onClick,
}: SocialConversationItemProps) {
  const { contact, lastMessage, timeAgo, unreadCount } = conversation;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(conversation.id)}
      className={cn(
        "flex gap-3 p-3 rounded-xl cursor-pointer transition-colors border",
        isActive
          ? "border-primary bg-primary/5"
          : "border-transparent hover:bg-muted",
      )}
    >
      <Avatar className="w-10 h-10 border border-muted flex-shrink-0">
        <AvatarImage src={contact.avatar} alt={contact.name} />
        <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
      </Avatar>

      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-sm font-semibold truncate pr-2">
            {contact.name}
          </span>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {timeAgo}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "text-xs truncate",
              unreadCount > 0
                ? "font-medium text-foreground"
                : "text-muted-foreground",
            )}
          >
            {lastMessage}
          </span>
          {unreadCount > 0 && (
            <Badge
              variant="default"
              className="h-5 w-5 rounded-full p-0 flex items-center justify-center flex-shrink-0 text-[10px]"
            >
              {unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
