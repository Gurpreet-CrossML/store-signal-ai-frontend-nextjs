"use client";

import dynamic from "next/dynamic";
import { IconMessageCircle, IconPhotoPlus } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CKEditorTextArea = dynamic(
  () => import("@/components/custom/ckeditor-text-area"),
  {
    ssr: false,
  },
);

const WELCOME_LIMIT = 500;
const GREETING_LIMIT = 180;

type CustomizationBrandingProps = {
  logoUrl: string | null;
  welcomeMessage: string;
  greetingMessage: string;
  onWelcomeChange: (value: string) => void;
  onGreetingChange: (value: string) => void;
  onLogoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveLogo: () => void;
};

export default function CustomizationBranding({
  logoUrl,
  welcomeMessage,
  greetingMessage,
  onWelcomeChange,
  onGreetingChange,
  onLogoUpload,
  onRemoveLogo,
}: CustomizationBrandingProps) {
  const greetingLength = greetingMessage.trim().length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Label htmlFor="logo-upload" className="flex items-center gap-2">
          <IconPhotoPlus className="size-4" />
          Chatbot Logo
        </Label>
        <div className="flex flex-col gap-3 border border-dashed border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col">
            <p className="text-xs font-medium">Upload logo</p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, SVG, or WEBP (max 2MB)
            </p>
          </div>
          <Input
            id="logo-upload"
            type="file"
            accept="image/*,.webp"
            className="sm:max-w-xs"
            onChange={onLogoUpload}
          />
        </div>
        {logoUrl && (
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={onRemoveLogo}
          >
            Remove uploaded logo
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="welcome-message" className="flex items-center gap-2">
          <IconMessageCircle className="size-4" />
          Welcome Message
          <span className="text-xs font-normal text-muted-foreground">
            (shown on home tab)
          </span>
        </Label>
        <Input
          id="welcome-message"
          value={welcomeMessage}
          onChange={(event) => onWelcomeChange(event.target.value)}
          placeholder="What are you shopping for today?"
          maxLength={WELCOME_LIMIT}
        />
        <p className="text-xs text-muted-foreground">
          {welcomeMessage.length}/{WELCOME_LIMIT} characters
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="flex items-center gap-2">
          <IconMessageCircle className="size-4" />
          Greeting Message
          <span className="text-xs font-normal text-muted-foreground">
            (shown when chat opens)
          </span>
        </Label>
        <div className="border border-border p-3">
          <CKEditorTextArea
            id="greeting-message"
            placeholder="Hi there! How can I help you today?"
            value={greetingMessage}
            useMarkdown
            onChange={onGreetingChange}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {greetingLength}/{GREETING_LIMIT} characters
        </p>
      </div>
    </div>
  );
}
