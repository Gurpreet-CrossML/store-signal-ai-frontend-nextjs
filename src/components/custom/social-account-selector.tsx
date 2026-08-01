"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SocialAIPlatformOptions } from "@/lib/config";
import type { MetaPage } from "@/redux/api-slice/social-ai-slice";
import { cn } from "@/lib/utils";

export function SocialAccountSelector({
  label,
  platform,
  accounts,
  selectedId,
  onSelect,
}: {
  label: string;
  platform: "facebook" | "instagram";
  accounts: MetaPage[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const platformOption = SocialAIPlatformOptions[platform];
  const PlatformIcon = platformOption?.icon;

  return (
    <Select
      value={selectedId !== null ? String(selectedId) : ""}
      onValueChange={(value) => onSelect(Number(value))}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{label}</SelectLabel>
          {accounts.map((account) => (
            <SelectItem key={account.id} value={String(account.id)}>
              {PlatformIcon && (
                <PlatformIcon
                  className={cn("size-4 shrink-0", platformOption.color)}
                />
              )}
              <span className="flex flex-col">
                <span>
                  {account.name || account.username || `Page #${account.id}`}
                </span>
                {account.username && (
                  <span className="text-xs text-muted-foreground">
                    @{account.username}
                  </span>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
