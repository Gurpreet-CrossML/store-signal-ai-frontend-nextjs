import SocialCommentHandling from "@/clients/social-comment-handling";
import { AreaSubPage } from "@/components/custom/area-sub-page";
import { areaSectionMetadata } from "@/lib/nav-areas";

const HREF = "/settings/social-ai/comment-handling";

export const metadata = areaSectionMetadata(HREF);

export default function Page() {
  return (
    <AreaSubPage href={HREF}>
      <SocialCommentHandling />
    </AreaSubPage>
  );
}
