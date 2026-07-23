import { Button } from "@/components/ui/button";
import {
  StatusPill,
  TableShell,
  SettingsCard,
  InfoCallout,
} from "../ticketing-settings";
import { cn } from "@/lib/utils";

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

export function TagsFieldsSection() {
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
