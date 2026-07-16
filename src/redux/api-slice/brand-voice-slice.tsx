import { ENDPOINTS } from "@/lib/config";
import { axiosInstance } from "@/redux/axios-config";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import { toast } from "sonner";

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

export type PersonaIdentityPayload = Omit<
  PersonaIdentityData,
  "created_at" | "updated_at"
>;
export type NeverSayRulesPayload = Omit<
  NeverSayRulesData,
  "created_at" | "updated_at"
>;

function errorMessage(error: unknown, fallback: string) {
  const data = isAxiosError(error) ? error.response?.data : undefined;
  return data?.message || fallback;
}

export const fetchPersonaIdentity = createAsyncThunk(
  "brandVoice/fetchPersonaIdentity",
  async (storeCode: string, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        ENDPOINTS.personaIdentity(storeCode),
      );
      return response.data.data as PersonaIdentityData | null;
    } catch (error) {
      const message = errorMessage(error, "Unable to fetch persona identity.");
      toast.error("Could not load Persona Identity", { description: message });
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const savePersonaIdentity = createAsyncThunk(
  "brandVoice/savePersonaIdentity",
  async (
    {
      storeCode,
      payload,
    }: { storeCode: string; payload: PersonaIdentityPayload },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(
        ENDPOINTS.personaIdentity(storeCode),
        payload,
      );
      toast.success(
        response.data.message || "Persona identity saved successfully.",
      );
      return response.data.data as PersonaIdentityData;
    } catch (error) {
      const message = errorMessage(error, "Unable to save persona identity.");
      toast.error("Could not save Persona Identity", { description: message });
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const fetchNeverSayRules = createAsyncThunk(
  "brandVoice/fetchNeverSayRules",
  async (storeCode: string, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        ENDPOINTS.neverSayRules(storeCode),
      );
      return response.data.data as NeverSayRulesData | null;
    } catch (error) {
      const message = errorMessage(error, "Unable to fetch never-say rules.");
      toast.error("Could not load Never-Say Rules", { description: message });
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const saveNeverSayRules = createAsyncThunk(
  "brandVoice/saveNeverSayRules",
  async (
    {
      storeCode,
      payload,
    }: { storeCode: string; payload: NeverSayRulesPayload },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(
        ENDPOINTS.neverSayRules(storeCode),
        payload,
      );
      toast.success(
        response.data.message || "Never-say rules saved successfully.",
      );
      return response.data.data as NeverSayRulesData;
    } catch (error) {
      const message = errorMessage(error, "Unable to save never-say rules.");
      toast.error("Could not save Never-Say Rules", { description: message });
      return thunkAPI.rejectWithValue(message);
    }
  },
);

const brandVoiceSlice = createSlice({
  name: "brandVoice",
  initialState: {
    FetchPersonaIdentityState: {
      FetchPersonaIdentityIsLoading: false,
      FetchPersonaIdentityIsSuccess: false,
      FetchPersonaIdentityIsError: null as null | string | object | unknown,
      FetchPersonaIdentityData: null as PersonaIdentityData | null,
    },
    SavePersonaIdentityState: {
      SavePersonaIdentityIsLoading: false,
      SavePersonaIdentityIsSuccess: false,
      SavePersonaIdentityIsError: null as null | string | object | unknown,
    },
    FetchNeverSayRulesState: {
      FetchNeverSayRulesIsLoading: false,
      FetchNeverSayRulesIsSuccess: false,
      FetchNeverSayRulesIsError: null as null | string | object | unknown,
      FetchNeverSayRulesData: null as NeverSayRulesData | null,
    },
    SaveNeverSayRulesState: {
      SaveNeverSayRulesIsLoading: false,
      SaveNeverSayRulesIsSuccess: false,
      SaveNeverSayRulesIsError: null as null | string | object | unknown,
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
          action.payload;
        state.FetchPersonaIdentityState.FetchPersonaIdentityIsSuccess = false;
      })
      .addCase(savePersonaIdentity.pending, (state) => {
        state.SavePersonaIdentityState.SavePersonaIdentityIsLoading = true;
        state.SavePersonaIdentityState.SavePersonaIdentityIsError = null;
        state.SavePersonaIdentityState.SavePersonaIdentityIsSuccess = false;
      })
      .addCase(savePersonaIdentity.fulfilled, (state, action) => {
        state.SavePersonaIdentityState.SavePersonaIdentityIsLoading = false;
        state.FetchPersonaIdentityState.FetchPersonaIdentityData =
          action.payload;
        state.SavePersonaIdentityState.SavePersonaIdentityIsSuccess = true;
      })
      .addCase(savePersonaIdentity.rejected, (state, action) => {
        state.SavePersonaIdentityState.SavePersonaIdentityIsLoading = false;
        state.SavePersonaIdentityState.SavePersonaIdentityIsError =
          action.payload;
        state.SavePersonaIdentityState.SavePersonaIdentityIsSuccess = false;
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
          action.payload;
        state.FetchNeverSayRulesState.FetchNeverSayRulesIsSuccess = false;
      })
      .addCase(saveNeverSayRules.pending, (state) => {
        state.SaveNeverSayRulesState.SaveNeverSayRulesIsLoading = true;
        state.SaveNeverSayRulesState.SaveNeverSayRulesIsError = null;
        state.SaveNeverSayRulesState.SaveNeverSayRulesIsSuccess = false;
      })
      .addCase(saveNeverSayRules.fulfilled, (state, action) => {
        state.SaveNeverSayRulesState.SaveNeverSayRulesIsLoading = false;
        state.FetchNeverSayRulesState.FetchNeverSayRulesData = action.payload;
        state.SaveNeverSayRulesState.SaveNeverSayRulesIsSuccess = true;
      })
      .addCase(saveNeverSayRules.rejected, (state, action) => {
        state.SaveNeverSayRulesState.SaveNeverSayRulesIsLoading = false;
        state.SaveNeverSayRulesState.SaveNeverSayRulesIsError = action.payload;
        state.SaveNeverSayRulesState.SaveNeverSayRulesIsSuccess = false;
      });
  },
});

export default brandVoiceSlice.reducer;
