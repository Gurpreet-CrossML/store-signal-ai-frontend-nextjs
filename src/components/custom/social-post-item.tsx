import { SocialPost } from "@/lib/mock-social-data";
import { cn } from "@/lib/utils";
import { IconMessageCircle2 } from "@tabler/icons-react";
import Image from "next/image"; // Note: might need simple img if Image domain not configured, we'll use a div with bg-image or img

interface SocialPostItemProps {
  post: SocialPost;
  isActive: boolean;
  onClick: (id: string) => void;
}

export function SocialPostItem({ post, isActive, onClick }: SocialPostItemProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(post.id)}
      className={cn(
        "w-full flex text-left gap-3 p-3 rounded-xl cursor-pointer transition border-l-[3px]",
        isActive
          ? "border-l-primary bg-primary/[0.07] shadow-sm"
          : "border-l-transparent hover:bg-muted/50"
      )}
    >
      <div className="w-[60px] h-[60px] rounded-lg overflow-hidden flex-shrink-0 bg-muted relative">
        {/* Using standard img for mock data to avoid Next.js Image domain config issues */}
        <img
          src={post.image}
          alt={post.title}
          className="object-cover w-full h-full"
        />
      </div>
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <h4 className="text-sm font-semibold line-clamp-2 leading-tight mb-1">
          {post.title}
        </h4>
        <div className="text-[11px] text-muted-foreground mb-1">
          {post.date}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <IconMessageCircle2 className="w-3.5 h-3.5" />
          {post.commentsCount} comments
        </div>
      </div>
    </button>
  );
}
