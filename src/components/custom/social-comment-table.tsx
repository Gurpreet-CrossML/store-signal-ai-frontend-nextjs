import { SocialComment } from "@/lib/mock-social-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CustomerAvatar } from "./customer-avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IconSearch, IconAdjustmentsHorizontal, IconMessageCircle2, IconTag, IconMoodSmile, IconDotsVertical } from "@tabler/icons-react";

interface SocialCommentTableProps {
  comments: SocialComment[];
  selectedCommentId: string | null;
  onSelectComment: (id: string) => void;
}

export function SocialCommentTable({ comments, selectedCommentId, onSelectComment }: SocialCommentTableProps) {
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
      default:
        return "bg-gray-100 text-gray-700 hover:bg-gray-100";
    }
  };

  return (
    <div className="flex min-h-0 flex-col overflow-hidden h-full">
      <div className="flex items-center justify-between p-4 border-b border-border/50 flex-shrink-0">
        <h2 className="text-base font-semibold">{comments.length} Comments</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground font-medium">Sort by:</span>
            <Select defaultValue="newest">
              <SelectTrigger className="w-[110px] h-9 border-0 bg-transparent shadow-none font-semibold focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="popular">Popular</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button variant="outline" className="h-9 gap-2">
            <IconAdjustmentsHorizontal className="w-4 h-4" />
            Filters
          </Button>
          
          <div className="relative">
            <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search comments..."
              className="h-9 w-64 rounded-md border border-input bg-transparent px-3 py-1 pl-9 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-border/50 flex gap-2 overflow-x-auto flex-shrink-0">
        <Badge variant="secondary" className="px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 hover:bg-purple-100 font-medium cursor-pointer">
          All <span className="ml-1.5 font-bold">128</span>
        </Badge>
        <Badge variant="secondary" className="px-3 py-1.5 rounded-full bg-muted/50 text-foreground hover:bg-muted font-medium cursor-pointer">
          Unreplied <span className="ml-1.5 font-bold">32</span>
        </Badge>
        <Badge variant="secondary" className="px-3 py-1.5 rounded-full bg-red-100 text-red-700 hover:bg-red-100 font-medium cursor-pointer">
          Critical <span className="ml-1.5 font-bold">6</span>
        </Badge>
        <Badge variant="secondary" className="px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 hover:bg-orange-100 font-medium cursor-pointer">
          Escalations <span className="ml-1.5 font-bold">8</span>
        </Badge>
        <Badge variant="secondary" className="px-3 py-1.5 rounded-full bg-muted/50 text-foreground hover:bg-muted font-medium cursor-pointer">
          Spam <span className="ml-1.5 font-bold">12</span>
        </Badge>
        <Badge variant="secondary" className="px-3 py-1.5 rounded-full bg-green-100 text-green-700 hover:bg-green-100 font-medium cursor-pointer">
          Positive <span className="ml-1.5 font-bold">48</span>
        </Badge>
      </div>

      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead>Comment</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="w-28"></TableHead>
              <TableHead className="w-16">Time</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comments.map((comment, index) => (
              <TableRow 
                key={comment.id}
                onClick={() => onSelectComment(comment.id)}
                className={`cursor-pointer transition-colors ${selectedCommentId === comment.id ? "bg-accent/50" : "hover:bg-muted/30"}`}
              >
                <TableCell className="text-center text-muted-foreground text-xs font-medium">
                  {index + 1}
                </TableCell>
                <TableCell>
                  <div className="flex items-start gap-3">
                    <CustomerAvatar name={comment.author} src={comment.avatar} size="h-9 w-9" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{comment.author}</span>
                      <span className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{comment.content}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1.5">
                    {comment.tags.map((tag, idx) => (
                      <Badge 
                        key={idx} 
                        variant="secondary" 
                        className={`rounded-sm px-2 py-0.5 text-[10px] font-medium border-0 ${getBadgeVariant(tag.type)}`}
                      >
                        {tag.label}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 opacity-60">
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground">
                      <IconMessageCircle2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground">
                      <IconTag className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground">
                      <IconMoodSmile className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap font-medium">
                  {comment.timeAgo}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground">
                    <IconDotsVertical className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="p-3 text-center border-t border-border/50 flex-shrink-0">
        <span className="text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
          ↓ Load more comments
        </span>
      </div>
    </div>
  );
}
