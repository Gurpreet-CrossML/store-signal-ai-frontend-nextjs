import { IconSearch } from "@tabler/icons-react";

import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

/**
 * The search box above a Test AI question list, with a spinner while the
 * results are being refreshed.
 */
export function QuestionsSearchInput({
  value,
  onChange,
  placeholder,
  isRefreshing,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  isRefreshing: boolean;
}) {
  return (
    <div className="relative w-full">
      <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="pr-9 pl-9"
      />
      {isRefreshing && (
        <Spinner className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground" />
      )}
    </div>
  );
}
