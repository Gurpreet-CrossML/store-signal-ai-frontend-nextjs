"use client";

import { IconMessageCircle, IconUserCircle } from "@tabler/icons-react";

import { Input } from "@/components/ui/input";
import LabeledField from "@/components/custom/labeled-field";
import { cn } from "@/lib/utils";
import type { SelfReference } from "@/redux/api-slice/brand-voice-slice";

const NAME_LIMIT = 60;
const ROLE_DESCRIPTION_LIMIT = 160;
const EMAIL_SIGNATURE_LIMIT = 160;
const BACKSTORY_LIMIT = 500;

type PersonaIdentityFormProps = {
  name: string;
  roleDescription: string;
  selfReference: SelfReference;
  emailSignature: string;
  backstory: string;
  onNameChange: (value: string) => void;
  onRoleDescriptionChange: (value: string) => void;
  onSelfReferenceChange: (value: SelfReference) => void;
  onEmailSignatureChange: (value: string) => void;
  onBackstoryChange: (value: string) => void;
};

export default function PersonaIdentityForm({
  name,
  roleDescription,
  selfReference,
  emailSignature,
  backstory,
  onNameChange,
  onRoleDescriptionChange,
  onSelfReferenceChange,
  onEmailSignatureChange,
  onBackstoryChange,
}: PersonaIdentityFormProps) {
  return (
    <div className="flex flex-col gap-6">
      <LabeledField
        htmlFor="agent-name"
        label="Agent name"
        icon={IconUserCircle}
        hint="How the AI identifies itself. Use a persona name to feel like a real teammate — or your brand name for a company voice."
      >
        <Input
          id="agent-name"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="Ellie"
          maxLength={NAME_LIMIT}
        />
      </LabeledField>

      <LabeledField
        htmlFor="role-description"
        label="Role description"
        hint="Frames how the AI sees its own job. Shapes helpfulness and expertise."
      >
        <Input
          id="role-description"
          value={roleDescription}
          onChange={(event) => onRoleDescriptionChange(event.target.value)}
          placeholder="A friendly product expert on the Mother&Baby team"
          maxLength={ROLE_DESCRIPTION_LIMIT}
        />
      </LabeledField>

      <LabeledField
        label="Self-reference"
        hint="How the AI refers to itself in conversations."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(
            [
              { value: "i", label: '"I"', example: "I can help with that" },
              { value: "we", label: '"We"', example: "We can help with that" },
            ] as const
          ).map((option) => {
            const selected = selfReference === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onSelfReferenceChange(option.value)}
                className={cn(
                  "relative flex flex-col items-center gap-1 rounded-lg border p-4 text-center transition-colors",
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50",
                )}
              >
                <span
                  className={cn(
                    "absolute right-3 top-3 size-3 rounded-full border",
                    selected
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/40",
                  )}
                />
                <span className="text-sm font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">
                  {option.example}
                </span>
              </button>
            );
          })}
        </div>
      </LabeledField>

      <LabeledField
        htmlFor="email-signature"
        label="Email signature"
        icon={IconMessageCircle}
        hint="Appended to email replies. Chat and WhatsApp skip this automatically."
      >
        <Input
          id="email-signature"
          value={emailSignature}
          onChange={(event) => onEmailSignatureChange(event.target.value)}
          placeholder="Warmly, Ellie — Mother&Baby Customer Care"
          maxLength={EMAIL_SIGNATURE_LIMIT}
        />
      </LabeledField>

      <LabeledField
        htmlFor="backstory"
        label="Backstory"
        badge="(optional)"
        hint="Adds personality and context to guide how the AI responds."
      >
        <textarea
          id="backstory"
          value={backstory}
          onChange={(event) => onBackstoryChange(event.target.value)}
          placeholder="Ellie is a parent herself and genuinely understands the little worries new parents have. Warm, reassuring, never condescending."
          maxLength={BACKSTORY_LIMIT}
          rows={4}
          className="w-full min-w-0 resize-y rounded-md border border-input bg-transparent px-2.5 py-2 text-base shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
        />
      </LabeledField>
    </div>
  );
}
