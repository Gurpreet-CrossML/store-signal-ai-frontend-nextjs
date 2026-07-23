"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  IconAlertTriangle,
  IconCalendar,
  IconClock,
  IconInfoCircle,
  IconLink,
  IconMail,
  IconRoute,
  IconSettingsAutomation,
  IconStar,
  IconTag,
  IconTextSize,
  IconUsers,
} from "@tabler/icons-react";

import { CsatSection } from "@/components/custom/helpdesk/csat-section";
import { TeamsRolesSection } from "@/components/custom/helpdesk/team-role-section";
import { BusinessHoursSection } from "@/components/custom/helpdesk/bussiness-hours";
import { SlaPoliciesSection } from "@/components/custom/helpdesk/sla-policies";
import { RoutingAssignmentSection } from "@/components/custom/helpdesk/routing-assignment";
import { RulesAutomationsSection } from "@/components/custom/helpdesk/rules-automations";
import { TagsFieldsSection } from "@/components/custom/helpdesk/tags-fields";
import { ViewsSection } from "@/components/custom/helpdesk/views-section";
import { ChannelsSection } from "@/components/custom/helpdesk/channel-section";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export type SectionId =
  | "channels"
  | "views"
  | "tags-fields"
  | "rules-automations"
  | "routing-assignment"
  | "sla-policies"
  | "business-hours"
  | "teams-roles"
  | "csat";

type NavItem = {
  id: SectionId;
  label: string;
  icon: typeof IconMail;
};

const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: "Channels & Views",
    items: [
      { id: "channels", label: "Channels", icon: IconLink },
      { id: "views", label: "Views", icon: IconTextSize },
      { id: "tags-fields", label: "Tags & Fields", icon: IconTag },
    ],
  },
  {
    title: "Automation",
    items: [
      {
        id: "rules-automations",
        label: "Rules & Automations",
        icon: IconSettingsAutomation,
      },
      {
        id: "routing-assignment",
        label: "Routing & Assignment",
        icon: IconRoute,
      },
    ],
  },
  {
    title: "Service Levels",
    items: [
      { id: "sla-policies", label: "SLA Policies", icon: IconClock },
      { id: "business-hours", label: "Business Hours", icon: IconCalendar },
    ],
  },
  {
    title: "Team & Quality",
    items: [
      { id: "teams-roles", label: "Teams & Roles", icon: IconUsers },
      { id: "csat", label: "CSAT", icon: IconStar },
    ],
  },
];

const sectionCopy: Record<SectionId, { title: string; description: string }> = {
  channels: {
    title: "Channels",
    description:
      "Every connected channel flows into one omnichannel inbox. Each inbound - from any source - becomes a ticket.",
  },
  views: {
    title: "Views",
    description:
      "Saved, filtered slices of the queue. A strong default set ships with every workspace; agents and admins can add their own.",
  },
  "tags-fields": {
    title: "Tags & Custom Fields",
    description:
      'A governed taxonomy - a fixed, admin-managed set so tags never "mean three different things." This keeps every downstream report and SLA honest.',
  },
  "rules-automations": {
    title: "Rules & Automations",
    description:
      "Background automations that react to ticket events. Build them visually - no code. The golden rule: aim each rule at resolving a repeat reason, not just acknowledging it.",
  },
  "routing-assignment": {
    title: "Routing & Assignment",
    description:
      "How incoming tickets reach the right agent. Balanced assignment with a concurrency limit is the safest default - it is what makes auto-assignment safe to leave on.",
  },
  "sla-policies": {
    title: "SLA Policies",
    description:
      "Response-time targets that keep your team accountable. Timers pause automatically while you are waiting on the customer - so metrics measure your responsiveness, not theirs.",
  },
  "business-hours": {
    title: "Business Hours",
    description:
      "Your team's staffed hours drive SLA measurement and routing. Outside hours, the AI covers everything; in hours, tickets flow to live agents.",
  },
  "teams-roles": {
    title: "Teams & Roles",
    description:
      'Who can do what. Restricting reassignment prevents the "ticket bounces between agents" failure mode and keeps ownership clear.',
  },
  csat: {
    title: "CSAT",
    description:
      "Post-resolution satisfaction surveys. Scores flow straight into the Analytics module, sliced by agent, workflow, channel, and AI-vs-human.",
  },
};

const validSections = new Set<SectionId>([
  "channels",
  "views",
  "tags-fields",
  "rules-automations",
  "routing-assignment",
  "sla-policies",
  "business-hours",
  "teams-roles",
  "csat",
]);

export function resolveTicketingSettingsSection(value: string | null) {
  return value && validSections.has(value as SectionId)
    ? (value as SectionId)
    : null;
}

export function SettingsCard({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-lg border bg-white shadow-xs",
        className,
      )}
    >
      <div className="flex min-h-14 items-center justify-between gap-3 border-b px-5">
        <h2 className="font-bold text-slate-950">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function InfoCallout({
  tone = "indigo",
  icon = "info",
  children,
}: {
  tone?: "indigo" | "amber";
  icon?: "info" | "warning";
  children: ReactNode;
}) {
  const Icon = icon === "warning" ? IconAlertTriangle : IconInfoCircle;
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm font-medium",
        tone === "amber"
          ? "border-orange-200 bg-orange-50 text-orange-800"
          : "border-indigo-200 bg-indigo-50 text-indigo-700",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <p>{children}</p>
    </div>
  );
}

export function StatusPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-6 items-center gap-1 rounded-full bg-emerald-50 px-3 text-xs font-bold text-emerald-700">
      <span className="size-1.5 rounded-full bg-emerald-600" />
      {children}
    </span>
  );
}

export function FieldBox({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-9 items-center rounded-md border bg-white px-3 text-sm font-medium text-slate-950",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function TableShell({
  columns,
  rows,
}: {
  columns: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-sm">
        <thead>
          <tr className="border-b bg-slate-50 text-left text-xs font-bold uppercase text-slate-400">
            {columns.map((column) => (
              <th key={column} className="px-5 py-3">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b last:border-b-0">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-5 py-4 align-middle font-medium text-slate-700"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SettingsSidebar({ active }: { active: SectionId }) {
  return (
    <aside className="flex min-h-full w-[250px] shrink-0 flex-col border-r bg-white">
      <div className="flex h-[68px] items-center gap-3 border-b px-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 text-sm font-bold text-white">
          S
        </div>
        <div>
          <div className="font-bold text-slate-950">StoreSignal</div>
          <div className="text-xs font-medium text-slate-500">
            Ticketing - Admin
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto p-3">
        {navGroups.map((group) => (
          <section key={group.title}>
            <div className="mb-2 px-2 text-[11px] font-bold uppercase text-slate-400">
              {group.title}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.id;

                return (
                  <Link
                    key={item.id}
                    href={`/helpdesk/settings?section=${item.id}`}
                    className={cn(
                      "flex h-9 items-center gap-3 rounded-md px-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100",
                      isActive && "bg-indigo-50 text-indigo-600",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </nav>
      <Link
        href="/helpdesk"
        className="flex h-10 items-center border-t px-5 text-sm font-medium text-slate-500 hover:text-slate-950"
      >
        Back to inbox
      </Link>
    </aside>
  );
}

export function ToggleLine({
  title,
  detail,
  last,
}: {
  title: string;
  detail?: string;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 border-b py-4",
        last && "border-b-0",
      )}
    >
      <div className="flex-1">
        <div className="font-bold text-slate-950">{title}</div>
        {detail ? <div className="text-sm text-slate-500">{detail}</div> : null}
      </div>
      <Switch defaultChecked />
    </div>
  );
}

function SectionBody({ active }: { active: SectionId }) {
  switch (active) {
    case "views":
      return <ViewsSection />;
    case "tags-fields":
      return <TagsFieldsSection />;
    case "rules-automations":
      return <RulesAutomationsSection />;
    case "routing-assignment":
      return <RoutingAssignmentSection />;
    case "sla-policies":
      return <SlaPoliciesSection />;
    case "business-hours":
      return <BusinessHoursSection />;
    case "teams-roles":
      return <TeamsRolesSection />;
    case "csat":
      return <CsatSection />;
    case "channels":
    default:
      return <ChannelsSection />;
  }
}

export function TicketingSettingsPanel() {
  const searchParams = useSearchParams();
  const active =
    resolveTicketingSettingsSection(searchParams?.get("section") ?? null) ??
    "channels";

  return (
    <div className="-my-4 flex min-h-[calc(100vh-var(--header-height))] overflow-hidden bg-slate-50 text-slate-950 md:-my-6">
      <div className="hidden md:block">
        <SettingsSidebar active={active} />
      </div>
      <TicketingSettingsContent active={active} />
    </div>
  );
}

export function TicketingSettingsContent({ active }: { active: SectionId }) {
  const copy = sectionCopy[active];

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-slate-50">
      {/* <div className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-white px-4 md:px-7">
        <div className="text-sm font-medium text-slate-500">
          <span className="font-bold text-slate-950">{copy.title}</span>
        </div>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
          Save changes
        </Button>
      </div> */}
      <div className="w-full max-w-[1060px] space-y-6 px-4 py-8 md:px-7">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal text-slate-950">
            {copy.title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-slate-700">
            {copy.description}
          </p>
        </div>
        <SectionBody active={active} />
        <div className="sticky bottom-0 z-10 flex justify-end border-t border-border bg-background py-3">
          <Button size="sm">Save changes</Button>
        </div>
      </div>
    </main>
  );
}
