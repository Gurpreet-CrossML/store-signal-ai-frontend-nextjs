import { AccessGate } from "@/components/custom/access-gate";

/** Brand voice (guidance): store setup, so owner and manager. Gated here so every screen under it is covered. */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <AccessGate permission="setup">{children}</AccessGate>;
}
