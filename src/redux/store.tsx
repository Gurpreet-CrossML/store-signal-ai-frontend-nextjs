import { configureStore } from "@reduxjs/toolkit";
import StoresSlice from "@/redux/api-slice/stores-slice";
import DashboardSlice from "@/redux/api-slice/dashboard-slice";
import ThreadSlice from "@/redux/api-slice/thread-slice";
import KnowledgeSlice from "@/redux/api-slice/knowledge-slice";
import CustomizationSlice from "@/redux/api-slice/customization-slice";
import TenancySlice from "@/redux/api-slice/tenancy-slice";
import BrandVoiceSlice from "@/redux/api-slice/brand-voice-slice";
import IntegrationSlice from "@/redux/api-slice/integrations-slice";
import SupportTicketsSlice from "@/redux/api-slice/support-ticket-slice";
import SocialAISlice from "@/redux/api-slice/social-ai-slice";
import AIUsageSlice from "@/redux/api-slice/ai-usage-slice";

const store = configureStore({
  reducer: {
    GetStoresReducer: StoresSlice,
    GetDashboardReducer: DashboardSlice,
    GetThreadReducer: ThreadSlice,
    GetKnowledgeReducer: KnowledgeSlice,
    GetCustomizationReducer: CustomizationSlice,
    GetTenancyReducer: TenancySlice,
    GetBrandVoiceReducer: BrandVoiceSlice,
    GetIntegrationReducer: IntegrationSlice,
    GetSupportTicketsReducer: SupportTicketsSlice,
    GetSocialAIReducer: SocialAISlice,
    GetAIUsageReducer: AIUsageSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
