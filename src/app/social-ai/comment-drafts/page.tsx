import SocialCommentDrafts from "@/clients/social-comment-drafts";
import { AreaSubPage } from "@/components/custom/area-sub-page";
import { areaSectionMetadata } from "@/lib/nav-areas";

const HREF = "/social-ai/comment-drafts";

export const metadata = areaSectionMetadata(HREF);

export default function Page() {
  return (
    <AreaSubPage href={HREF}>
      <SocialCommentDrafts />
    </AreaSubPage>
  );
}
