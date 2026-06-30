import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import Settings from "@/clients/settings";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { buildAccess } from "@/lib/access-rules";
import { isSessionActive } from "@/lib/session-verify";
import { runWithTenant } from "@/lib/tenant-context";
import { list_integrations_with_attributes } from "@/db/integrations";

export const metadata = {
  title: "Settings",
};

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  if (!(await isSessionActive(session.user.access_token))) {
    redirect("/login");
  }

  if (!session.user.company_code) {
    redirect("/login");
  }

  const integrations = await runWithTenant(
    "public",
    buildAccess(session.user),
    async () => list_integrations_with_attributes(),
  );

  return <Settings initialIntegrations={integrations} />;
}
