"use client";

import { useState } from "react";
import { SocialAccountSelector } from "@/components/custom/social-account-selector";
import { SocialCommentTable } from "@/components/custom/social-comment-table";
import { SocialCommentThreadView } from "@/components/custom/social-comment-thread-view";
import { SocialPostItem } from "@/components/custom/social-post-item";
import {
  MOCK_POSTS,
  MOCK_COMMENTS,
  MOCK_IG_ACCOUNTS,
} from "@/lib/mock-social-data";
import { Card } from "@/components/ui/card";

export default function IgComments() {
  const [selectedAccount, setSelectedAccount] = useState(
    MOCK_IG_ACCOUNTS[0].id,
  );
  const [selectedPostId, setSelectedPostId] = useState<string | null>(
    MOCK_POSTS[0]?.id || null,
  );
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(
    null,
  );

  const selectedComment =
    MOCK_COMMENTS.find((c) => c.id === selectedCommentId) || null;
  const selectedPost = selectedPostId
    ? MOCK_POSTS.find((p) => p.id === selectedPostId) || null
    : null;
  const filteredComments = selectedPostId
    ? MOCK_COMMENTS.filter((c) => c.postId === selectedPostId)
    : [];

  return (
    <div className="flex flex-col h-full flex-1 gap-4 min-h-0 bg-background overflow-hidden p-4">
      {/* Main Content */}
      <div
        className={`grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden ${selectedCommentId ? "xl:grid-cols-[320px_minmax(0,1fr)_420px]" : "xl:grid-cols-[320px_minmax(0,1fr)]"}`}
      >
        {/* List Column */}
        <Card className="flex min-h-0 flex-col overflow-hidden h-full border-border/50 shadow-sm rounded-2xl">
          <div className="p-4 border-b border-border/50">
            <SocialAccountSelector
              label="Select Instagram Account"
              accounts={MOCK_IG_ACCOUNTS}
              selectedId={selectedAccount}
              onSelect={setSelectedAccount}
            />
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1.5">
            {MOCK_POSTS.map((post) => (
              <SocialPostItem
                key={post.id}
                post={post}
                isActive={post.id === selectedPostId}
                onClick={(id) => {
                  setSelectedPostId(id);
                  setSelectedCommentId(null);
                }}
              />
            ))}
          </div>
        </Card>

        {/* Center Column: Table */}
        <Card className="flex min-h-0 flex-col overflow-hidden h-full border-border/50 shadow-sm rounded-2xl">
          <SocialCommentTable
            comments={filteredComments}
            selectedCommentId={selectedCommentId}
            onSelectComment={setSelectedCommentId}
          />
        </Card>

        {/* Right Column: Thread Detail */}
        {selectedCommentId && (
          <Card className="flex min-h-0 flex-col overflow-hidden h-full border-border/50 shadow-sm rounded-2xl">
            <SocialCommentThreadView
              comment={selectedComment}
              post={selectedPost}
              onClose={() => setSelectedCommentId(null)}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
