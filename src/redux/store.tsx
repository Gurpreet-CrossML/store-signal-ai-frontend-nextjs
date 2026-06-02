import { configureStore } from "@reduxjs/toolkit";
import StoresSlice from "@/redux/api-slice/stores-slice";
import DashboardSlice from "@/redux/api-slice/dashboard-slice";
import ThreadSlice from "@/redux/api-slice/thread-slice";
import KnowledgeSlice from "@/redux/api-slice/knowledge-slice";
import CustomizationSlice from "@/redux/api-slice/customization-slice";

const store = configureStore({
  reducer: {
    GetStoresReducer: StoresSlice,
    GetDashboardReducer: DashboardSlice,
    GetThreadReducer: ThreadSlice,
    GetKnowledgeReducer: KnowledgeSlice,
    GetCustomizationReducer: CustomizationSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
