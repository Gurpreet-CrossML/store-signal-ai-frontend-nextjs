import { AccessGate } from "@/components/custom/access-gate";

/** Knowledge base: roles with knowledge access. Gated here so every screen under it is covered. */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <AccessGate permission="knowledge">{children}</AccessGate>;
}
