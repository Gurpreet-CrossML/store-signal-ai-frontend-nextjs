import CompanyProfileForm from "@/components/custom/company-profile-form";
import SettingsSection from "@/components/custom/settings/settings-section";

export const metadata = {
  title: "General Settings",
};

export default function Page() {
  return (
    <SettingsSection
      title="General"
      description="Your company's contact details, logo, and address. The name and code are managed by the platform operator."
    >
      <CompanyProfileForm />
    </SettingsSection>
  );
}
