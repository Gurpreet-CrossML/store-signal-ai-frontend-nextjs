import { SocialComment, SocialPost, SocialReply } from "@/lib/mock-social-data";
import { CustomerAvatar } from "./customer-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconX, IconPlus, IconPaperclip, IconSparkles, IconMoodSmile } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SocialCommentNode, renderWithMentions } from "@/components/custom/social-comment-node";

interface SocialCommentThreadViewProps {
  comment: SocialComment | null;
  post: SocialPost | null;
  platform?: "facebook" | "instagram";
  onClose: () => void;
}

const getBadgeVariant = (type: string) => {
  switch (type) {
    case "question":
      return "bg-blue-100 text-blue-700 hover:bg-blue-100";
    case "positive":
    case "praise":
      return "bg-green-100 text-green-700 hover:bg-green-100";
    case "negative":
    case "feedback":
    case "price concern":
    case "complaint":
      return "bg-red-100 text-red-700 hover:bg-red-100";
    case "neutral":
      return "bg-purple-100 text-purple-700 hover:bg-purple-100";
    default:
      return "bg-gray-100 text-gray-700 hover:bg-gray-100";
  }
};

export function SocialCommentThreadView({ comment, post, platform = "facebook", onClose }: SocialCommentThreadViewProps) {
  const [localReplies, setLocalReplies] = useState<SocialReply[]>([]);
  const [localTags, setLocalTags] = useState<{label: string, type: string}[]>([]);
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [globalReplyText, setGlobalReplyText] = useState("");
  const [newTagText, setNewTagText] = useState("");

  const [prevCommentId, setPrevCommentId] = useState<string | null | undefined>(comment?.id);

  if (comment?.id !== prevCommentId) {
    setPrevCommentId(comment?.id);
    setLocalReplies(comment?.replies || []);
    setLocalTags(comment?.tags || []);
    setActiveReplyId(null);
    setGlobalReplyText("");
    setNewTagText("");
  }

  if (!comment) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground bg-muted/10">
        Select a comment to view details
      </div>
    );
  }

  const handleReplyClick = (id: string) => {
    setActiveReplyId(id === activeReplyId ? null : id);
  };

  const handleAddTag = () => {
    if (newTagText.trim()) {
      setLocalTags(prev => [...prev, { label: newTagText.trim(), type: "neutral" }]);
      setNewTagText("");
    }
  };

  const handleSubmitReply = (text: string) => {
    if (!text.trim()) return;
    
    const newReply: SocialReply = {
      id: `reply-${Date.now()}`,
      author: "Agent",
      role: "agent",
      content: text,
      timeAgo: "Just now",
      reactions: 0
    };
    
    setLocalReplies(prev => [...prev, newReply]);
    setGlobalReplyText("");
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-background/95 backdrop-blur z-10 flex-shrink-0">
        <h3 className="font-semibold text-sm">Comment details</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-muted" onClick={onClose}>
          <IconX className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-5 flex flex-col gap-6 flex-1">
        <div className="flex gap-3">
          <CustomerAvatar name={comment.author} src={comment.avatar} size="h-10 w-10" />
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{comment.author}</span>
              <span className="text-xs text-muted-foreground">{comment.timeAgo}</span>
            </div>
            <p className="text-sm leading-relaxed">{renderWithMentions(comment.content)}</p>
            
            {post && (
              <div className="mt-3 bg-muted/40 rounded-xl p-3">
                <span className="text-xs text-muted-foreground font-medium mb-2 block">Commented on</span>
                <div className="flex gap-3 items-center">
                  <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold leading-tight line-clamp-1">{post.title}</span>
                    <span className="text-xs text-muted-foreground mt-0.5">{post.date}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="h-px bg-border/50 w-full" />

        <div className="space-y-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tags</span>
          <div className="flex flex-wrap items-center gap-2">
            {localTags.map((tag, idx) => (
              <Badge 
                key={idx} 
                variant="secondary" 
                className={`rounded-md px-2.5 py-1 text-xs font-medium border-0 ${getBadgeVariant(tag.type)}`}
              >
                {tag.label}
              </Badge>
            ))}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 rounded-md px-2 text-muted-foreground border-dashed">
                  <IconPlus className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-60 p-3" align="start" sideOffset={8}>
                <div className="flex flex-col gap-2.5">
                  <span className="text-sm font-semibold">Add new tag</span>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Tag name..." 
                      className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
                      value={newTagText}
                      onChange={(e) => setNewTagText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <Button onClick={handleAddTag} size="sm" className="h-8 px-3 text-xs">Add</Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="h-px bg-border/50 w-full" />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Conversation</span>
            <span className="text-xs font-medium text-primary">{localReplies.length} replies</span>
          </div>

          <div className="border border-border/60 rounded-xl bg-card p-4 shadow-sm relative">
            <SocialCommentNode 
              comment={comment}
              replies={localReplies}
              platform={platform}
              activeReplyId={activeReplyId}
              onReplyClick={handleReplyClick}
              onSubmitReply={(commentId, text) => handleSubmitReply(text)}
            />

            <div className="mt-5 relative z-10">
              <div className="border border-border/70 rounded-xl bg-background flex flex-col focus-within:border-primary/50 focus-within:shadow-sm transition-all overflow-hidden">
                <textarea 
                  id="comment-reply-input"
                  rows={2}  
                  placeholder="Write a reply..."
                  className="w-full bg-transparent resize-none outline-none p-3 text-sm placeholder:text-muted-foreground"
                  value={globalReplyText}
                  onChange={(e) => setGlobalReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitReply(globalReplyText);
                    }
                  }}
                />
                <div className="flex items-center justify-between p-2 border-t border-border/40 bg-muted/20">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-muted hover:text-foreground">
                          <IconSparkles className="h-4 w-4 text-primary" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuItem className="gap-2 cursor-pointer py-2">
                          <IconSparkles className="h-4 w-4 text-primary" />
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">Generate reply</span>
                            <span className="text-xs text-muted-foreground">Draft a reply using AI</span>
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-muted hover:text-foreground">
                          <IconMoodSmile className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="flex flex-wrap gap-1 p-2 w-[160px]">
                        {['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '✨'].map(emoji => (
                          <button key={emoji} type="button" className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted text-lg">
                            {emoji}
                          </button>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <input type="file" id="file-upload-comment" className="hidden" accept="image/*" />
                    <Button onClick={() => document.getElementById('file-upload-comment')?.click()} variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-muted hover:text-foreground">
                      <IconPaperclip className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button 
                    onClick={() => handleSubmitReply(globalReplyText)}
                    disabled={!globalReplyText.trim()}
                    size="sm" 
                    className={cn("h-7 px-3 rounded-md text-xs font-semibold", globalReplyText.trim() ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed hover:bg-muted")}
                  >
                    Reply
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
