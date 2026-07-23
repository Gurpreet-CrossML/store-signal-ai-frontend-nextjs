import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandWhatsapp,
  IconDeviceMobileMessage,
  IconMail,
  IconMicrophone,
  IconWebhook,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { StatusPill, SettingsCard, InfoCallout } from "../ticketing-settings";
import { cn } from "@/lib/utils";

const channelRows = [
  {
    label: "Email",
    detail: "support@motherandbaby.ie",
    icon: IconMail,
    color: "bg-orange-500",
    connected: true,
  },
  {
    label: "Web chat widget",
    detail: "Installed on motherandbaby.ie",
    icon: IconWebhook,
    color: "bg-indigo-600",
    connected: true,
  },
  {
    label: "WhatsApp Business",
    detail: "+353 1 555 0192",
    icon: IconBrandWhatsapp,
    color: "bg-emerald-500",
    connected: true,
  },
  {
    label: "Instagram",
    detail: "@motherandbaby.ie - DMs & comments",
    icon: IconBrandInstagram,
    color: "bg-pink-600",
    connected: true,
  },
  {
    label: "Facebook",
    detail: "Messenger & comments",
    icon: IconBrandFacebook,
    color: "bg-blue-600",
    connected: true,
  },
  {
    label: "SMS",
    detail: "Connect a number",
    icon: IconDeviceMobileMessage,
    color: "bg-slate-500",
    connected: false,
  },
  {
    label: "Voice",
    detail: "AI phone support - your differentiator",
    icon: IconMicrophone,
    color: "bg-cyan-600",
    connected: false,
  },
];

export function ChannelsSection() {
  return (
    <div className="space-y-4">
      <SettingsCard title="Connected channels">
        <div>
          {channelRows.map((channel) => {
            const Icon = channel.icon;
            return (
              <div
                key={channel.label}
                className="flex items-center gap-4 border-b px-5 py-4 last:border-b-0"
              >
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-lg text-white",
                    channel.color,
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-950">
                    {channel.label}
                  </div>
                  <div className="truncate text-xs font-medium text-slate-500">
                    {channel.detail}
                  </div>
                </div>
                {channel.connected ? (
                  <StatusPill>Connected</StatusPill>
                ) : (
                  <Button variant="outline" size="sm" className="bg-white">
                    Connect
                  </Button>
                )}
                <Switch defaultChecked={channel.connected} />
              </div>
            );
          })}
        </div>
      </SettingsCard>
      <InfoCallout>
        WhatsApp and Instagram are first-class here - your edge for India, APAC,
        and MEA where these are the primary support channels.
      </InfoCallout>
    </div>
  );
}
