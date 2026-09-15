import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IconInfoCircle } from "@tabler/icons-react";

import { cn } from "@/lib/utils";

export const InfoIcon = ({
  text,
  className,
}: {
  /** Plain string, or richer content (a short list) when prose won't scan. */
  text: React.ReactNode;
  /** Overrides the muted default — e.g. `text-inherit` inside a tinted strip. */
  className?: string;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <IconInfoCircle
        className={cn(
          "h-4 w-4 cursor-pointer text-muted-foreground",
          className,
        )}
      />
    </TooltipTrigger>
    <TooltipContent>
      {typeof text === "string" ? <p>{text}</p> : text}
    </TooltipContent>
  </Tooltip>
);
