"use client";

import { useState } from "react";
import {
  SocialPost,
  SocialAccount,
  MOCK_COMMENTS,
  SocialReply,
} from "@/lib/mock-social-data";
import { CustomerAvatar } from "@/components/custom/customer-avatar";
import {
  IconHeart,
  IconMessageCircle2,
  IconShare3,
  IconDots,
  IconChevronLeft,
  IconChevronRight,
  IconUserPlus,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { SocialChatInput } from "@/components/custom/social-chat-input";
import { SocialCommentNode } from "@/components/custom/social-comment-node";

interface SocialPostThreadViewProps {
  post: SocialPost;
  account: SocialAccount;
}

export function SocialPostThreadView({
  post,
  account,
}: SocialPostThreadViewProps) {
  // In a real app we'd fetch comments for this post. Using MOCK_COMMENTS as seed state.
  const [comments, setComments] = useState(MOCK_COMMENTS);
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  const handleReplyToPost = (text: string) => {
    if (!text.trim()) return;
    const newComment = {
      id: `c-new-${Date.now()}`,
      postId: post.id,
      author: "Safarnest Admin",
      timeAgo: "Just now",
      content: text,
      avatar: account.avatar,
      tags: [],
      replies: [],
    };
    setComments((prev) => [...prev, newComment]);
  };

  const handleReplyClick = (id: string) => {
    setActiveReplyId(id === activeReplyId ? null : id);
  };

  const handleSubmitReply = (commentId: string, text: string) => {
    if (!text.trim()) return;

    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const newReply: SocialReply = {
            id: `reply-${Date.now()}`,
            author: "Agent",
            role: "agent",
            content: text,
            timeAgo: "Just now",
            reactions: 0,
          };
          return { ...c, replies: [...(c.replies || []), newReply] };
        }
        return c;
      }),
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <div className="flex-1 overflow-y-auto min-h-0 relative pb-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Author Header */}
        <div className="p-5 flex items-center justify-between border-b sticky top-0 bg-background/95 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <CustomerAvatar name={account.name} src={account.avatar} />
            <div className="flex flex-col">
              <span className="font-semibold text-sm leading-tight">
                {account.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {account.handle}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex flex-col items-end text-xs">
              <span className="font-semibold text-foreground">
                {post.title}
              </span>
              <span>
                Posted {post.date.split(" at")[0]} •{" "}
                {account.platform === "instagram" ? "Instagram" : "Facebook"}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-foreground"
            >
              <IconDots className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 pb-4">
          {/* Post Media Container */}
          <div className="relative w-full rounded-xl overflow-hidden bg-muted flex items-center justify-center max-h-[400px]">
            <img
              src={post.image}
              alt={post.title}
              className="object-contain w-full h-full max-h-[400px]"
            />

            {/* Carousel Arrows */}
            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between">
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 rounded-full shadow-sm bg-background/90 hover:bg-background border"
              >
                <IconChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 rounded-full shadow-sm bg-background/90 hover:bg-background border"
              >
                <IconChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Pagination Dots */}
            <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/70" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/70" />
            </div>
          </div>

          {/* Action row (Likes, Comments) */}
          <div className="flex items-center gap-6 py-4">
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm cursor-pointer hover:text-red-500 transition-colors">
              <IconHeart className="h-5 w-5 text-red-500" />
              <span className="font-semibold text-foreground">
                {post.likes}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm cursor-pointer hover:text-foreground transition-colors">
              <IconMessageCircle2 className="h-5 w-5" />
              <span className="font-semibold text-foreground">
                {post.commentsCount}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm cursor-pointer hover:text-foreground transition-colors">
              <IconShare3 className="h-5 w-5" />
              <span className="font-semibold text-foreground">
                {post.shares}
              </span>
            </div>
          </div>

          {/* Caption */}
          <div className="text-sm pb-6 border-b">
            <p className="leading-relaxed">
              Our Summer Collection is finally here! Light, breezy and made for
              sunny days.
              <br />
              <br />
              <span className="text-blue-600 font-medium cursor-pointer">
                #Summer #Fashion #WomenWear
              </span>
            </p>
          </div>
        </div>

        {/* Comments Section */}
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-[13px] text-muted-foreground">
              Comments ({post.commentsCount})
            </h3>
            <span className="text-[11px] text-muted-foreground font-medium cursor-pointer flex items-center gap-1">
              Sort by: Newest <IconChevronRight className="w-3 h-3 rotate-90" />
            </span>
          </div>

          <div className="space-y-6">
            {comments.map((comment) => (
              <SocialCommentNode
                key={comment.id}
                comment={comment}
                activeReplyId={activeReplyId}
                onReplyClick={handleReplyClick}
                onSubmitReply={handleSubmitReply}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Global Reply Input */}
      <div className="shrink-0 bg-background shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
        <SocialChatInput onSend={handleReplyToPost} />
      </div>
    </div>
  );
}
