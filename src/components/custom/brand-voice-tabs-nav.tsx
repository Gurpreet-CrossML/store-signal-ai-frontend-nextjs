"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Persona Identity", href: "/brand-voice/persona-identity" },
  { label: "Never-Say Rules", href: "/brand-voice/never-say-rules" },
] as const;

export default function BrandVoiceTabsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-border px-4">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            "relative px-4 py-2 text-sm font-medium transition-colors",
            pathname === tab.href
              ? "text-primary after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
