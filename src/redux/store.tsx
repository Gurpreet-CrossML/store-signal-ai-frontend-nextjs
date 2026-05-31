import { configureStore } from "@reduxjs/toolkit";
import StoresSlice from "@/redux/api-slice/stores-slice";
import DashboardSlice from "@/redux/api-slice/dashboard-slice";
import ThreadSlice from "@/redux/api-slice/thread-slice";

const store = configureStore({
  reducer: {
    GetStoresReducer: StoresSlice,
    GetDashboardReducer: DashboardSlice,
    GetThreadReducer: ThreadSlice
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
