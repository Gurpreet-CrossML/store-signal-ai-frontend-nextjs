import { Suspense } from "react";

import { AccessGate } from "@/components/custom/access-gate";
import { MetaOAuthPopupResult } from "@/components/custom/settings/social-ai/meta-oauth-popup-result";

/**
 * Store setup gate (owner and manager) for every settings route, menu page
 * included. Held here rather than in each page so a new settings screen is
 * gated by existing, not by remembering to wrap it. Owner-only screens
 * (General, AI Usage) add their own gate.
 */
export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AccessGate permission="setup">
      {/* useSearchParams needs a Suspense boundary for static prerender. */}
      <Suspense fallback={null}>
        <MetaOAuthPopupResult />
      </Suspense>
      {children}
    </AccessGate>
  );
}
