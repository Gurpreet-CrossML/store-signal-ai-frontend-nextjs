import { useState } from "react";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconChevronRight,
} from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  Integration,
  IntegrationAttribute,
} from "@/lib/integration-types";
import { LogoMark } from "@/components/custom/integration-card";
import { Stepper } from "@/components/custom/stepper";

export type StepId = 0 | 1 | 2;

function isSecretField(attr: IntegrationAttribute): boolean {
  const s = (attr.code + attr.display_name).toLowerCase();
  return (
    s.includes("key") ||
    s.includes("token") ||
    s.includes("secret") ||
    s.includes("password") ||
    s.includes("pass")
  );
}

interface IntegrationDialogProps {
  integration: Integration | null;
  step: StepId;
  attributes: IntegrationAttribute[];
  attributeValues: Record<string, string>;
  testState: "idle" | "loading" | "success" | "error";
  testMessage: string | null;
  saving: boolean;
  storeId: number | null;
  storeName: string | null;
  currentSaved: boolean;
  onClose: (keepEnabled: boolean) => void;
  onSetStep: (step: StepId) => void;
  onSetAttributeValues: (
    values:
      | Record<string, string>
      | ((current: Record<string, string>) => Record<string, string>),
  ) => void;
  onSetTestState: (state: "idle" | "loading" | "success" | "error") => void;
  onSetTestMessage: (message: string | null) => void;
  onTestConnection: () => Promise<void>;
  onSave: () => Promise<void>;
}

export function IntegrationDialog({
  integration,
  step,
  attributes,
  attributeValues,
  testState,
  testMessage,
  saving,
  storeId,
  storeName,
  currentSaved,
  onClose,
  onSetStep,
  onSetAttributeValues,
  onSetTestState,
  onSetTestMessage,
  onTestConnection,
  onSave,
}: IntegrationDialogProps) {
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>(
    {},
  );

  return (
    <Dialog
      open={Boolean(integration)}
      onOpenChange={(open) => {
        if (!open) onClose(false);
      }}
    >
      <DialogContent className="max-h-[calc(100vh-2rem)] gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <div className="flex max-h-[calc(100vh-2rem)] flex-col">
          <DialogHeader className="border-b border-border/60 px-5 pb-3 pt-5 pr-16">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                {integration ? <LogoMark integration={integration} /> : null}
                <div className="min-w-0">
                  <DialogTitle className="text-lg font-medium">
                    {integration?.name ?? "Integration"}
                  </DialogTitle>
                  <div className="text-sm text-muted-foreground">
                    {integration?.description ??
                      "Choose credentials, test the connection, and save it to the store."}
                  </div>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="border-b border-border/60 px-5 py-3">
            <Stepper step={step} />
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-5 px-5 py-4">
              {integration && step === 0 && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3.5">
                    <div
                      className="space-y-3 text-sm leading-6 text-muted-foreground [&_a]:text-primary [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_strong]:font-medium [&_ul]:list-disc [&_ul]:pl-5"
                      dangerouslySetInnerHTML={{
                        __html: integration.steps_for_creds || "",
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm text-muted-foreground">
                      Review the setup instructions before entering credentials.
                    </div>
                    <Button type="button" onClick={() => onSetStep(1)}>
                      Next
                      <IconArrowRight />
                    </Button>
                  </div>
                </div>
              )}

              {integration && step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-4">
                    {attributes.map((attribute) => {
                      const fieldType =
                        attribute.type === "url" ? "url" : "text";
                      const secretField = isSecretField(attribute);
                      return (
                        <Field key={attribute.code} className="space-y-2">
                          <FieldLabel htmlFor={attribute.code}>
                            {attribute.display_name}
                            {attribute.is_required ? (
                              <span className="text-destructive">*</span>
                            ) : null}
                          </FieldLabel>
                          <div className="relative">
                            <Input
                              id={attribute.code}
                              type={
                                secretField && !visibleFields[attribute.code]
                                  ? "password"
                                  : fieldType
                              }
                              className={secretField ? "pr-16" : undefined}
                              value={attributeValues[attribute.code] ?? ""}
                              onChange={(event) => {
                                onSetAttributeValues((current) => ({
                                  ...current,
                                  [attribute.code]: event.target.value,
                                }));
                                onSetTestState("idle");
                                onSetTestMessage(null);
                              }}
                            />
                            {secretField && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1/2 h-7 -translate-y-1/2 px-2 text-xs"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setVisibleFields((current) => ({
                                    ...current,
                                    [attribute.code]: !current[attribute.code],
                                  }));
                                }}
                              >
                                {visibleFields[attribute.code]
                                  ? "Hide"
                                  : "Show"}
                              </Button>
                            )}
                          </div>
                        </Field>
                      );
                    })}

                    {attributes.length === 0 && (
                      <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                        No attributes were returned for this integration.
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onSetStep(0)}
                    >
                      <IconArrowLeft />
                      Back
                    </Button>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <Button
                        type="button"
                        onClick={() => void onTestConnection()}
                        disabled={
                          integration == null ||
                          storeId == null ||
                          testState === "loading"
                        }
                      >
                        {testState === "loading" ? (
                          <>
                            <Spinner className="size-4" />
                            Testing...
                          </>
                        ) : (
                          <>
                            Test Connection
                            <IconChevronRight />
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => onSetStep(2)}
                        disabled={testState !== "success"}
                      >
                        Next
                      </Button>
                    </div>
                  </div>

                  {testMessage && (
                    <div
                      className={cn(
                        "rounded-xl border px-4 py-3 text-sm",
                        testState === "success"
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : "border-destructive/20 bg-destructive/10 text-destructive",
                      )}
                    >
                      {testMessage}
                    </div>
                  )}
                </div>
              )}

              {integration && step === 2 && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
                    {testState === "success"
                      ? "Connection verified successfully. Save the integration to enable it."
                      : "Run the connection test from the Credentials step before saving."}
                  </div>

                  <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-4 text-sm">
                    <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                      Selected integration
                    </div>
                    <div className="font-medium text-foreground">
                      {integration.name}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onSetStep(1)}
                    >
                      <IconArrowLeft />
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={() => void onSave()}
                      disabled={
                        testState !== "success" || saving || storeId == null
                      }
                    >
                      {saving ? (
                        <>
                          <Spinner className="size-4" />
                          Saving...
                        </>
                      ) : (
                        <>
                          Save
                          <IconCheck />
                        </>
                      )}
                    </Button>
                  </div>

                  {currentSaved && (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
                      This integration is already enabled for the current store.
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>

          <Separator />

          <div className="border-t border-border/60 px-5 py-3 text-xs text-muted-foreground">
            {storeId == null
              ? "Select a store to test and save."
              : `Store ${storeName ?? storeId} will receive the integration when you save.`}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
