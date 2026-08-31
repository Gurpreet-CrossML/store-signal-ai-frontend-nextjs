"use client";

import { Typography } from "@/components/ui/typography";
import { IconShieldCheck } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

const footerLinks = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
  { label: "Security", href: "#" },
];

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <Image
              src="https://storesignal.ai/wp-content/uploads/2026/01/final-logo-dark-1.svg"
              alt="StoreSignal AI"
              width={200}
              height={20}
              loading="eager"
            />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">{children}</div>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <IconShieldCheck className="size-5" />
            </div>
            <div className="flex flex-col gap-1">
              <Typography variant="small">
                Your data is secure with us
              </Typography>
              <Typography variant="muted" className="text-xs">
                256-bit encryption • SOC 2 Type II • GDPR Compliant
              </Typography>
            </div>
          </div>
          <Typography
            variant="muted"
            as="div"
            className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
          >
            <span>© {new Date().getFullYear()} StoreSignal</span>
            {footerLinks.map((link) => (
              <span key={link.label} className="flex items-center gap-x-3">
                <span aria-hidden>|</span>
                <Link
                  href={link.href}
                  className="transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              </span>
            ))}
          </Typography>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <Image
          src="/frame_934.svg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          width={800}
          height={600}
        />
      </div>
    </div>
  );
}
