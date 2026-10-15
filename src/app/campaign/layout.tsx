import { redirect } from "next/navigation";

// Disabled for now: every Campaign screen redirects to the dashboard. Gated
// here so all routes under /campaign are covered. Delete this file to turn it
// back on.
export default function Layout() {
  redirect("/");
}
