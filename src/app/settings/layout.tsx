import { AccessGate } from "@/components/custom/access-gate";

/**
 * Company-admin gate for every settings route, menu page included. Held
 * here rather than in each page so a new settings screen is gated by
 * existing, not by remembering to wrap it.
 */
export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AccessGate>{children}</AccessGate>;
}
