"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  IconAlertTriangle,
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandWhatsapp,
  IconCalendar,
  IconChevronDown,
  IconClock,
  IconDeviceMobileMessage,
  IconInfoCircle,
  IconLink,
  IconMail,
  IconMicrophone,
  IconRoute,
  IconSettingsAutomation,
  IconStar,
  IconTag,
  IconTextSize,
  IconUsers,
  IconWebhook,
} from "@tabler/icons-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

const channelRows = [
  {
    label: "Email",
    detail: "support@motherandbaby.ie",
    icon: IconMail,
    color: "bg-orange-500",
    connected: true,
  },
  {
    label: "Web chat widget",
    detail: "Installed on motherandbaby.ie",
    icon: IconWebhook,
    color: "bg-indigo-600",
    connected: true,
  },
  {
    label: "WhatsApp Business",
    detail: "+353 1 555 0192",
    icon: IconBrandWhatsapp,
    color: "bg-emerald-500",
    connected: true,
  },
  {
    label: "Instagram",
    detail: "@motherandbaby.ie - DMs & comments",
    icon: IconBrandInstagram,
    color: "bg-pink-600",
    connected: true,
  },
  {
    label: "Facebook",
    detail: "Messenger & comments",
    icon: IconBrandFacebook,
    color: "bg-blue-600",
    connected: true,
  },
  {
    label: "SMS",
    detail: "Connect a number",
    icon: IconDeviceMobileMessage,
    color: "bg-slate-500",
    connected: false,
  },
  {
    label: "Voice",
    detail: "AI phone support - your differentiator",
    icon: IconMicrophone,
    color: "bg-cyan-600",
    connected: false,
  },
];

const views = [
  ["All open", "state: open", "Everyone", "34"],
  ["Unassigned", "state: open - assignee: none", "Everyone", "9"],
  [
    "Urgent + breaching SLA",
    "priority: urgent - SLA: at-risk",
    "Everyone",
    "4",
  ],
  ["VIP customers", "customer: VIP", "Support, VIP", "3"],
  [
    "Returns - waiting on customer",
    "tag: returns - state: pending",
    "Returns team",
    "6",
  ],
  ["AI-handled today", "ai_status: resolved - today", "Everyone", "218"],
  ["My mentions", "@me in notes", "Personal", "2"],
];

const tags = [
  ["WISMO", "cyan"],
  ["Returns", "orange"],
  ["Refund", "red"],
  ["Order Cancel", "violet"],
  ["Product Query", "indigo"],
  ["Complaint", "red"],
  ["Shipping", "cyan"],
  ["Sizing", "orange"],
  ["B2B / Wholesale", "green"],
  ["Subscription", "indigo"],
  ["Damaged", "red"],
  ["Discount", "green"],
] as const;

const customFields = [
  ["Return reason", "Select", "Ticket", "Rules, Views"],
  ["Order value band", "Select", "Ticket", "Routing"],
  ["Customer segment", "Select", "Customer", "VIP routing, SLA"],
  ["Warranty status", "Boolean", "Ticket", "Macros"],
];

const rules = [
  ["Auto-route returns to Returns team", "Ticket created", "1,240"],
  ["Send tracking + close for WISMO", "Ticket created", "3,180"],
  ["Auto-close thank-you messages", "Message received", "890"],
  ["Escalate negative sentiment", "Message received", "142"],
  ["Follow up non-responders (48h)", "Time elapses", "410"],
  ["VIP -> priority + VIP SLA", "Ticket created", "86"],
  ["Out-of-hours -> AI only", "Ticket created", "2,020"],
];

const routingRules = [
  ["Language is Hindi", "Hindi support inbox", "1"],
  ['Keyword "wholesale" or "bulk"', "B2B team", "2"],
  ["Customer LTV > EUR1,000", "VIP team", "3"],
  ["Tag is Complaint", "Senior agents", "4"],
  ["Channel is WhatsApp", "Chat team", "5"],
];

const businessHours = [
  ["Monday", "9:00 AM", "6:00 PM", true],
  ["Tuesday", "9:00 AM", "6:00 PM", true],
  ["Wednesday", "9:00 AM", "6:00 PM", true],
  ["Thursday", "9:00 AM", "6:00 PM", true],
  ["Friday", "9:00 AM", "5:00 PM", true],
  ["Saturday", "10:00 AM", "2:00 PM", true],
  ["Sunday", "Closed - AI covers", "", false],
] as const;

function SettingsCard({
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

function InfoCallout({
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

function StatusPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-6 items-center gap-1 rounded-full bg-emerald-50 px-3 text-xs font-bold text-emerald-700">
      <span className="size-1.5 rounded-full bg-emerald-600" />
      {children}
    </span>
  );
}

function FieldBox({
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

function TableShell({
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

function ChannelsSection() {
  return (
    <div className="space-y-4">
      <SettingsCard title="Connected channels">
        <div>
          {channelRows.map((channel) => {
            const Icon = channel.icon;
            return (
              <div
                key={channel.label}
                className="flex items-center gap-4 border-b px-5 py-4 last:border-b-0"
              >
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-lg text-white",
                    channel.color,
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-950">
                    {channel.label}
                  </div>
                  <div className="truncate text-xs font-medium text-slate-500">
                    {channel.detail}
                  </div>
                </div>
                {channel.connected ? (
                  <StatusPill>Connected</StatusPill>
                ) : (
                  <Button variant="outline" size="sm" className="bg-white">
                    Connect
                  </Button>
                )}
                <Switch defaultChecked={channel.connected} />
              </div>
            );
          })}
        </div>
      </SettingsCard>
      <InfoCallout>
        WhatsApp and Instagram are first-class here - your edge for India, APAC,
        and MEA where these are the primary support channels.
      </InfoCallout>
    </div>
  );
}

function ViewsSection() {
  return (
    <SettingsCard
      title="Team views"
      action={
        <Button variant="outline" size="sm" className="bg-white">
          + New view
        </Button>
      }
    >
      <TableShell
        columns={["View", "Filters", "Shared with", "Tickets"]}
        rows={views.map(([view, filters, shared, tickets]) => [
          <span key="view" className="font-bold text-slate-950">
            {view}
          </span>,
          <code key="filters" className="text-xs text-slate-700">
            {filters}
          </code>,
          shared,
          <span
            key="tickets"
            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500"
          >
            {tickets}
          </span>,
        ])}
      />
    </SettingsCard>
  );
}

function TagsFieldsSection() {
  return (
    <div className="space-y-4">
      <InfoCallout tone="amber" icon="warning">
        <b>Governance on by default.</b> Agents apply tags from this list but
        cannot invent new ones - the #1 cause of messy analytics in Georgias.
        Admins manage the taxonomy here.
      </InfoCallout>
      <SettingsCard
        title="Ticket tags (governed)"
        action={<StatusPill>Locked taxonomy</StatusPill>}
      >
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap gap-2">
            {tags.map(([tag, color]) => (
              <span
                key={tag}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-bold",
                  color === "red" && "bg-red-50 text-red-600",
                  color === "orange" && "bg-orange-50 text-orange-600",
                  color === "cyan" && "bg-cyan-50 text-cyan-700",
                  color === "violet" && "bg-violet-50 text-violet-700",
                  color === "indigo" && "bg-indigo-50 text-indigo-700",
                  color === "green" && "bg-emerald-50 text-emerald-700",
                )}
              >
                {tag} x
              </span>
            ))}
          </div>
          <Button variant="outline" size="sm" className="bg-white">
            + Add tag to taxonomy
          </Button>
        </div>
      </SettingsCard>
      <SettingsCard title="Custom fields">
        <TableShell
          columns={["Field", "Type", "Applies to", "Used in"]}
          rows={customFields.map(([field, type, appliesTo, usedIn]) => [
            <span key="field" className="font-bold text-slate-950">
              {field}
            </span>,
            type,
            appliesTo,
            usedIn,
          ])}
        />
      </SettingsCard>
    </div>
  );
}

function RulesAutomationsSection() {
  return (
    <div className="space-y-4">
      <InfoCallout>
        A resolving rule (send tracking + close) beats an acknowledging one
        (send &quot;we got your message&quot; - which still leaves the ticket
        open).
      </InfoCallout>
      <SettingsCard
        title="Active rules"
        action={
          <div className="flex gap-2">
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">
              7 active
            </span>
            <Button variant="outline" size="sm" className="bg-white">
              + New rule
            </Button>
          </div>
        }
      >
        <TableShell
          columns={["Rule", "Trigger", "Runs", ""]}
          rows={rules.map(([rule, trigger, runs]) => [
            <span key="rule" className="font-bold text-slate-950">
              {rule}
            </span>,
            trigger,
            <span key="runs" className="font-bold text-slate-500">
              {runs}x
            </span>,
            <Switch key="switch" defaultChecked className="bg-emerald-600" />,
          ])}
        />
      </SettingsCard>
      <SettingsCard title="Editing: Auto-route returns to Returns team">
        <div className="space-y-3 p-5">
          <RuleBlock label="When" tone="indigo">
            <FieldBox>
              A ticket is created{" "}
              <IconChevronDown className="ml-auto size-4 text-slate-400" />
            </FieldBox>
          </RuleBlock>
          <RuleBlock label="If all of these match" tone="amber">
            <div className="grid gap-2 md:grid-cols-[1fr_90px_1fr]">
              <FieldBox>Detected intent</FieldBox>
              <FieldBox>is</FieldBox>
              <FieldBox>Returns</FieldBox>
              <FieldBox>Channel</FieldBox>
              <FieldBox>is any</FieldBox>
              <FieldBox>email, chat, whatsapp</FieldBox>
            </div>
            <Button variant="link" size="sm" className="px-0 text-indigo-600">
              + Add condition
            </Button>
          </RuleBlock>
          <RuleBlock label="Then do" tone="green">
            <div className="grid gap-2 md:grid-cols-2">
              <FieldBox>
                Assign to team{" "}
                <IconChevronDown className="ml-auto size-4 text-slate-400" />
              </FieldBox>
              <FieldBox>Returns team</FieldBox>
              <FieldBox>
                Apply SLA{" "}
                <IconChevronDown className="ml-auto size-4 text-slate-400" />
              </FieldBox>
              <FieldBox>Standard - 4h first response</FieldBox>
            </div>
            <Button variant="link" size="sm" className="px-0 text-indigo-600">
              + Add action
            </Button>
          </RuleBlock>
        </div>
      </SettingsCard>
    </div>
  );
}

function RuleBlock({
  label,
  tone,
  children,
}: {
  label: string;
  tone: "indigo" | "amber" | "green";
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-slate-50 p-4">
      <div
        className={cn(
          "mb-3 inline-flex rounded-md px-2 py-1 text-xs font-black uppercase",
          tone === "indigo" && "bg-indigo-50 text-indigo-600",
          tone === "amber" && "bg-orange-50 text-orange-600",
          tone === "green" && "bg-emerald-50 text-emerald-700",
        )}
      >
        {label}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function RoutingAssignmentSection() {
  const [assignmentMethod, setAssignmentMethod] = useState<
    "balanced" | "round-robin"
  >("balanced");

  return (
    <div className="space-y-4">
      <SettingsCard title="Assignment method">
        <div className="space-y-5 p-5">
          <div className="grid gap-3 md:grid-cols-2">
            <div
              role="button"
              tabIndex={0}
              className={cn(
                "flex items-center gap-4 rounded-lg border p-4 text-left transition",
                assignmentMethod === "balanced"
                  ? "border-indigo-500 bg-indigo-50"
                  : "bg-white hover:bg-slate-50",
              )}
              onClick={() => setAssignmentMethod("balanced")}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  setAssignmentMethod("balanced");
                }
              }}
            >
              <div className="flex-1">
                <div className="font-bold text-slate-950">
                  Balanced{" "}
                  <span className="ml-3 text-xs text-indigo-600">
                    Recommended
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Routes to the most available and relevant teammate, respecting
                  limits
                </p>
              </div>
              <Switch
                checked={assignmentMethod === "balanced"}
                onCheckedChange={() => setAssignmentMethod("balanced")}
              />
            </div>
            <div
              role="button"
              tabIndex={0}
              className={cn(
                "flex items-center gap-4 rounded-lg border p-4 text-left transition",
                assignmentMethod === "round-robin"
                  ? "border-indigo-500 bg-indigo-50"
                  : "bg-white hover:bg-slate-50",
              )}
              onClick={() => setAssignmentMethod("round-robin")}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  setAssignmentMethod("round-robin");
                }
              }}
            >
              <div className="flex-1">
                <div className="font-bold text-slate-950">Round-robin</div>
                <p className="mt-1 text-sm text-slate-500">
                  Even distribution in turn, regardless of current load
                </p>
              </div>
              <Switch
                checked={assignmentMethod === "round-robin"}
                onCheckedChange={() => setAssignmentMethod("round-robin")}
              />
            </div>
          </div>
          <div className="flex items-center gap-4 border-b pb-4">
            <div className="flex-1">
              <div className="font-bold text-slate-950">
                Per-agent concurrency limit
              </div>
              <p className="text-sm text-slate-500">
                Max open conversations an agent holds at once - the guardrail
                that prevents burying
              </p>
            </div>
            <FieldBox className="w-16 justify-center">3</FieldBox>
            <span className="text-sm text-slate-500">tickets</span>
          </div>
          <ToggleLine
            title="Skip agents who are away"
            detail="Only route to Available agents"
          />
        </div>
      </SettingsCard>
      <SettingsCard
        title="Assignment rules (attribute - keyword - language)"
        action={
          <Button variant="outline" size="sm" className="bg-white">
            + New
          </Button>
        }
      >
        <TableShell
          columns={["If", "Route to", "Priority"]}
          rows={routingRules.map(([condition, route, priority]) => [
            <span key="condition" className="font-bold text-slate-950">
              {condition}
            </span>,
            route,
            <span
              key="priority"
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500"
            >
              {priority}
            </span>,
          ])}
        />
      </SettingsCard>
      <InfoCallout>
        Language-based routing is a genuine edge for your multilingual markets -
        send Hindi and regional-language speakers straight to matching-language
        agents.
      </InfoCallout>
    </div>
  );
}

function SlaPoliciesSection() {
  const policies = [
    [
      "VIP",
      "Applies when: customer is VIP or LTV > EUR1,000",
      "15m first response - 2h resolution",
      "red",
    ],
    [
      "Urgent / Complaint",
      "Applies when: priority Urgent or tag Complaint",
      "30m first response - 4h resolution",
      "orange",
    ],
    [
      "Standard",
      "Applies when: everything else",
      "4h first response - 24h resolution",
      "indigo",
    ],
  ];

  return (
    <div className="space-y-4">
      <InfoCallout tone="amber" icon="warning">
        <b>The detail that makes SLAs honest:</b> timers PAUSE on
        &quot;Pending&quot; (waiting on customer) and &quot;Snoozed&quot;, and
        resume when they reply. Never count customer-wait time against your
        target.
      </InfoCallout>
      <SettingsCard
        title="Policies"
        action={
          <Button variant="outline" size="sm" className="bg-white">
            + New policy
          </Button>
        }
      >
        <div className="space-y-3 p-5">
          {policies.map(([name, detail, target, color]) => (
            <div
              key={name}
              className="flex items-center gap-4 rounded-lg border px-4 py-3"
            >
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-lg",
                  color === "red" && "bg-red-50 text-red-500",
                  color === "orange" && "bg-orange-50 text-orange-500",
                  color === "indigo" && "bg-indigo-50 text-indigo-600",
                )}
              >
                {color === "red" ? (
                  <IconStar className="size-5" />
                ) : (
                  <IconClock className="size-5" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-bold text-slate-950">{name}</div>
                <div className="text-xs font-medium text-slate-500">
                  {detail}
                </div>
              </div>
              <div className="text-sm font-bold text-slate-950">{target}</div>
            </div>
          ))}
        </div>
      </SettingsCard>
      <SettingsCard title="Pausing & escalation">
        <div className="p-5">
          <ToggleLine
            title='Pause on "Waiting on customer"'
            detail="Stops the clock while the ball is in the customer's court"
          />
          <ToggleLine title='Pause on "Snoozed"' />
          <ToggleLine
            title="Measure against business hours only"
            detail="Do not count nights and weekends against targets"
          />
          <ToggleLine
            title="Escalate at 80% of target"
            detail="Raise priority, reassign to a lead, and notify - before the breach, not after"
            last
          />
        </div>
      </SettingsCard>
    </div>
  );
}

function BusinessHoursSection() {
  return (
    <div className="space-y-4">
      <SettingsCard
        title="Support hours"
        action={
          <Button variant="outline" className="bg-white">
            Europe/Dublin (GMT) <IconChevronDown className="size-4" />
          </Button>
        }
      >
        <div className="p-5">
          {businessHours.map(([day, start, end, enabled]) => (
            <div
              key={day}
              className="grid grid-cols-[110px_1fr_auto] items-center gap-4 border-b py-3 last:border-b-0"
            >
              <div className="font-bold text-slate-950">{day}</div>
              {enabled ? (
                <div className="flex flex-wrap items-center gap-2">
                  <FieldBox className="w-28">{start}</FieldBox>
                  <span className="text-slate-500">to</span>
                  <FieldBox className="w-28">{end}</FieldBox>
                </div>
              ) : (
                <div className="text-sm font-medium text-slate-500">
                  {start}
                </div>
              )}
              <Switch defaultChecked={enabled} />
            </div>
          ))}
        </div>
      </SettingsCard>
      <SettingsCard title="Out-of-hours routing">
        <div className="p-5">
          <ToggleLine
            title="Let AI handle everything out of hours"
            detail="24/7 coverage - the AI resolves what it can, queues the rest for morning"
          />
          <ToggleLine
            title="Show customers your reply time"
            detail='"Our team is back at 9am - I can still help right now"'
            last
          />
        </div>
      </SettingsCard>
    </div>
  );
}

function TeamsRolesSection() {
  const members = [
    ["Daniel Dowling", "Admin - Founder", "DD", "bg-fuchsia-600"],
    ["Aoife Byrne", "Lead - Returns", "AB", "bg-cyan-600"],
    ["Sean McCarthy", "Agent - Support", "SM", "bg-orange-600"],
    ["Priya Nair", "Agent - Hindi/English", "PN", "bg-indigo-600"],
  ];
  const teams = [
    ["Support", "4", "General, WISMO, Product", "Standard"],
    ["Returns", "2", "Returns, Refunds, Exchanges", "Standard"],
    ["VIP", "2", "VIP customers, high LTV", "VIP (15m)"],
    ["B2B", "1", "Wholesale, bulk quotes", "Standard"],
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <SettingsCard
          title="Members"
          action={
            <Button variant="outline" size="sm" className="bg-white">
              + Invite
            </Button>
          }
        >
          <div>
            {members.map(([name, role, initials, color]) => (
              <div
                key={name}
                className="flex items-center gap-3 border-b px-5 py-4 last:border-b-0"
              >
                <Avatar className="size-9">
                  <AvatarFallback
                    className={cn("text-xs font-bold text-white", color)}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-bold text-slate-950">{name}</div>
                  <div className="text-xs font-medium text-slate-500">
                    {role}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="bg-white">
                  Edit
                </Button>
              </div>
            ))}
          </div>
        </SettingsCard>
        <SettingsCard title="Role permissions">
          <div className="p-5">
            {[
              ["Agent", "Reply, tag, snooze, resolve, apply macros", "Base"],
              [
                "Lead",
                "+ Reassign, configure macros & views, manage the team queue",
                "Elevated",
              ],
              [
                "Admin",
                "+ Rules, routing, SLAs, roles, and high-value action limits",
                "Full",
              ],
            ].map(([role, detail, badge]) => (
              <div
                key={role}
                className="flex items-center gap-4 border-b py-4 last:border-b-0"
              >
                <div className="flex-1">
                  <div className="font-bold text-slate-950">{role}</div>
                  <div className="text-sm text-slate-500">{detail}</div>
                </div>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">
                  {badge}
                </span>
              </div>
            ))}
          </div>
        </SettingsCard>
      </div>
      <SettingsCard title="Teams & their inboxes">
        <TableShell
          columns={["Team", "Members", "Handles", "SLA"]}
          rows={teams.map(([team, membersCount, handles, sla]) => [
            <span key="team" className="font-bold text-slate-950">
              {team}
            </span>,
            membersCount,
            handles,
            sla,
          ])}
        />
      </SettingsCard>
    </div>
  );
}

function CsatSection() {
  return (
    <div className="space-y-4">
      <SettingsCard title="Survey settings">
        <div className="p-5">
          <ToggleLine title="Send CSAT survey on resolve" />
          <ToggleLine
            title="Also survey AI-resolved tickets"
            detail="Measure the AI's quality the same way you measure agents"
          />
          <div className="flex items-center border-b py-4">
            <div className="flex-1 font-bold text-slate-950">
              Channels to survey
            </div>
            <div className="text-sm font-medium text-slate-700">
              Email, Web chat, WhatsApp
            </div>
          </div>
          <div className="flex items-center py-4">
            <div className="flex-1 font-bold text-slate-950">
              Survey delay after resolve
            </div>
            <Button variant="outline" className="bg-white">
              After 10 minutes <IconChevronDown className="size-4" />
            </Button>
          </div>
        </div>
      </SettingsCard>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["4.6", "Avg CSAT (30d)", "text-emerald-600"],
          ["92%", "Positive (4-5 star)", "text-indigo-600"],
          ["4.5", "AI-resolved CSAT", "text-teal-600"],
        ].map(([value, label, color]) => (
          <div
            key={label}
            className="rounded-lg border bg-white p-6 text-center shadow-xs"
          >
            <div className={cn("text-3xl font-black", color)}>{value}</div>
            <div className="mt-2 text-xs font-bold text-slate-500">{label}</div>
          </div>
        ))}
      </div>
      <InfoCallout>
        Full CSAT breakdowns by agent, workflow, and channel live in the
        Analytics & Intent Insights module - this feeds it directly.
      </InfoCallout>
    </div>
  );
}

function ToggleLine({
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
          <h1 className="text-2xl font-black tracking-normal text-slate-950">
            {copy.title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-slate-700">
            {copy.description}
          </p>
        </div>
        <SectionBody active={active} />
        <div className="sticky bottom-0 z-10 flex justify-end border-t border-border bg-background py-3">
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
            Save changes
          </Button>
        </div>
      </div>
    </main>
  );
}
