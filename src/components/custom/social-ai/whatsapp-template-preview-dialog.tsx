"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WhatsAppTemplateStatusBadge } from "@/components/ui/status-badge";
import type {
  ConnectedAccount,
  WhatsAppTemplate,
} from "@/redux/api-slice/social-ai-slice";
import { WhatsAppPhoneMockup } from "./whatsapp-phone-mockup";

/**
 * Read-only phone-mockup preview for one template, opened from the
 * templates table's Eye action. Just the mockup — category/language/
 * quality/etc. already live in the table's own columns, so they aren't
 * duplicated here. Sized up from WhatsAppPhoneMockup's 280px default (a
 * standalone dialog has more room to spare than the create/edit page's
 * 360px sidebar column, which stays at the default) — `sm:max-w-md` keeps
 * the dialog close to that larger width rather than stretching it across a
 * near-empty modal.
 */
export function WhatsAppTemplatePreviewDialog({
  template,
  account,
  onOpenChange,
}: {
  template: WhatsAppTemplate | null;
  account: ConnectedAccount | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!template} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 pr-6">
            <span className="truncate">{template?.name}</span>
            {template && (
              <WhatsAppTemplateStatusBadge status={template.status} />
            )}
          </DialogTitle>
          <DialogDescription>
            How this template appears in a WhatsApp conversation.
          </DialogDescription>
        </DialogHeader>
        {template && (
          <WhatsAppPhoneMockup
            accountName={account?.name || ""}
            isVerified={Boolean(account?.is_active)}
            components={template.components}
            maxWidth={340}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
