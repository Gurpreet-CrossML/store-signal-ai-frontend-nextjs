import { notFound } from "next/navigation";

import SubPageShell from "@/components/custom/sub-page-shell";
import { isDisabledRoute } from "@/lib/disabled-routes";
import { findAreaSection } from "@/lib/nav-areas";

/**
 * Shell for one screen inside a multi-screen area. It takes only its own
 * href — the heading and description come from NAV_AREAS, so a screen's
 * copy lives in exactly one place.
 */
export function AreaSubPage({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const found = findAreaSection(href);
  if (!found) {
    // Switched off on purpose (see lib/disabled-routes): not a missing
    // registration, and the build still prerenders these pages.
    if (isDisabledRoute(href)) notFound();
    throw new Error(
      `No NAV_AREAS section registered for "${href}" — add it there so the page, its menu card and the sub-sidebar stay in step.`,
    );
  }

  const { section } = found;

  return (
    <SubPageShell
      title={section.title}
      description={section.pageDescription ?? section.description}
    >
      {children}
    </SubPageShell>
  );
}
