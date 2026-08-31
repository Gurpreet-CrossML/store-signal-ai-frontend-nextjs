import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import { ENDPOINTS } from "@/lib/config";
import { axiosInstance } from "../axios-config";

// Login itself is NextAuth's (credentials provider → ENDPOINTS.login on the
// server); this slice is the public, pre-session part of auth only.

export type RegisterCompanyPayload = {
  name: string;
  user_data: { first_name: string; last_name: string; email: string };
  terms_and_conditions_accepted: boolean;
};

export type RegisteredCompany = {
  id: number;
  name: string;
  /** Permanent company identifier, derived from `name`. */
  code: string;
  admin_email: string;
  /**
   * False means the account exists but the password email failed — point
   * the user at "Forgot password?" / support rather than their inbox.
   */
  credentials_emailed: boolean;
};

export const RegisterCompany = createAsyncThunk(
  "RegisterCompany",
  async (payload: RegisterCompanyPayload, thunkAPI) => {
    try {
      const response = await axiosInstance.post(
        ENDPOINTS.registerCompany(),
        payload,
      );
      return response.data.data as RegisteredCompany;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Couldn't create your account", {
        description: data?.message || "Unable to register the company.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

const AuthSlice = createSlice({
  name: "Auth",
  initialState: {
    RegisterCompanyState: {
      RegisterCompanyIsLoading: false,
      RegisterCompanyIsSuccess: false,
      RegisterCompanyIsError: null as null | string | object,
      RegisterCompanyData: null as RegisteredCompany | null,
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(RegisterCompany.pending, (state) => {
        state.RegisterCompanyState.RegisterCompanyIsLoading = true;
        state.RegisterCompanyState.RegisterCompanyIsSuccess = false;
        state.RegisterCompanyState.RegisterCompanyIsError = null;
      })
      .addCase(RegisterCompany.fulfilled, (state, action) => {
        state.RegisterCompanyState.RegisterCompanyIsLoading = false;
        state.RegisterCompanyState.RegisterCompanyIsSuccess = true;
        state.RegisterCompanyState.RegisterCompanyData = action.payload;
      })
      .addCase(RegisterCompany.rejected, (state, action) => {
        state.RegisterCompanyState.RegisterCompanyIsLoading = false;
        state.RegisterCompanyState.RegisterCompanyIsError = action.payload as
          | string
          | object;
      });
  },
});

export default AuthSlice.reducer;
