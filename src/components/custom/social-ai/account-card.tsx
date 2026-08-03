"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ConnectedAccount } from "@/redux/api-slice/social-ai-slice";

import { useAccountIdentity, useChannel } from "./channel-context";

// The sticky sidebar card: selected account details plus a switcher when the
// store has more than one account on this channel.
export function AccountCard({
    loading,
    accounts,
    selectedAccount,
    onSelectAccount,
    className,
}: {
    loading: boolean;
    accounts: ConnectedAccount[];
    selectedAccount: ConnectedAccount | null;
    onSelectAccount: (accountId: string) => void;
    className?: string;
}) {
    const account = useAccountIdentity();
    const channel = useChannel();

    return (
        <Card size="sm" className={cn("w-full max-w-xl md:w-72 h-fit", className)}>
            <CardContent className="flex flex-col gap-3">
                {loading ? (
                    <div className="flex items-center gap-3">
                        <Skeleton className="size-10 rounded-full" />
                        <div className="flex-1 space-y-1.5">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                    </div>
                ) : selectedAccount ? (
                    <div className="flex items-center gap-3">
                        <Avatar size="lg">
                            {account.profilePictureUrl ? (
                                <AvatarImage src={account.profilePictureUrl} alt={account.name} />
                            ) : (
                                <AvatarFallback className="font-medium">
                                    {account.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            )}
                        </Avatar>
                        <div className="flex min-w-0 flex-1 flex-col">
                            <span className="flex items-center gap-1.5 text-[15px] font-semibold">
                                <span className="truncate">{account.name}</span>
                                <Badge
                                    variant={selectedAccount.is_active ? "default" : "secondary"}
                                    className="shrink-0 text-[10px]"
                                >
                                    {selectedAccount.is_active ? "Active" : "Inactive"}
                                </Badge>
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                                {[
                                    account.username && `@${account.username}`,
                                    `webhooks ${selectedAccount.webhook_status}`,
                                ]
                                    .filter(Boolean)
                                    .join(" · ")}
                            </span>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        No {channel.label} accounts connected for this store.
                    </p>
                )}
                {selectedAccount && accounts.length > 1 && (
                    <>
                        <Separator />
                        <Select
                            value={String(selectedAccount.id)}
                            onValueChange={onSelectAccount}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Switch account" />
                            </SelectTrigger>
                            <SelectContent>
                                {accounts.map((acc) => (
                                    <SelectItem key={acc.id} value={String(acc.id)}>
                                        {acc.name || acc.username || acc.external_id}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
