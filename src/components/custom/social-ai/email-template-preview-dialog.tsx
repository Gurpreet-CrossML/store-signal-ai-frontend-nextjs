"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { EmailTemplate } from "@/redux/api-slice/campaign-slice";
import { EmailTemplateMonitorPreview } from "./email-template-monitor-preview";

export function EmailTemplatePreviewDialog({
  template,
  onOpenChange,
}: {
  template: EmailTemplate | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!template} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 pr-6">
            <span className="truncate">{template?.name}</span>
          </DialogTitle>
          <DialogDescription>
            How this email template appears when rendered.
          </DialogDescription>
        </DialogHeader>
        {template && <EmailTemplateMonitorPreview template={template} />}
      </DialogContent>
    </Dialog>
  );
}
