"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WhatsAppTemplateCategoryBadge } from "@/components/ui/status-badge";
import type {
  ConnectedAccount,
  WhatsAppTemplateLibraryItem,
} from "@/redux/api-slice/social-ai-slice";
import { WhatsAppPhoneMockup } from "./whatsapp-phone-mockup";

/**
 * Read-only phone-mockup preview for one catalog item, opened by hovering
 * its card in the Post Sale grid — exactly what importing it will add to
 * this account, before the user commits. Same mockup/sizing as
 * WhatsAppTemplatePreviewDialog; kept separate because a catalog item
 * carries no `status` (it isn't a real template yet, just offered).
 */
export function WhatsAppTemplateLibraryPreviewDialog({
  item,
  account,
  onOpenChange,
}: {
  item: WhatsAppTemplateLibraryItem | null;
  account: ConnectedAccount | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 pr-6">
            <span className="truncate">{item?.display_name}</span>
            {item && (
              <WhatsAppTemplateCategoryBadge category={item.category} />
            )}
          </DialogTitle>
          <DialogDescription>
            How this template will appear once imported.
          </DialogDescription>
        </DialogHeader>
        {item && (
          <WhatsAppPhoneMockup
            accountName={account?.name || ""}
            isVerified={Boolean(account?.is_active)}
            components={item.components}
            maxWidth={340}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
