import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { axiosInstance } from "@/redux/axios-config";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { ENDPOINTS } from "@/lib/config";

/**
 * Company & staff management (Django `/api/tenancy/`). These are Django-owned
 * auth/provisioning endpoints — not the Drizzle data plane — so GET calls force
 * the Django backend via `useBackend: true` (writes auto-route to Django).
 */

export type CompanyProfile = {
  name: string;
  schema_name: string;
  logo: string | null;
  email: string | null;
  phone: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  is_active: boolean;
};

export type StaffMember = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_staff: boolean;
};

/** Editable company profile fields (name/schema_name/is_active are read-only). */
export type CompanyProfileUpdate = {
  email?: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  logo?: File | null;
};

function errorMessage(error: unknown, fallback: string): string {
  const data = isAxiosError(error) ? error.response?.data : undefined;
  return data?.message || fallback;
}

export const FetchCompanyProfile = createAsyncThunk(
  "tenancy/FetchCompanyProfile",
  async (_: void, thunkAPI) => {
    try {
      const res = await axiosInstance.get(ENDPOINTS.fetchCompanyProfile(), {
        useBackend: true,
      });
      return res.data.data as CompanyProfile;
    } catch (error) {
      toast.error("Uh oh! Something went wrong.", {
        description: errorMessage(error, "Unable to load company profile."),
      });
      return thunkAPI.rejectWithValue(errorMessage(error, "Failed"));
    }
  },
);

export const UpdateCompanyProfile = createAsyncThunk(
  "tenancy/UpdateCompanyProfile",
  async (payload: CompanyProfileUpdate, thunkAPI) => {
    try {
      const { logo, ...fields } = payload;
      let body: FormData | CompanyProfileUpdate;
      let headers: Record<string, string> | undefined;
      // PATCH supports multipart for the logo. Use FormData when uploading a new
      // logo (File) OR removing the current one (logo === null → send an empty
      // value so the backend clears the FileField). Otherwise a plain JSON patch
      // of the text fields, leaving the logo untouched.
      if (logo instanceof File || logo === null) {
        const fd = new FormData();
        Object.entries(fields).forEach(([k, v]) => {
          if (v !== undefined && v !== null) fd.append(k, String(v));
        });
        fd.append("logo", logo ?? "");
        body = fd;
        headers = { "Content-Type": "multipart/form-data" };
      } else {
        body = fields;
      }
      const res = await axiosInstance.patch(
        ENDPOINTS.updateCompanyProfile(),
        body,
        { headers },
      );
      toast.success("Company profile updated.");
      return res.data.data as CompanyProfile;
    } catch (error) {
      toast.error("Uh oh! Something went wrong.", {
        description: errorMessage(error, "Unable to update company profile."),
      });
      return thunkAPI.rejectWithValue(errorMessage(error, "Failed"));
    }
  },
);

export const FetchStaff = createAsyncThunk(
  "tenancy/FetchStaff",
  async (_: void, thunkAPI) => {
    try {
      const res = await axiosInstance.get(ENDPOINTS.fetchStaff(), {
        useBackend: true,
      });
      return res.data.data as StaffMember[];
    } catch (error) {
      toast.error("Uh oh! Something went wrong.", {
        description: errorMessage(error, "Unable to load staff."),
      });
      return thunkAPI.rejectWithValue(errorMessage(error, "Failed"));
    }
  },
);

export const CreateStaff = createAsyncThunk(
  "tenancy/CreateStaff",
  async (
    payload: { first_name: string; last_name: string; email: string },
    thunkAPI,
  ) => {
    try {
      const res = await axiosInstance.post(ENDPOINTS.createStaff(), payload);
      const data = res.data.data as {
        id: number;
        email: string;
        credentials_emailed: boolean;
      };
      toast.success("Staff user created.", {
        description: data.credentials_emailed
          ? `Login credentials were emailed to ${data.email}.`
          : `User created, but the credentials email could not be sent.`,
      });
      return data;
    } catch (error) {
      toast.error("Uh oh! Something went wrong.", {
        description: errorMessage(error, "Unable to create staff user."),
      });
      return thunkAPI.rejectWithValue(errorMessage(error, "Failed"));
    }
  },
);

export const SetStaffActive = createAsyncThunk(
  "tenancy/SetStaffActive",
  async (payload: { id: number; is_active: boolean }, thunkAPI) => {
    try {
      const res = await axiosInstance.patch(ENDPOINTS.updateStaff(payload.id), {
        is_active: payload.is_active,
      });
      toast.success(
        payload.is_active ? "Staff user activated." : "Staff user deactivated.",
      );
      return res.data.data as StaffMember;
    } catch (error) {
      toast.error("Uh oh! Something went wrong.", {
        description: errorMessage(error, "Unable to update staff user."),
      });
      return thunkAPI.rejectWithValue(errorMessage(error, "Failed"));
    }
  },
);

export const ResetStaffPassword = createAsyncThunk(
  "tenancy/ResetStaffPassword",
  async (payload: { id: number; email: string }, thunkAPI) => {
    try {
      const res = await axiosInstance.post(
        ENDPOINTS.resetStaffPassword(payload.id),
        {},
      );
      const data = res.data.data as { credentials_emailed: boolean };
      toast.success("Password reset.", {
        description: data.credentials_emailed
          ? `New credentials were emailed to ${payload.email}.`
          : "Password reset, but the credentials email could not be sent.",
      });
      return data;
    } catch (error) {
      toast.error("Uh oh! Something went wrong.", {
        description: errorMessage(error, "Unable to reset password."),
      });
      return thunkAPI.rejectWithValue(errorMessage(error, "Failed"));
    }
  },
);

export type StoreAccessLevel = "no_access" | "view" | "manage";

export type StoreAccessEntry = {
  store_code: string;
  store_name: string;
  level: StoreAccessLevel;
};

export type StoreAccessData = {
  user_id: number;
  email: string;
  is_staff: boolean;
  stores: StoreAccessEntry[];
};

export const FetchStoreAccess = createAsyncThunk(
  "tenancy/FetchStoreAccess",
  async (userId: number, thunkAPI) => {
    try {
      const res = await axiosInstance.get(ENDPOINTS.fetchStoreAccess(userId), {
        useBackend: true,
      });
      return res.data.data as StoreAccessData;
    } catch (error) {
      toast.error("Uh oh! Something went wrong.", {
        description: errorMessage(error, "Unable to load store access."),
      });
      return thunkAPI.rejectWithValue(errorMessage(error, "Failed"));
    }
  },
);

export const SetStoreAccess = createAsyncThunk(
  "tenancy/SetStoreAccess",
  async (
    payload: { userId: number; storeCode: string; level: StoreAccessLevel },
    thunkAPI,
  ) => {
    try {
      const res = await axiosInstance.put(
        ENDPOINTS.updateStoreAccess(payload.userId, payload.storeCode),
        { level: payload.level },
      );
      return res.data.data as { store_code: string; level: StoreAccessLevel };
    } catch (error) {
      toast.error("Uh oh! Something went wrong.", {
        description: errorMessage(error, "Unable to update store access."),
      });
      return thunkAPI.rejectWithValue(errorMessage(error, "Failed"));
    }
  },
);

type TenancyState = {
  companyProfile: CompanyProfile | null;
  companyLoading: boolean;
  companySaving: boolean;
  staff: StaffMember[];
  staffLoading: boolean;
  staffSaving: boolean;
  storeAccess: StoreAccessData | null;
  storeAccessLoading: boolean;
  storeAccessSavingCode: string | null;
};

const initialState: TenancyState = {
  companyProfile: null,
  companyLoading: false,
  companySaving: false,
  staff: [],
  staffLoading: false,
  staffSaving: false,
  storeAccess: null,
  storeAccessLoading: false,
  storeAccessSavingCode: null,
};

const TenancySlice = createSlice({
  name: "Tenancy",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(FetchCompanyProfile.pending, (state) => {
        state.companyLoading = true;
      })
      .addCase(FetchCompanyProfile.fulfilled, (state, action) => {
        state.companyLoading = false;
        state.companyProfile = action.payload;
      })
      .addCase(FetchCompanyProfile.rejected, (state) => {
        state.companyLoading = false;
      })
      .addCase(UpdateCompanyProfile.pending, (state) => {
        state.companySaving = true;
      })
      .addCase(UpdateCompanyProfile.fulfilled, (state, action) => {
        state.companySaving = false;
        state.companyProfile = action.payload;
      })
      .addCase(UpdateCompanyProfile.rejected, (state) => {
        state.companySaving = false;
      })
      .addCase(FetchStaff.pending, (state) => {
        state.staffLoading = true;
      })
      .addCase(FetchStaff.fulfilled, (state, action) => {
        state.staffLoading = false;
        state.staff = action.payload;
      })
      .addCase(FetchStaff.rejected, (state) => {
        state.staffLoading = false;
      })
      .addCase(SetStaffActive.fulfilled, (state, action) => {
        const idx = state.staff.findIndex((s) => s.id === action.payload.id);
        if (idx !== -1) state.staff[idx] = action.payload;
      })
      .addCase(CreateStaff.pending, (state) => {
        state.staffSaving = true;
      })
      .addCase(CreateStaff.fulfilled, (state) => {
        state.staffSaving = false;
      })
      .addCase(CreateStaff.rejected, (state) => {
        state.staffSaving = false;
      })
      .addCase(FetchStoreAccess.pending, (state) => {
        state.storeAccessLoading = true;
        state.storeAccess = null;
      })
      .addCase(FetchStoreAccess.fulfilled, (state, action) => {
        state.storeAccessLoading = false;
        state.storeAccess = action.payload;
      })
      .addCase(FetchStoreAccess.rejected, (state) => {
        state.storeAccessLoading = false;
      })
      .addCase(SetStoreAccess.pending, (state, action) => {
        state.storeAccessSavingCode = action.meta.arg.storeCode;
      })
      .addCase(SetStoreAccess.fulfilled, (state, action) => {
        state.storeAccessSavingCode = null;
        const entry = state.storeAccess?.stores.find(
          (s) => s.store_code === action.payload.store_code,
        );
        if (entry) entry.level = action.payload.level;
      })
      .addCase(SetStoreAccess.rejected, (state) => {
        state.storeAccessSavingCode = null;
      });
  },
});

export default TenancySlice.reducer;
