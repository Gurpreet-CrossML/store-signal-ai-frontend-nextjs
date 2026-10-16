import { redirect } from "next/navigation";

// Disabled for now: every Social AI screen redirects to the dashboard. Gated
// here so all routes under /social-ai are covered. Restore the original below
// to turn it back on.
export default function Layout() {
  redirect("/");
}

// import { AccessGate } from "@/components/custom/access-gate";
//
// /** Social AI: company admins only until its roles are decided. Gated here so every screen under it is covered. */
// export default function Layout({ children }: { children: React.ReactNode }) {
//   return <AccessGate>{children}</AccessGate>;
// }
