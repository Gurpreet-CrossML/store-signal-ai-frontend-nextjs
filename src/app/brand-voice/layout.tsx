import BrandVoiceTabsNav from "@/components/custom/brand-voice-tabs-nav";

export default function BrandVoiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <BrandVoiceTabsNav />
      {children}
    </div>
  );
}
