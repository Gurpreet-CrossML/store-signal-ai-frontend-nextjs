import { TableShell } from "../ticketing-settings";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SettingsCard } from "../ticketing-settings";
import { cn } from "@/lib/utils";

export function TeamsRolesSection() {
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
