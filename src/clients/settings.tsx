"use client";

import { useSession } from "next-auth/react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { IconLock } from "@tabler/icons-react";
import CompanyProfileForm from "@/components/custom/company-profile-form";
import StoreIntegrationsTabContent from "@/components/custom/store-integrations-tab-content";
import StaffManagement from "@/components/custom/staff-management";
import type { IntegrationCatalogItem } from "@/lib/integration-types";

type SettingsProps = {
  initialIntegrations: IntegrationCatalogItem[];
};

export default function Settings({ initialIntegrations }: SettingsProps) {
  const { data: session, status } = useSession();

  // Company settings + staff management are company-admin (is_staff) only.
  // The Django endpoints enforce this server-side too; this is just the UX gate.
  if (status === "authenticated" && !session?.user?.is_staff) {
    return (
      <div className="p-4">
        <Empty className="h-full">
          <EmptyHeader>
            <EmptyMedia>
              <IconLock />
            </EmptyMedia>
            <EmptyTitle>Admins only</EmptyTitle>
            <EmptyDescription>
              Company settings and staff management are available to company
              admins only.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Tabs defaultValue="company" className="gap-4">
        <TabsList>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
        </TabsList>
        <TabsContent value="company">
          <CompanyProfileForm />
        </TabsContent>
        <TabsContent value="integrations">
          <StoreIntegrationsTabContent
            initialIntegrations={initialIntegrations}
          />
        </TabsContent>
        <TabsContent value="staff">
          <StaffManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
