import { useEffect, useRef, useState } from "react";
import { Loader, Paperclip, Send, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTestChatbotContext } from "@/clients/test-simulate";
import { AiDisclaimerNotice } from "@/components/custom/test-simulate/test-Ai-disclaimer-modal";
import { UploadMessageAttachments } from "@/redux/api-slice/thread-slice";
import { useAppDispatch } from "@/redux/hooks";

const EMOJIS = [
  "😀",
  "😂",
  "😍",
  "👍",
  "🙏",
  "🎉",
  "🔥",
  "❤️",
  "🤔",
  "👏",
  "✨",
  "🛒",
];

type UploadImage = {
  id: string;
  file: File;
  previewUrl: string;
  isUploading: boolean;
  uploadedUrl: string | null;
};

type UploadedAttachment = {
  original_file_name?: string;
  url?: string;
};

export function MessageInput() {
  const dispatch = useAppDispatch();
  const { sendMessage, session, responseLoading, reInitializing } =
    useTestChatbotContext();
  const [text, setText] = useState("");
  const [images, setImages] = useState<UploadImage[]>([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const inputDisabled = responseLoading || reInitializing;

  useEffect(() => {
    taRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!inputDisabled) {
      taRef.current?.focus();
    }
  }, [inputDisabled]);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    const filesArray = Array.from(files);
    const newImages: UploadImage[] = filesArray.map((file) => ({
      id: Math.random().toString(36).slice(2),
      file,
      previewUrl: URL.createObjectURL(file),
      isUploading: true,
      uploadedUrl: null,
    }));

    setImages((prev) => [...prev, ...newImages]);
    if (fileRef.current) fileRef.current.value = "";

    await Promise.all(
      newImages.map(async (newImage) => {
        const formData = new FormData();
        formData.append("thread_id", session?.session_id || "");
        formData.append("images", newImage.file);

        try {
          const result = await dispatch(
            UploadMessageAttachments({ formData }),
          ).unwrap();
          const uploadedData: UploadedAttachment[] = Array.isArray(result)
            ? result
            : [];
          const uploadedUrl = uploadedData[0]?.url || null;

          setImages((prev) =>
            prev.map((image) =>
              image.id === newImage.id
                ? {
                    ...image,
                    isUploading: false,
                    uploadedUrl,
                  }
                : image,
            ),
          );
        } catch (error) {
          console.error("Upload failed", error);
          setImages((prev) => prev.filter((image) => image.id !== newImage.id));
        }
      }),
    );
  };

  const handleSend = () => {
    if (inputDisabled) return;

    const readyImages = images.filter((image) => !image.isUploading);
    const imageUrls = readyImages
      .map((image) => image.uploadedUrl)
      .filter((url): url is string => Boolean(url));

    if (!text.trim() && imageUrls.length === 0) return;

    sendMessage(text.trim(), false, imageUrls.length > 0 ? imageUrls : null);

    setText("");
    setImages((prev) => prev.filter((image) => image.isUploading));
    setShowEmoji(false);
  };

  return (
    <>
      <div className="mt-2 bg-background">
        {images.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {images.map((image) => (
              <div key={image.id} className="relative size-16 shrink-0">
                <img
                  src={image.previewUrl}
                  alt="Upload preview"
                  className="size-16 rounded-md border bg-muted object-cover"
                />
                {image.isUploading ? (
                  <div className="absolute inset-0 flex items-center justify-center rounded-md bg-background/60">
                    <Loader className="size-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <button
                    type="button"
                    aria-label="Remove image"
                    className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground"
                    onClick={() =>
                      setImages((prev) =>
                        prev.filter((item) => item.id !== image.id),
                      )
                    }
                  >
                    x
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : null}

        {showEmoji ? (
          <div className="mb-2 flex flex-wrap gap-1 rounded-md border bg-muted/30 p-2">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="size-8 rounded-md text-lg hover:bg-background"
                onClick={() => {
                  setText((prev) => `${prev}${emoji}`);
                  setShowEmoji(false);
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : null}

        <div className="rounded-2xl border bg-muted/20 px-3 py-1.5">
          <textarea
            ref={taRef}
            className="h-8 w-full resize-none overflow-y-auto bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Message..."
            value={text}
            disabled={inputDisabled}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            rows={1}
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Emoji"
                disabled={inputDisabled}
                onClick={() => setShowEmoji((prev) => !prev)}
              >
                <Smile className="size-5" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Upload image"
                disabled={inputDisabled}
                onClick={() => fileRef.current?.click()}
              >
                <Paperclip className="size-5" />
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={handleFile}
              />
            </div>

            <Button
              type="button"
              size="icon-lg"
              className="rounded-full"
              aria-label="Send"
              disabled={
                inputDisabled ||
                (!text.trim() && !images.some((image) => !image.isUploading))
              }
              onClick={handleSend}
            >
              {inputDisabled ? (
                <Loader className="size-5 animate-spin" />
              ) : (
                <Send className="size-5" />
              )}
            </Button>
          </div>
        </div>

        <AiDisclaimerNotice />
      </div>
    </>
  );
}
