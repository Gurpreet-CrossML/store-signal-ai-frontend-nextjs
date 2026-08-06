import SettingsSection from "@/components/custom/settings/settings-section";
import StaffManagement from "@/components/custom/staff-management";

export const metadata = {
  title: "Staff Management",
};

export default function Page() {
  return (
    <SettingsSection
      title="Staff Management"
      description="Manage your company's users. New staff receive an emailed temporary password."
    >
      <StaffManagement />
    </SettingsSection>
  );
}
