"use client";

import { CountTabs, type CountTab } from "@/components/custom/count-tabs";
import type {
  CustomerGroup,
  CustomerSummary,
} from "@/redux/api-slice/customer-slice";

/** A tab: every customer, or one group. */
export type CustomerTab = "all" | CustomerGroup;

/** Used for the Lapsed tab's label until the summary arrives. */
const DEFAULT_LAPSED_DAYS = 90;

/** The tabs over the list, each with its store-wide count. */
export function CustomerTabs({
  tab,
  onChange,
  summary,
}: {
  tab: CustomerTab;
  onChange: (tab: CustomerTab) => void;
  summary: CustomerSummary | null;
}) {
  const groups = summary?.groups;
  const lapsedDays = summary?.lapsed_days ?? DEFAULT_LAPSED_DAYS;
  const tabs: CountTab<CustomerTab>[] = [
    { key: "all", label: "All Customers", count: summary?.total },
    { key: "vip", label: "VIP", count: groups?.vip },
    { key: "repeat", label: "Repeat", count: groups?.repeat },
    {
      key: "at_risk",
      label: "At Risk",
      count: groups?.at_risk,
      tone: "danger",
    },
    {
      key: "lapsed",
      label: `Lapsed ${lapsedDays}+ Days`,
      count: groups?.lapsed,
    },
    {
      key: "never_ordered",
      label: "Never Ordered",
      count: groups?.never_ordered,
    },
  ];

  return <CountTabs tabs={tabs} tab={tab} onChange={onChange} />;
}
