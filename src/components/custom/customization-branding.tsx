"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import {
  IconPencil,
  IconPhoto,
  IconPhotoPlus,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";

import { InfoIcon } from "@/components/custom/info-icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

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
  const greetingLength = greetingMessage.length;
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconPhotoPlus className="size-4" />
          Branding &amp; Messages
          <InfoIcon text="Your logo and the first messages customers see — the welcome message on the home tab and the greeting when the chat opens." />
        </CardTitle>
        <CardDescription>
          The logo and messages customers see when they open the chat.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <Field className="gap-2">
          <div className="flex flex-col gap-1">
            <FieldLabel htmlFor="logo-upload">Chatbot Logo</FieldLabel>
            <FieldDescription>
              PNG, JPG, SVG, or WEBP, up to 2MB.
            </FieldDescription>
          </div>
          <input
            ref={logoInputRef}
            id="logo-upload"
            type="file"
            accept="image/*,.webp"
            className="hidden"
            onChange={onLogoUpload}
          />
          {/* Wrapper div: Field's vertical orientation stretches direct
              children to w-full; the tile must stay a fixed square. */}
          <div>
            {logoUrl ? (
              <div className="relative h-24 w-24">
                {/* Plain <img>: logoUrl may be a temporary blob: object URL,
                  which next/image does not support (same as the settings
                  page's company logo). */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoUrl}
                  alt="Chatbot logo"
                  className="h-24 w-24 rounded-md border bg-muted object-contain p-1"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      aria-label="Edit logo"
                      className="absolute -right-2 -top-2 size-7 rounded-full shadow"
                    >
                      <IconPencil className="size-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={onRemoveLogo}>
                      <IconTrash />
                      Remove logo
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => logoInputRef.current?.click()}
                    >
                      <IconPhoto />
                      Upload image
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                aria-label="Upload logo"
                className="flex h-24 w-24 items-center justify-center rounded-md border-2 border-dashed text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
              >
                <IconPlus className="size-6" />
              </button>
            )}
          </div>
        </Field>

        <Separator />

        <Field className="gap-2">
          <div className="flex flex-col gap-1">
            <FieldLabel htmlFor="welcome-message">Welcome Message</FieldLabel>
            <FieldDescription>
              Shown on the widget&apos;s home tab.
            </FieldDescription>
          </div>
          <Input
            id="welcome-message"
            value={welcomeMessage}
            onChange={(event) => onWelcomeChange(event.target.value)}
            placeholder="What are you shopping for today?"
            maxLength={WELCOME_LIMIT}
          />
          <FieldDescription className="text-xs">
            {welcomeMessage.length}/{WELCOME_LIMIT} characters
          </FieldDescription>
        </Field>

        <Separator />

        <Field className="gap-2">
          <div className="flex flex-col gap-1">
            <FieldLabel htmlFor="greeting-message">Greeting Message</FieldLabel>
            <FieldDescription>
              The first message the chatbot sends when the chat opens.
            </FieldDescription>
          </div>
          <CKEditorTextArea
            id="greeting-message"
            placeholder="Hi there! How can I help you today?"
            value={greetingMessage}
            useMarkdown
            onChange={onGreetingChange}
            maxLength={GREETING_LIMIT}
          />
          <FieldDescription className="text-xs">
            {greetingLength}/{GREETING_LIMIT} characters
          </FieldDescription>
        </Field>
      </CardContent>
    </Card>
  );
}
