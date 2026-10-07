import { AccessGate } from "@/components/custom/access-gate";

/** Social AI: company admins only until its roles are decided. Gated here so every screen under it is covered. */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <AccessGate>{children}</AccessGate>;
}
