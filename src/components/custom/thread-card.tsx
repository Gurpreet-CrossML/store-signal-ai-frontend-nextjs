import { cn } from "@/lib/utils";

export function ThreadCard({
  title,
  children,
  className,
}: {
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border bg-background",
        className,
      )}
    >
      {title ? (
        <div className="border-b px-5 py-4 text-lg font-semibold">{title}</div>
      ) : null}
      {children}
    </section>
  );
}
