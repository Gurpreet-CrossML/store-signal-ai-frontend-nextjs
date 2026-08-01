import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { IconUser } from "@tabler/icons-react";

// Deterministic avatar accent so the same contact always gets the same color.
const AVATAR_PALETTE = [
  "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
];

function getAvatarColor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function getInitials(name: string | null | undefined) {
  if (!name) return null;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return null;
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase());
  return initials.join("");
}

export function CustomerAvatar({
  name,
  size = "h-9 w-9",
  online,
}: {
  name?: string | null;
  size?: string;
  online?: boolean;
}) {
  const initials = getInitials(name);

  return (
    <div className="relative shrink-0">
      <Avatar className={`${size} mt-0.5`}>
        <AvatarFallback
          className={`text-sm font-medium ${
            initials ? getAvatarColor(name ?? "") : "bg-primary/10 text-primary"
          }`}
        >
          {initials ?? <IconUser className="h-5 w-5" />}
        </AvatarFallback>
      </Avatar>
      {online !== undefined && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${
            online ? "bg-green-500" : "bg-muted-foreground/40"
          }`}
        />
      )}
    </div>
  );
}
