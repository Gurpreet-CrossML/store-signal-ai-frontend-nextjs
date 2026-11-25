import { AccessGate } from "@/components/custom/access-gate";

/** Social AI: marketing, so owner and manager. Gated here so every screen under it is covered. */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <AccessGate permission="marketing">{children}</AccessGate>;
}
