import SettingsSection from "@/components/custom/settings/settings-section";
import StoreIntegrationsTabContent from "@/components/custom/store-integrations-tab-content";

export const metadata = {
  title: "Integrations",
};

export default function Page() {
  return (
    <SettingsSection
      title="Integrations"
      description="Connect your store and third-party platforms."
    >
      <StoreIntegrationsTabContent />
    </SettingsSection>
  );
}
