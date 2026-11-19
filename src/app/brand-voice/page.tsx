import { AreaRedirect } from "@/components/custom/area-redirect";
import { NAV_AREAS } from "@/lib/nav-areas";

export const metadata = {
  title: NAV_AREAS.brandVoice.title,
};

export default function Page() {
  // No menu page: the sidebar already lists the screens.
  return <AreaRedirect area="brandVoice" />;
}
