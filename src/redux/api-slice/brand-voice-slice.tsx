import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import { ENDPOINTS } from "@/lib/config";
import { axiosInstance } from "@/redux/axios-config";
import type {
  TonePresetRecord,
  ToneStylePayload,
  ToneStyleRecord,
  VocabularyPayload,
  VocabularyRecord,
} from "@/db/chat";

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

// Thunks — Persona Identity

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

export const createPersonaIdentity = createAsyncThunk(
  "createPersonaIdentity",
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

// Thunks — Never Say Rules

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

export const createNeverSayRules = createAsyncThunk(
  "createNeverSayRules",
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

// Thunks — Tone & Style

export const fetchToneStyle = createAsyncThunk(
  "fetchToneStyle",
  async (storeCode: string, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.toneStyle()}?store_code=${encodeURIComponent(storeCode)}`,
      );
      const data = response.data.data;
      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to fetch the Tone & Style, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const fetchTonePresets = createAsyncThunk(
  "fetchTonePresets",
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.get(ENDPOINTS.tonePresets());
      const data = response.data.data;
      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to fetch the tone presets, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const createToneStyle = createAsyncThunk(
  "createToneStyle",
  async (
    { storeCode, payload }: { storeCode: string; payload: ToneStylePayload },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(
        `${ENDPOINTS.toneStyle()}?store_code=${encodeURIComponent(storeCode)}`,
        payload,
      );
      const data = response.data.data;

      toast.success(
        response?.data?.message || "Tone & Style saved successfully!",
      );

      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to save the Tone & Style, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

// Thunks — Vocabulary

export const fetchVocabulary = createAsyncThunk(
  "fetchVocabulary",
  async (storeCode: string, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.vocabulary()}?store_code=${encodeURIComponent(storeCode)}`,
      );
      const data = response.data.data;
      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to fetch the vocabulary, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const createVocabulary = createAsyncThunk(
  "createVocabulary",
  async (
    { storeCode, payload }: { storeCode: string; payload: VocabularyPayload },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(
        `${ENDPOINTS.vocabulary()}?store_code=${encodeURIComponent(storeCode)}`,
        payload,
      );
      const data = response.data.data;

      toast.success(
        response?.data?.message || "Vocabulary saved successfully!",
      );

      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to save the vocabulary, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

// Slice

const BrandVoiceSlice = createSlice({
  name: "BrandVoice",
  initialState: {
    FetchPersonaIdentityState: {
      FetchPersonaIdentityIsLoading: false,
      FetchPersonaIdentityIsSuccess: false,
      FetchPersonaIdentityIsError: null as null | string | object,
      FetchPersonaIdentityData: {} as PersonaIdentityData,
    },
    CreatePersonaIdentityState: {
      CreatePersonaIdentityIsLoading: false,
      CreatePersonaIdentityIsSuccess: false,
      CreatePersonaIdentityIsError: null as null | string | object,
      CreatePersonaIdentityData: {} as PersonaIdentityData,
    },
    FetchNeverSayRulesState: {
      FetchNeverSayRulesIsLoading: false,
      FetchNeverSayRulesIsSuccess: false,
      FetchNeverSayRulesIsError: null as null | string | object,
      FetchNeverSayRulesData: {} as NeverSayRulesData,
    },
    CreateNeverSayRulesState: {
      CreateNeverSayRulesIsLoading: false,
      CreateNeverSayRulesIsSuccess: false,
      CreateNeverSayRulesIsError: null as null | string | object,
      CreateNeverSayRulesData: {} as NeverSayRulesData,
    },
    FetchTonePresetsState: {
      FetchTonePresetsIsLoading: false,
      FetchTonePresetsIsSuccess: false,
      FetchTonePresetsIsError: null as null | string | object,
      FetchTonePresetsData: [] as TonePresetRecord[],
    },
    FetchToneStyleState: {
      FetchToneStyleIsLoading: false,
      FetchToneStyleIsSuccess: false,
      FetchToneStyleIsError: null as null | string | object,
      FetchToneStyleData: {} as ToneStyleRecord,
    },
    CreateToneStyleState: {
      CreateToneStyleIsLoading: false,
      CreateToneStyleIsSuccess: false,
      CreateToneStyleIsError: null as null | string | object,
      CreateToneStyleData: {} as ToneStyleRecord,
    },
    FetchVocabularyState: {
      FetchVocabularyIsLoading: false,
      FetchVocabularyIsSuccess: false,
      FetchVocabularyIsError: null as null | string | object,
      FetchVocabularyData: {} as VocabularyRecord,
    },
    CreateVocabularyState: {
      CreateVocabularyIsLoading: false,
      CreateVocabularyIsSuccess: false,
      CreateVocabularyIsError: null as null | string | object,
      CreateVocabularyData: {} as VocabularyRecord,
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Persona Identity
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
      .addCase(createPersonaIdentity.pending, (state) => {
        state.CreatePersonaIdentityState.CreatePersonaIdentityIsLoading = true;
        state.CreatePersonaIdentityState.CreatePersonaIdentityIsError = null;
        state.CreatePersonaIdentityState.CreatePersonaIdentityIsSuccess = false;
      })
      .addCase(createPersonaIdentity.fulfilled, (state, action) => {
        state.CreatePersonaIdentityState.CreatePersonaIdentityIsLoading = false;
        state.CreatePersonaIdentityState.CreatePersonaIdentityData =
          action.payload;
        state.FetchPersonaIdentityState.FetchPersonaIdentityData =
          action.payload;
        state.CreatePersonaIdentityState.CreatePersonaIdentityIsSuccess = true;
      })
      .addCase(createPersonaIdentity.rejected, (state, action) => {
        state.CreatePersonaIdentityState.CreatePersonaIdentityIsLoading = false;
        state.CreatePersonaIdentityState.CreatePersonaIdentityIsError =
          action.payload as Record<
            string,
            string | Record<string, string>
          > | null;
        state.CreatePersonaIdentityState.CreatePersonaIdentityIsSuccess = false;
      })
      // Never Say Rules
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
      .addCase(createNeverSayRules.pending, (state) => {
        state.CreateNeverSayRulesState.CreateNeverSayRulesIsLoading = true;
        state.CreateNeverSayRulesState.CreateNeverSayRulesIsError = null;
        state.CreateNeverSayRulesState.CreateNeverSayRulesIsSuccess = false;
      })
      .addCase(createNeverSayRules.fulfilled, (state, action) => {
        state.CreateNeverSayRulesState.CreateNeverSayRulesIsLoading = false;
        state.CreateNeverSayRulesState.CreateNeverSayRulesData = action.payload;
        state.FetchNeverSayRulesState.FetchNeverSayRulesData = action.payload;
        state.CreateNeverSayRulesState.CreateNeverSayRulesIsSuccess = true;
      })
      .addCase(createNeverSayRules.rejected, (state, action) => {
        state.CreateNeverSayRulesState.CreateNeverSayRulesIsLoading = false;
        state.CreateNeverSayRulesState.CreateNeverSayRulesIsError =
          action.payload as string | object;
        state.CreateNeverSayRulesState.CreateNeverSayRulesIsSuccess = false;
      })
      // Tone Presets
      .addCase(fetchTonePresets.pending, (state) => {
        state.FetchTonePresetsState.FetchTonePresetsIsLoading = true;
        state.FetchTonePresetsState.FetchTonePresetsIsSuccess = false;
        state.FetchTonePresetsState.FetchTonePresetsIsError = null;
      })
      .addCase(fetchTonePresets.fulfilled, (state, action) => {
        state.FetchTonePresetsState.FetchTonePresetsIsLoading = false;
        state.FetchTonePresetsState.FetchTonePresetsIsSuccess = true;
        state.FetchTonePresetsState.FetchTonePresetsData = action.payload;
      })
      .addCase(fetchTonePresets.rejected, (state, action) => {
        state.FetchTonePresetsState.FetchTonePresetsIsLoading = false;
        state.FetchTonePresetsState.FetchTonePresetsIsSuccess = false;
        state.FetchTonePresetsState.FetchTonePresetsIsError = action.payload as
          | string
          | object;
      })
      // Tone Style
      .addCase(fetchToneStyle.pending, (state) => {
        state.FetchToneStyleState.FetchToneStyleIsLoading = true;
        state.FetchToneStyleState.FetchToneStyleIsSuccess = false;
        state.FetchToneStyleState.FetchToneStyleIsError = null;
      })
      .addCase(fetchToneStyle.fulfilled, (state, action) => {
        state.FetchToneStyleState.FetchToneStyleIsLoading = false;
        state.FetchToneStyleState.FetchToneStyleIsSuccess = true;
        state.FetchToneStyleState.FetchToneStyleData = action.payload;
      })
      .addCase(fetchToneStyle.rejected, (state, action) => {
        state.FetchToneStyleState.FetchToneStyleIsLoading = false;
        state.FetchToneStyleState.FetchToneStyleIsSuccess = false;
        state.FetchToneStyleState.FetchToneStyleIsError = action.payload as
          | string
          | object;
      })
      .addCase(createToneStyle.pending, (state) => {
        state.CreateToneStyleState.CreateToneStyleIsLoading = true;
        state.CreateToneStyleState.CreateToneStyleIsSuccess = false;
        state.CreateToneStyleState.CreateToneStyleIsError = null;
      })
      .addCase(createToneStyle.fulfilled, (state, action) => {
        state.CreateToneStyleState.CreateToneStyleIsLoading = false;
        state.CreateToneStyleState.CreateToneStyleIsSuccess = true;
        state.FetchToneStyleState.FetchToneStyleData = action.payload;
        state.CreateToneStyleState.CreateToneStyleData = action.payload;
      })
      .addCase(createToneStyle.rejected, (state, action) => {
        state.CreateToneStyleState.CreateToneStyleIsLoading = false;
        state.CreateToneStyleState.CreateToneStyleIsSuccess = false;
        state.CreateToneStyleState.CreateToneStyleIsError = action.payload as
          | string
          | object;
      })
      // Vocabulary
      .addCase(fetchVocabulary.pending, (state) => {
        state.FetchVocabularyState.FetchVocabularyIsLoading = true;
        state.FetchVocabularyState.FetchVocabularyIsSuccess = false;
        state.FetchVocabularyState.FetchVocabularyIsError = null;
      })
      .addCase(fetchVocabulary.fulfilled, (state, action) => {
        state.FetchVocabularyState.FetchVocabularyIsLoading = false;
        state.FetchVocabularyState.FetchVocabularyIsSuccess = true;
        state.FetchVocabularyState.FetchVocabularyData = action.payload;
      })
      .addCase(fetchVocabulary.rejected, (state, action) => {
        state.FetchVocabularyState.FetchVocabularyIsLoading = false;
        state.FetchVocabularyState.FetchVocabularyIsSuccess = false;
        state.FetchVocabularyState.FetchVocabularyIsError = action.payload as
          | string
          | object;
      })
      .addCase(createVocabulary.pending, (state) => {
        state.CreateVocabularyState.CreateVocabularyIsLoading = true;
        state.CreateVocabularyState.CreateVocabularyIsSuccess = false;
        state.CreateVocabularyState.CreateVocabularyIsError = null;
      })
      .addCase(createVocabulary.fulfilled, (state, action) => {
        state.CreateVocabularyState.CreateVocabularyIsLoading = false;
        state.CreateVocabularyState.CreateVocabularyIsSuccess = true;
        state.FetchVocabularyState.FetchVocabularyData = action.payload;
        state.CreateVocabularyState.CreateVocabularyData = action.payload;
      })
      .addCase(createVocabulary.rejected, (state, action) => {
        state.CreateVocabularyState.CreateVocabularyIsLoading = false;
        state.CreateVocabularyState.CreateVocabularyIsSuccess = false;
        state.CreateVocabularyState.CreateVocabularyIsError = action.payload as
          | string
          | object;
      });
  },
});

export default BrandVoiceSlice.reducer;
