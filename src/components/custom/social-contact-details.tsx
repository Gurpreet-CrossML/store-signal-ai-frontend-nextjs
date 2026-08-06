import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CustomerAvatar } from "@/components/custom/customer-avatar";
import { SocialAIPlatformOptions } from "@/lib/config";
import { cn } from "@/lib/utils";

// Local types — this panel used to import them from a design-phase mock
// module that no longer exists; the shape is what the panel renders.
export type SocialPlatform = "facebook" | "instagram";

export type SocialContact = {
  name: string;
  username: string;
  tags?: string[];
  email?: string;
  phone?: string;
  location?: string;
  lastOrder?: string;
};
import {
  IconMail,
  IconMapPin,
  IconPhone,
  IconShoppingBag,
  type Icon,
} from "@tabler/icons-react";

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: Icon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-2 text-sm text-muted-foreground">
      <div className="flex min-w-0 items-center gap-2">
        <span className="bg-primary/20 p-1">
          <Icon className="size-5 inline text-primary" />
        </span>
        <span className="shrink-0">{label}</span>
      </div>
      <span className="ml-auto min-w-0 break-words text-right">{value}</span>
    </div>
  );
}

export function SocialContactDetails({
  contact,
  platform,
}: {
  contact: SocialContact;
  platform: SocialPlatform;
}) {
  const platformOption = SocialAIPlatformOptions[platform];
  const PlatformIcon = platformOption?.icon;

  return (
    <>
      <CardHeader className="items-center text-center">
        <CustomerAvatar name={contact.name} size="h-16 w-16" />
        <CardTitle className="mt-2 text-base">{contact.name}</CardTitle>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          {PlatformIcon && (
            <PlatformIcon
              className={cn("size-4 shrink-0", platformOption.color)}
            />
          )}
          @{contact.username}
        </div>
        {contact.tags && contact.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
            {contact.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {contact.email && (
          <DetailRow icon={IconMail} label="Email" value={contact.email} />
        )}
        {contact.phone && (
          <DetailRow icon={IconPhone} label="Phone" value={contact.phone} />
        )}
        {contact.location && (
          <DetailRow
            icon={IconMapPin}
            label="Location"
            value={contact.location}
          />
        )}
        {contact.lastOrder && (
          <DetailRow
            icon={IconShoppingBag}
            label="Last Order"
            value={contact.lastOrder}
          />
        )}
      </CardContent>
    </>
  );
}
