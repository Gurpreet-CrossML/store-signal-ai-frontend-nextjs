import { AccessGate } from "@/components/custom/access-gate";

/** Live Support: roles that work conversations. Gated here so every screen under it is covered. */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <AccessGate permission="conversations">{children}</AccessGate>;
}
