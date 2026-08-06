import SettingsSection from "@/components/custom/settings/settings-section";
import SettingsSocialAI from "@/clients/settings-social-ai";

export const metadata = {
  title: "Social AI Settings",
};

export default function Page() {
  return (
    <SettingsSection
      title="Social AI"
      description="Manage the Facebook and Instagram accounts connected to Store Signal AI."
    >
      <SettingsSocialAI />
    </SettingsSection>
  );
}
