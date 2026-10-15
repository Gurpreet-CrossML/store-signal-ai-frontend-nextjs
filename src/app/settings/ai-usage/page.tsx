import { redirect } from "next/navigation";

// Disabled for now: this screen is switched off. Its
// NAV_AREAS entry is commented out, so rendering it would throw at build time.
// Restore the original below, together with that entry, to turn it back on.
export default function Page() {
  redirect("/");
}

// import AIUsage from "@/clients/ai-usage";
// import { AreaSubPage } from "@/components/custom/area-sub-page";
// import { areaSectionMetadata } from "@/lib/nav-areas";
//
// const HREF = "/settings/ai-usage";
//
// export const metadata = areaSectionMetadata(HREF);
//
// export default function Page() {
//   return (
//     <AreaSubPage href={HREF}>
//       <AIUsage />
//     </AreaSubPage>
//   );
// }
