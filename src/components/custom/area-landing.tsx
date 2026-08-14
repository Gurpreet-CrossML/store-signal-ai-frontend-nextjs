import { PageHeading } from "@/components/custom/page-heading";
import { SectionNav } from "@/components/custom/section-nav";
import { NAV_AREAS, type NavAreaKey } from "@/lib/nav-areas";

/**
 * The menu page for a multi-screen area. Everything shown comes from
 * NAV_AREAS, so the landing page and the sub-sidebar can't disagree.
 */
export function AreaLanding({ area }: { area: NavAreaKey }) {
  const { title, description, sections } = NAV_AREAS[area];

  return (
    <div className="flex flex-col gap-6 p-4">
      <PageHeading title={title} description={description} />
      <SectionNav items={[...sections]} ariaLabel={`${title} sections`} />
    </div>
  );
}
