import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { axiosInstance } from "../axios-config";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { ENDPOINTS } from "@/lib/config";

export type SelfReference = "i" | "we";
export type RequiredLegalPhrase = { context: string; phrase: string };

export type PersonaIdentityData = {
  name: string;
  role_description: string;
  self_reference: SelfReference;
  email_signature: string;
  backstory: string;
  created_at: string;
  updated_at: string;
};

export type NeverSayRulesData = {
  no_hollow_apologies: boolean;
  never_reveal_ai_unprompted: boolean;
  do_not_say_phrases: string[];
  forbidden_claims: string[];
  required_legal_phrases: RequiredLegalPhrase[];
  created_at: string;
  updated_at: string;
};

export const fetchPersonaIdentity = createAsyncThunk(
  "fetchPersonaIdentity",
  async (storeCode: string, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.personaIdentity()}?store_code=${storeCode}`,
      );
      const data = response.data.data;

      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to fetch persona identity, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const CreatePersonaIdentity = createAsyncThunk(
  "CreatePersonaIdentity",
  async (
    { storeCode, payload }: { storeCode: string; payload: PersonaIdentityData },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(
        `${ENDPOINTS.personaIdentity()}?store_code=${storeCode}`,
        payload,
      );
      const data = response.data.data;

      toast.success(
        response?.data?.message || "Persona identity saved successfully!",
      );

      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to save persona identity, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const fetchNeverSayRules = createAsyncThunk(
  "fetchNeverSayRules",
  async (storeCode: string, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.neverSayRules()}?store_code=${storeCode}`,
      );
      const data = response.data.data;

      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to fetch never-say rules, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const CreateNeverSayRules = createAsyncThunk(
  "CreateNeverSayRules",
  async (
    { storeCode, payload }: { storeCode: string; payload: NeverSayRulesData },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(
        `${ENDPOINTS.neverSayRules()}?store_code=${storeCode}`,
        payload,
      );
      const data = response.data.data;

      toast.success(
        response?.data?.message || "Never-say rules saved successfully!",
      );

      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to save never-say rules, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

const brandVoiceSlice = createSlice({
  name: "brandVoice",
  initialState: {
    FetchPersonaIdentityState: {
      FetchPersonaIdentityIsLoading: false,
      FetchPersonaIdentityIsSuccess: false,
      FetchPersonaIdentityIsError: null as null | string | object,
      FetchPersonaIdentityData: null as PersonaIdentityData | null,
    },
    CreatePersonaIdentityState: {
      CreatePersonaIdentityIsLoading: false,
      CreatePersonaIdentityIsSuccess: false,
      CreatePersonaIdentityIsError: null as null | string | object,
      CreatePersonaIdentityData: null as PersonaIdentityData | null,
    },
    FetchNeverSayRulesState: {
      FetchNeverSayRulesIsLoading: false,
      FetchNeverSayRulesIsSuccess: false,
      FetchNeverSayRulesIsError: null as null | string | object,
      FetchNeverSayRulesData: null as NeverSayRulesData | null,
    },
    CreateNeverSayRulesState: {
      CreateNeverSayRulesIsLoading: false,
      CreateNeverSayRulesIsSuccess: false,
      CreateNeverSayRulesIsError: null as null | string | object,
      CreateNeverSayRulesData: null as NeverSayRulesData | null,
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPersonaIdentity.pending, (state) => {
        state.FetchPersonaIdentityState.FetchPersonaIdentityIsLoading = true;
        state.FetchPersonaIdentityState.FetchPersonaIdentityIsError = null;
        state.FetchPersonaIdentityState.FetchPersonaIdentityIsSuccess = false;
      })
      .addCase(fetchPersonaIdentity.fulfilled, (state, action) => {
        state.FetchPersonaIdentityState.FetchPersonaIdentityIsLoading = false;
        state.FetchPersonaIdentityState.FetchPersonaIdentityData =
          action.payload;
        state.FetchPersonaIdentityState.FetchPersonaIdentityIsSuccess = true;
      })
      .addCase(fetchPersonaIdentity.rejected, (state, action) => {
        state.FetchPersonaIdentityState.FetchPersonaIdentityIsLoading = false;
        state.FetchPersonaIdentityState.FetchPersonaIdentityIsError =
          action.payload as string | object;
        state.FetchPersonaIdentityState.FetchPersonaIdentityIsSuccess = false;
      })
      .addCase(CreatePersonaIdentity.pending, (state) => {
        state.CreatePersonaIdentityState.CreatePersonaIdentityIsLoading = true;
        state.CreatePersonaIdentityState.CreatePersonaIdentityIsError = null;
        state.CreatePersonaIdentityState.CreatePersonaIdentityIsSuccess = false;
      })
      .addCase(CreatePersonaIdentity.fulfilled, (state, action) => {
        state.CreatePersonaIdentityState.CreatePersonaIdentityIsLoading = false;
        state.CreatePersonaIdentityState.CreatePersonaIdentityData =
          action.payload;
        state.FetchPersonaIdentityState.FetchPersonaIdentityData =
          action.payload;
        state.CreatePersonaIdentityState.CreatePersonaIdentityIsSuccess = true;
      })
      .addCase(CreatePersonaIdentity.rejected, (state, action) => {
        state.CreatePersonaIdentityState.CreatePersonaIdentityIsLoading = false;
        state.CreatePersonaIdentityState.CreatePersonaIdentityIsError =
          action.payload as string | object;
        state.CreatePersonaIdentityState.CreatePersonaIdentityIsSuccess = false;
      })
      .addCase(fetchNeverSayRules.pending, (state) => {
        state.FetchNeverSayRulesState.FetchNeverSayRulesIsLoading = true;
        state.FetchNeverSayRulesState.FetchNeverSayRulesIsError = null;
        state.FetchNeverSayRulesState.FetchNeverSayRulesIsSuccess = false;
      })
      .addCase(fetchNeverSayRules.fulfilled, (state, action) => {
        state.FetchNeverSayRulesState.FetchNeverSayRulesIsLoading = false;
        state.FetchNeverSayRulesState.FetchNeverSayRulesData = action.payload;
        state.FetchNeverSayRulesState.FetchNeverSayRulesIsSuccess = true;
      })
      .addCase(fetchNeverSayRules.rejected, (state, action) => {
        state.FetchNeverSayRulesState.FetchNeverSayRulesIsLoading = false;
        state.FetchNeverSayRulesState.FetchNeverSayRulesIsError =
          action.payload as string | object;
        state.FetchNeverSayRulesState.FetchNeverSayRulesIsSuccess = false;
      })
      .addCase(CreateNeverSayRules.pending, (state) => {
        state.CreateNeverSayRulesState.CreateNeverSayRulesIsLoading = true;
        state.CreateNeverSayRulesState.CreateNeverSayRulesIsError = null;
        state.CreateNeverSayRulesState.CreateNeverSayRulesIsSuccess = false;
      })
      .addCase(CreateNeverSayRules.fulfilled, (state, action) => {
        state.CreateNeverSayRulesState.CreateNeverSayRulesIsLoading = false;
        state.CreateNeverSayRulesState.CreateNeverSayRulesData = action.payload;
        state.FetchNeverSayRulesState.FetchNeverSayRulesData = action.payload;
        state.CreateNeverSayRulesState.CreateNeverSayRulesIsSuccess = true;
      })
      .addCase(CreateNeverSayRules.rejected, (state, action) => {
        state.CreateNeverSayRulesState.CreateNeverSayRulesIsLoading = false;
        state.CreateNeverSayRulesState.CreateNeverSayRulesIsError =
          action.payload as string | object;
        state.CreateNeverSayRulesState.CreateNeverSayRulesIsSuccess = false;
      });
  },
});

export default brandVoiceSlice.reducer;
