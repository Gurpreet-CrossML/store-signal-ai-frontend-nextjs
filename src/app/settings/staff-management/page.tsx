import { redirect } from "next/navigation";

// Disabled for now: this screen is switched off. Its
// NAV_AREAS entry is commented out, so rendering it would throw at build time.
// Restore the original below, together with that entry, to turn it back on.
export default function Page() {
  redirect("/");
}

// import StaffManagement from "@/components/custom/staff-management";
// import { AreaSubPage } from "@/components/custom/area-sub-page";
// import { areaSectionMetadata } from "@/lib/nav-areas";
//
// const HREF = "/settings/staff-management";
//
// export const metadata = areaSectionMetadata(HREF);
//
// export default function Page() {
//   return (
//     <AreaSubPage href={HREF}>
//       <StaffManagement />
//     </AreaSubPage>
//   );
// }
