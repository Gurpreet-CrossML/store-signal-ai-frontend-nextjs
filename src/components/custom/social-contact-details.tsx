import { SocialContact } from "@/lib/mock-social-data";
import { CustomerAvatar } from "./customer-avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { OrdersCard } from "@/components/custom/thread-detail-panels";

export function SocialContactDetails({
  contact,
  platform,
}: {
  contact: SocialContact;
  platform: "facebook" | "instagram";
}) {
  const getBadgeVariant = (tag: string) => {
    if (tag.toLowerCase().includes("new"))
      return "bg-green-100 text-green-700 hover:bg-green-100";
    if (tag.toLowerCase().includes("inquiry"))
      return "bg-blue-100 text-blue-700 hover:bg-blue-100";
    if (tag.toLowerCase().includes("interested"))
      return "bg-purple-100 text-purple-700 hover:bg-purple-100";
    return "bg-gray-100 text-gray-700 hover:bg-gray-100";
  };

  const [localTags, setLocalTags] = useState(contact.tags || []);
  const [newTagText, setNewTagText] = useState("");

  const [prevContactId, setPrevContactId] = useState(contact.id);

  if (contact.id !== prevContactId) {
    setPrevContactId(contact.id);
    setLocalTags(contact.tags || []);
    setNewTagText("");
  }

  const handleAddTag = () => {
    if (newTagText.trim()) {
      setLocalTags((prev) => [...prev, newTagText.trim()]);
      setNewTagText("");
    }
  };

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      {/* About this contact */}
      <Card className="border shadow-sm rounded-xl">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-sm font-semibold">
            About this contact
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <CustomerAvatar
              name={contact.name}
              src={contact.avatar}
              size="h-10 w-10"
            />
            <div className="flex flex-col">
              <span className="font-semibold text-sm">{contact.name}</span>
              <button className="text-xs font-semibold text-primary text-left hover:underline">
                View profile
              </button>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">
                {platform === "facebook" ? "Facebook ID" : "Instagram ID"}
              </span>
              <span className="font-medium">100012345678901</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Local time</span>
              <span className="font-medium">{contact.localTime}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Liked your page</span>
              <span className="font-medium">
                {contact.likedPage || "Unknown"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total messages</span>
              <span className="font-medium">{contact.totalMessages}</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full text-xs font-semibold h-8 rounded-xl"
          >
            View full details
          </Button>
        </CardContent>
      </Card>

      {/* Tags */}
      <Card className="border shadow-sm rounded-xl">
        <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-semibold">Tags</CardTitle>
          <button className="text-xs font-semibold text-primary hover:underline">
            Manage
          </button>
        </CardHeader>
        <CardContent className="p-4 pt-3 flex flex-wrap gap-2">
          {localTags.map((tag, idx) => (
            <Badge
              key={idx}
              variant="secondary"
              className={`px-2 py-0.5 rounded-full border-0 text-xs font-medium ${getBadgeVariant(tag)}`}
            >
              {tag}
            </Badge>
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-6 rounded-full px-2 text-muted-foreground border-dashed"
              >
                <IconPlus className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-3" align="start">
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
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button
                    onClick={handleAddTag}
                    size="sm"
                    className="h-8 px-3 text-xs"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      {/* Previous orders using OrdersCard from thread-detail-panels */}
      <OrdersCard
        orders={
          contact.previousOrders?.map(
            (order) =>
              ({
                id: parseInt(order.id.replace(/\D/g, "") || "1", 10),
                order_number: order.id,
                fulfillment_status: order.status.toLowerCase(),
                created_at: order.date,
                items: [
                  {
                    name: "Sample Item",
                    price: parseFloat(
                      order.amount.replace(/[^\d.-]/g, "") || "0",
                    ),
                    quantity: 1,
                  },
                ],
                currency: order.amount.includes("₹") ? "INR" : "USD",
                total_price: parseFloat(
                  order.amount.replace(/[^\d.-]/g, "") || "0",
                ),
                gateway: "mock",
                financial_status: "paid",
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              }) as any,
          ) || []
        }
        loading={false}
        handleOrdersSync={() => {}}
        orderSyncLoading={false}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        custometData={{ email: "customer@example.com" } as any}
      />
    </div>
  );
}
