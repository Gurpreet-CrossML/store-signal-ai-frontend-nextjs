import { useState, useRef, useEffect } from "react";
import { SocialComment, SocialReply } from "@/lib/mock-social-data";
import { CustomerAvatar } from "@/components/custom/customer-avatar";
import { IconUserPlus, IconMoodSmile, IconArrowForwardUp, IconMessageCircle2 } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export const renderWithMentions = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(@\w+)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("@")) {
          const isAgent = part.toLowerCase() === "@agent";
          return (
            <span 
              key={i} 
              className={`inline-block px-1.5 py-0.5 rounded-md text-[11px] font-bold tracking-tight mx-0.5 align-text-bottom ${
                isAgent 
                  ? "bg-muted text-muted-foreground" 
                  : "bg-primary/15 text-primary"
              }`}
            >
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

interface ThreadActionRowProps {
  isAgent?: boolean;
  id: string;
  author: string;
  activeReplyId: string | null;
  onReplyClick: (id: string, author: string) => void;
  onSubmitReply: (text: string) => void;
}

export function ThreadActionRow({ isAgent, id, author, activeReplyId, onReplyClick, onSubmitReply }: ThreadActionRowProps) {
  const [reaction, setReaction] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [replyText, setReplyText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  
  const hideTimeout = useRef<any>(null);

  const isReplying = activeReplyId === id;

  useEffect(() => {
    if (isReplying && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isReplying]);

  const handleMouseEnter = () => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    setShowPicker(true);
  };
  
  const handleMouseLeave = () => {
    hideTimeout.current = setTimeout(() => setShowPicker(false), 300);
  };

  const handleReplyClick = () => {
    if (isReplying) {
      onReplyClick("", "");
    } else {
      setReplyText(`@${author} `);
      onReplyClick(id, author);
    }
  };

  const getCleanText = () => {
    const text = replyText.trim();
    const mention = `@${author}`;
    if (text.startsWith(mention)) {
      return text.substring(mention.length).trim();
    }
    return text;
  };

  const canSend = getCleanText().length > 0;

  const handleSubmit = () => {
    if (!canSend) return;
    onSubmitReply(replyText);
    setReplyText("");
    onReplyClick("", "");
  };

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center gap-2 mt-1 text-muted-foreground relative w-full">
        {reaction && (
          <div className="bg-background border rounded-full px-1.5 py-0.5 text-[10px] shadow-sm cursor-pointer z-10 hover:scale-110 transition-transform" onClick={() => setReaction(null)}>
            {reaction}
          </div>
        )}
        
        {showPicker && (
          <div 
            className="absolute -top-10 left-0 bg-background border shadow-md rounded-full px-2 py-1 flex items-center gap-1 z-50 animate-in fade-in zoom-in-95 duration-150"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
              <button 
                key={emoji} 
                type="button" 
                onClick={() => {
                  setReaction(emoji);
                  setShowPicker(false);
                }} 
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted hover:scale-125 transition-transform text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        
        <div 
          className="relative flex items-center ml-1"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button className="hover:text-foreground transition-colors" title="React">
            <IconMoodSmile className="w-3.5 h-3.5" />
          </button>
        </div>
        
        <button 
          onClick={handleReplyClick}
          className={cn("hover:text-foreground transition-colors ml-2", isReplying && "text-foreground")}
          title="Reply"
        >
          <IconArrowForwardUp className="w-3.5 h-3.5" />
        </button>
        
        {isAgent && <IconMessageCircle2 className="h-3.5 w-3.5 text-primary ml-auto" />}
      </div>

      {isReplying && (
        <div className="flex items-center gap-2 mt-3 w-full animate-in fade-in slide-in-from-top-1">
          <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <IconUserPlus className="h-3 w-3" />
          </div>
          <div className="flex-1 border border-border/60 rounded-2xl px-3 py-1.5 flex items-center bg-background shadow-sm focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
             <input 
               ref={inputRef}
               type="text" 
               placeholder="Write a reply..." 
               className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground" 
               value={replyText}
               onChange={(e) => setReplyText(e.target.value)}
               onKeyDown={(e) => {
                 if (e.key === 'Enter') handleSubmit();
               }}
             />
             <button 
               onClick={handleSubmit} 
               disabled={!canSend}
               className={cn("font-semibold text-xs ml-2 transition-opacity", canSend ? "text-primary hover:opacity-80" : "text-muted-foreground opacity-50 cursor-not-allowed")}
             >
               Send
             </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface SocialCommentNodeProps {
  comment: SocialComment;
  // If provided, uses these replies (e.g. from local state) instead of comment.replies
  replies?: SocialReply[];
  activeReplyId: string | null;
  onReplyClick: (id: string, author: string) => void;
  onSubmitReply: (commentId: string, text: string) => void;
}

export function SocialCommentNode({
  comment,
  replies,
  activeReplyId,
  onReplyClick,
  onSubmitReply,
}: SocialCommentNodeProps) {
  const displayReplies = replies || comment.replies || [];

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Top Level Comment */}
      <div className="flex items-start gap-3">
        <CustomerAvatar name={comment.author} src={comment.avatar} size="h-9 w-9" />
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{comment.author}</span>
          </div>
          <p className="text-sm mt-0.5">{renderWithMentions(comment.content)}</p>
          <div className="mt-0.5">
            <ThreadActionRow 
              id={comment.id}
              author={comment.author}
              activeReplyId={activeReplyId}
              onReplyClick={onReplyClick}
              onSubmitReply={(text) => onSubmitReply(comment.id, text)}
            />
          </div>
        </div>
      </div>

      {/* Nested Replies */}
      {displayReplies.length > 0 && (
        <div className="pl-12 flex flex-col gap-4 mt-1 border-l-2 border-border/40 ml-4 pb-2">
          {displayReplies.map((reply) => (
            <div key={reply.id} className="flex gap-3 relative -left-4 w-full">
              <div className="bg-background shrink-0">
                {reply.role === "agent" ? (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                    <IconUserPlus className="h-4 w-4" />
                  </div>
                ) : (
                  <CustomerAvatar name={reply.author} src={reply.avatar || comment.avatar} size="h-8 w-8" />
                )}
              </div>
              
              <div className="flex flex-col flex-1 gap-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold text-[13px] ${reply.role === "agent" ? "text-primary" : ""}`}>{reply.author}</span>
                </div>
                
                <div className={`text-sm py-1.5 px-3 rounded-xl mt-1 w-fit ${reply.role === "agent" ? "bg-primary/[0.08] text-foreground/90 border border-primary/10" : "bg-muted/50"}`}>
                  {renderWithMentions(reply.content)}
                </div>
                
                <ThreadActionRow 
                  isAgent={reply.role === "agent"}
                  id={reply.id}
                  author={reply.author}
                  activeReplyId={activeReplyId}
                  onReplyClick={onReplyClick}
                  onSubmitReply={(text) => onSubmitReply(comment.id, text)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
