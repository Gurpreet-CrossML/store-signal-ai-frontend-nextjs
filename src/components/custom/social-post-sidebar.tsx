import { useState, useEffect } from "react";
import { SocialPost } from "@/lib/mock-social-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconExternalLink, IconPlus } from "@tabler/icons-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface SocialPostSidebarProps {
  post: SocialPost;
}

const COLORS = {
  positive: "#22c55e",
  neutral: "#f59e0b",
  negative: "#ef4444",
  spam: "#64748b"
};

export function SocialPostSidebar({ post }: SocialPostSidebarProps) {
  const [localLabels, setLocalLabels] = useState<string[]>(post.labels || []);
  const [newLabelText, setNewLabelText] = useState("");

  const [prevPostId, setPrevPostId] = useState(post.id);

  if (post.id !== prevPostId) {
    setPrevPostId(post.id);
    setLocalLabels(post.labels || []);
    setNewLabelText("");
  }

  const handleAddLabel = () => {
    if (newLabelText.trim()) {
      setLocalLabels(prev => [...prev, newLabelText.trim()]);
      setNewLabelText("");
    }
  };

  const stats = [
    { label: "Post Type", value: post.postType || "Image", valueClass: "text-primary font-semibold" },
    { label: "Published", value: post.date.split(" at")[0] },
    { label: "Reach", value: post.reach || "-" },
    { label: "Impressions", value: post.impressions || "-" },
    { label: "Engagement", value: post.engagement || "-" },
    { label: "Comments", value: post.commentsCount },
    { label: "Likes", value: post.likes || "-" },
    { label: "Shares", value: post.shares || "-" },
  ];

  const chartData = post.moderationSummary ? [
    { name: 'Positive', value: post.moderationSummary.positive, color: COLORS.positive },
    { name: 'Neutral', value: post.moderationSummary.neutral, color: COLORS.neutral },
    { name: 'Negative', value: post.moderationSummary.negative, color: COLORS.negative },
    { name: 'Spam', value: post.moderationSummary.spam, color: COLORS.spam },
  ] : [];

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      
      {/* About this Post */}
      <Card className="border shadow-sm rounded-xl">
        <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-semibold">About this Post</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col gap-3">
            {stats.map((stat, i) => (
              <div key={i} className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">{stat.label}</span>
                <span className={`font-medium ${stat.valueClass || "text-foreground"}`}>{stat.value}</span>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full text-xs h-8 gap-2 mt-2 border-border/70 shadow-sm rounded-lg font-medium">
            View on Platform <IconExternalLink className="h-3 w-3" />
          </Button>
        </CardContent>
      </Card>

      {/* Labels */}
      <Card className="border shadow-sm rounded-xl">
        <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-semibold">Labels</CardTitle>
          <button className="text-xs font-semibold text-primary hover:underline">Manage</button>
        </CardHeader>
        <CardContent className="p-4 pt-3 flex flex-wrap gap-2">
          {localLabels.map((label, i) => (
            <Badge key={i} variant="secondary" className="font-medium text-[10px] bg-primary/[0.08] text-primary border-0 hover:bg-primary/20 px-2 py-0.5 rounded-md">
              {label}
            </Badge>
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <Badge variant="outline" className="font-medium text-[10px] border-dashed border-border text-muted-foreground gap-1 cursor-pointer hover:bg-muted px-2 py-0.5 rounded-md">
                <IconPlus className="h-3 w-3" /> Add label
              </Badge>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-3" align="start" sideOffset={8}>
              <div className="flex flex-col gap-2.5">
                <span className="text-sm font-semibold">Add new label</span>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Label name..." 
                    className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
                    value={newLabelText}
                    onChange={(e) => setNewLabelText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddLabel();
                      }
                    }}
                  />
                  <Button onClick={handleAddLabel} size="sm" className="h-8 px-3 text-xs">Add</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      {/* Moderation Summary */}
      {post.moderationSummary && (
        <Card className="border shadow-sm rounded-xl">
          <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold">Moderation Summary</CardTitle>
            <button className="text-xs font-semibold text-primary hover:underline">View all</button>
          </CardHeader>
          <CardContent className="p-4 pt-3">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 shrink-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={20}
                      outerRadius={30}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex-1 flex flex-col gap-1.5 text-[11px]">
                {chartData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </div>
                    <span className="font-medium text-foreground">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}


    </div>
  );
}
