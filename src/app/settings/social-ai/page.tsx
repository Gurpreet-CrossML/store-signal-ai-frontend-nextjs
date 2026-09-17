import { redirect } from "next/navigation";

/**
 * Social AI has no screen of its own — it is a heading over three.
 *
 * The sub-sidebar renders it as a collapsible trigger rather than a link,
 * so this path is only reached by typing it or by an older bookmark, of
 * which there are plenty: the connected-accounts table lived here until it
 * moved down a level to make room for its siblings. Land on it rather than
 * a blank page.
 */
export default function Page() {
  redirect("/settings/social-ai/accounts");
}
