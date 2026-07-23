import { Button } from "@/components/ui/button";
import { TableShell, SettingsCard } from "../ticketing-settings";

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

export function ViewsSection() {
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
