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

type RequestState<T> = {
  isLoading: boolean;
  error: string | null;
  data: T | null;
};

function idle<T>(): RequestState<T> {
  return { isLoading: false, error: null, data: null };
}

const brandVoiceSlice = createSlice({
  name: "brandVoice",
  initialState: {
    personaIdentity: idle<PersonaIdentityData>(),
    neverSayRules: idle<NeverSayRulesData>(),
    isSavingPersonaIdentity: false,
    isSavingNeverSayRules: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPersonaIdentity.pending, (state) => {
        state.personaIdentity.isLoading = true;
        state.personaIdentity.error = null;
      })
      .addCase(fetchPersonaIdentity.fulfilled, (state, action) => {
        state.personaIdentity.isLoading = false;
        state.personaIdentity.data = action.payload;
      })
      .addCase(fetchPersonaIdentity.rejected, (state, action) => {
        state.personaIdentity.isLoading = false;
        state.personaIdentity.error = String(
          action.payload || "Something went wrong",
        );
      })
      .addCase(savePersonaIdentity.pending, (state) => {
        state.isSavingPersonaIdentity = true;
      })
      .addCase(savePersonaIdentity.fulfilled, (state, action) => {
        state.isSavingPersonaIdentity = false;
        state.personaIdentity.data = action.payload;
      })
      .addCase(savePersonaIdentity.rejected, (state) => {
        state.isSavingPersonaIdentity = false;
      })
      .addCase(fetchNeverSayRules.pending, (state) => {
        state.neverSayRules.isLoading = true;
        state.neverSayRules.error = null;
      })
      .addCase(fetchNeverSayRules.fulfilled, (state, action) => {
        state.neverSayRules.isLoading = false;
        state.neverSayRules.data = action.payload;
      })
      .addCase(fetchNeverSayRules.rejected, (state, action) => {
        state.neverSayRules.isLoading = false;
        state.neverSayRules.error = String(
          action.payload || "Something went wrong",
        );
      })
      .addCase(saveNeverSayRules.pending, (state) => {
        state.isSavingNeverSayRules = true;
      })
      .addCase(saveNeverSayRules.fulfilled, (state, action) => {
        state.isSavingNeverSayRules = false;
        state.neverSayRules.data = action.payload;
      })
      .addCase(saveNeverSayRules.rejected, (state) => {
        state.isSavingNeverSayRules = false;
      });
  },
});

export default brandVoiceSlice.reducer;
