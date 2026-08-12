import { AreaLanding } from "@/components/custom/area-landing";
import { NAV_AREAS } from "@/lib/nav-areas";

export const metadata = {
  title: NAV_AREAS.brandVoice.title,
};

export default function Page() {
  return <AreaLanding area="brandVoice" />;
}
