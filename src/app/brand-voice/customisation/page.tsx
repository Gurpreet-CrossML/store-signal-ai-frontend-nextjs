import Customization from "@/clients/customization";
import SubPageShell from "@/components/custom/sub-page-shell";

export const metadata = {
  title: "Widget Customisation",
};

export default function Page() {
  return (
    <SubPageShell
      backHref="/brand-voice"
      backLabel="Back to brand voice"
      title="Widget Customisation"
      description="How the chat widget looks on your storefront — colors, branding, messages, and quick links."
    >
      <Customization />
    </SubPageShell>
  );
}
