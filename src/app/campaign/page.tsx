import { notFound } from "next/navigation";

// Switched off along with its NAV_AREAS entry (see lib/disabled-routes).
// import { AreaLanding } from "@/components/custom/area-landing";
// import { NAV_AREAS } from "@/lib/nav-areas";
//
// export const metadata = {
//   title: NAV_AREAS.campaign.title,
// };

export default function Page() {
  notFound();
  // return <AreaLanding area="campaign" />;
}
