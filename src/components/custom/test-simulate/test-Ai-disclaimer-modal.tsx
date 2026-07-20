import {
  IconAlertTriangle,
  IconInfoCircle,
  IconLock,
  IconX,
} from "@tabler/icons-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function AiDisclaimerNotice() {
  return (
    <p className="mt-2 text-center text-xs text-muted-foreground">
      This AI-Chatbot can make mistakes.{" "}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button className="font-semibold text-foreground underline">
            Learn more
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-[500px] gap-0 rounded-xl p-6 shadow-2xl lg:max-w-[500px]">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <IconInfoCircle className="size-5" />
            </span>
            <AlertDialogTitle className="text-left text-lg font-semibold">
              About this AI Chatbot
            </AlertDialogTitle>
            <AlertDialogCancel
              variant="ghost"
              size="icon-sm"
              className="ml-auto rounded-full bg-muted text-muted-foreground hover:bg-muted/80"
            >
              <IconX className="size-5" />
            </AlertDialogCancel>
          </div>

          <AlertDialogDescription asChild>
            <div className="space-y-3 text-left text-sm leading-6 text-foreground">
              <p>
                This chatbot is powered by artificial intelligence and is
                designed to assist you with product discovery, and general
                support.
              </p>

              <div className="rounded-md bg-muted p-3">
                <div className="mb-2 flex items-center gap-1.5 font-semibold">
                  <IconAlertTriangle className="size-4" />
                  <span>Please keep in mind:</span>
                </div>
                <div className="space-y-2">
                  <p>
                    AI responses may occasionally be inaccurate or incomplete.
                  </p>
                  <p>
                    Always verify important details like pricing, availability.
                  </p>
                  <p>
                    For critical issues, please contact our human support team.
                  </p>
                </div>
              </div>

              <div className="rounded-md bg-muted p-3">
                <div className="mb-2 flex items-center gap-1.5 font-semibold">
                  <IconLock className="size-4" />
                  <span>Your privacy matters:</span>
                </div>
                <div className="space-y-2">
                  <p>Conversations may be used to improve our service.</p>
                  <p>We do not share your personal data with third parties.</p>
                </div>
              </div>
            </div>
          </AlertDialogDescription>

          <AlertDialogAction className="mt-3 h-9 w-full">
            Got it
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </p>
  );
}
