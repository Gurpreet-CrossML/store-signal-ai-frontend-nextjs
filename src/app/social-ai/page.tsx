import { notFound } from "next/navigation";
// import { AreaRedirect } from "@/components/custom/area-redirect";
// import { NAV_AREAS } from "@/lib/nav-areas";

// export const metadata = {
//   title: NAV_AREAS.socialAI.title,
// };

export default function Page() {
  notFound();
  // return <AreaRedirect area="socialAI" />;
}
