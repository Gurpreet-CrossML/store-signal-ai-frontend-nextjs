"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SocialAccount } from "@/lib/mock-social-data";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";

interface SocialAccountSelectorProps {
  accounts: SocialAccount[];
  selectedId: string;
  onSelect: (id: string) => void;
  label: string; // "Select Facebook Page" or "Select Instagram Account"
}

export function SocialAccountSelector({ accounts, selectedId, onSelect, label }: SocialAccountSelectorProps) {
  const selectedAccount = accounts.find((a) => a.id === selectedId);

  return (
    <div className="w-full px-3 pt-3 pb-1">
      <Select value={selectedId} onValueChange={onSelect}>
        <SelectTrigger className="w-full h-auto py-2 bg-background">
          {selectedAccount ? (
            <div className="flex items-center gap-2.5 text-left w-full pr-1">
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarImage src={selectedAccount.avatar} />
                <AvatarFallback className="text-[10px]">{selectedAccount.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col truncate">
                <span className="text-sm font-medium leading-tight truncate">{selectedAccount.name}</span>
                <span className="text-[10px] text-muted-foreground leading-tight truncate">{selectedAccount.handle}</span>
              </div>
            </div>
          ) : (
            <SelectValue placeholder={label} />
          )}
        </SelectTrigger>
        <SelectContent position="popper" align="start" className="w-[var(--radix-select-trigger-width)]">
          {accounts.map((account) => (
            <SelectItem key={account.id} value={account.id} className="py-2 cursor-pointer">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarImage src={account.avatar} />
                  <AvatarFallback className="text-[10px]">{account.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium leading-tight">{account.name}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">{account.handle}</span>
                </div>
              </div>
            </SelectItem>
          ))}
          
          <div className="p-1 mt-1 border-t">
            <Button variant="ghost" className="w-full justify-start text-xs text-muted-foreground h-8 px-2" size="sm">
              <IconPlus className="w-3.5 h-3.5 mr-2" />
              Connect {accounts[0]?.platform === "instagram" ? "account" : "page"}
            </Button>
          </div>
        </SelectContent>
      </Select>
    </div>
  );
}
