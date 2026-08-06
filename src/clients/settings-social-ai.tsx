"use client";

import SocialAITabContent from "@/components/custom/settings/social-ai/store-social-ai-tab-content";
import { useAppSelector } from "@/redux/hooks";

/** Client wrapper: SocialAITabContent needs the selected store from Redux. */
export default function SettingsSocialAI() {
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );

  return <SocialAITabContent storeCode={storeCode} />;
}
