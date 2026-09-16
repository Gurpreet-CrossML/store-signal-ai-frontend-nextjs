import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-[calc(100vh-2rem)] items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <h1 className="text-[8rem] font-bold leading-none text-muted-foreground">
          404
        </h1>
        <p className="mt-6 text-3xl leading-tight text-foreground">
          Sorry, we couldn&apos;t find this page.
        </p>
        <Button
          asChild
          className="mt-8 h-12 max-w-sm text-base font-semibold"
        >
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </main>
  );
}
