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
import { IconBuildingSkyscraper, IconLock, IconPlugConnected, IconUsers } from "@tabler/icons-react";
import CompanyProfileForm from "@/components/custom/company-profile-form";
import StaffManagement from "@/components/custom/staff-management";
import StoreIntegrationsTabContent from "@/components/custom/store-integrations-tab-content";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

const SETTINGSNAV = [
  {
    key: 'company_profile',
    value: "Company Profile",
    icon: IconBuildingSkyscraper
  },
  {
    key: 'staff_management',
    value: "Staff Management",
    icon: IconUsers
  },
  {
    key: 'store_integrations',
    value: "Connectors",
    icon: IconPlugConnected
  },
]

function SidebarNav(
  {
    className,
    value,
    items,
    setCategory,
    ...props
  }: {
    className?: string;
    value: string;
    items: { key: string; value: string; icon?: React.ComponentType<{ className?: string }> }[];
    setCategory: (key: string) => void;
  }
) {

  return (
    <nav
      className={cn(
        "flex flex-col justify-start w-full lg:space-y-1",
        className
      )}
      {...props}
    >
      {items.map((item, idx) => (
        <div
          key={idx}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            value === item.key
              ? "bg-muted hover:bg-muted"
              : "hover:bg-gray-100 hover:no-underline",
            "justify-between cursor-pointer w-full"
          )}
        >
          <div
            onClick={() => setCategory(item.key)}
            className={cn(
              value === item.key ? 'w-full p-0 text-primary' : 'w-full p-0',
              "flex items-center"
            )}
          >
            {item.icon && <item.icon className="mr-2 h-4 w-4" />}
            {item.value}
          </div>
        </div>
      ))}
    </nav>
  )
}


export default function Settings() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('company_profile');

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
    <div className="px-4">
      <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
        General Settings
      </h4>
      <p className="text-sm text-muted-foreground">
        Edit the general information of your queue.
      </p>
      <div className="flex flex-row py-4 w-full gap-4">
        <SidebarNav
          className="lg:w-64"
          value={activeTab}
          items={SETTINGSNAV}
          setCategory={setActiveTab}
        />
        {activeTab === 'company_profile' && <CompanyProfileForm className="border-none shadow-none lg:w-full" />}
        {activeTab === 'staff_management' && <StaffManagement className="lg:w-full" />}
        {activeTab === 'store_integrations' && <StoreIntegrationsTabContent />}
      </div>
    </div>
  );
}
