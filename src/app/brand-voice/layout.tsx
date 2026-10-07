import { AccessGate } from "@/components/custom/access-gate";

/** Brand voice (guidance): company admins only. Gated here so every screen under it is covered. */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <AccessGate>{children}</AccessGate>;
}
