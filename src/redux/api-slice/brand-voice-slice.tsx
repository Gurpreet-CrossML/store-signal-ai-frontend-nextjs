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
  "brandVoice/fetchPersonaIdentity",
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
  "brandVoice/fetchNeverSayRules",
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

export const GetToneStyle = createAsyncThunk<ToneStyleRecord | null, string>(
  "brandVoice/getToneStyle",
  async (storeCode, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchToneStyle()}?store_code=${encodeURIComponent(storeCode)}`,
      );
      const data = response.data.data;
      return data as ToneStyleRecord | null;
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

export const GetTonePresets = createAsyncThunk<TonePresetRecord[], void>(
  "brandVoice/getTonePresets",
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.get(ENDPOINTS.fetchTonePresets());
      const data = response.data.data;
      return Array.isArray(data) ? (data as TonePresetRecord[]) : [];
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

export const SaveToneStyle = createAsyncThunk<
  ToneStyleRecord,
  { storeCode: string; payload: ToneStylePayload }
>("brandVoice/saveToneStyle", async ({ storeCode, payload }, thunkAPI) => {
  try {
    const response = await axiosInstance.post(
      `${ENDPOINTS.saveToneStyle()}?store_code=${encodeURIComponent(storeCode)}`,
      payload,
    );
    const data = response.data.data;

    toast.success(
      response?.data?.message || "Tone & Style saved successfully!",
    );

    return data as ToneStyleRecord;
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
});

// Thunks — Vocabulary

export const GetVocabulary = createAsyncThunk<VocabularyRecord | null, string>(
  "brandVoice/getVocabulary",
  async (storeCode, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchVocabulary()}?store_code=${encodeURIComponent(storeCode)}`,
      );
      const data = response.data.data;
      return data as VocabularyRecord | null;
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

export const SaveVocabulary = createAsyncThunk<
  VocabularyRecord,
  { storeCode: string; payload: VocabularyPayload }
>("brandVoice/saveVocabulary", async ({ storeCode, payload }, thunkAPI) => {
  try {
    const response = await axiosInstance.post(
      `${ENDPOINTS.saveVocabulary()}?store_code=${encodeURIComponent(storeCode)}`,
      payload,
    );
    const data = response.data.data;

    toast.success(response?.data?.message || "Vocabulary saved successfully!");

    return data as VocabularyRecord;
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
});

// Slice

const BrandVoiceSlice = createSlice({
  name: "BrandVoice",
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
    GetTonePresetsState: {
      GetTonePresetsIsLoading: false,
      GetTonePresetsIsSuccess: false,
      GetTonePresetsIsError: null as null | string | object,
      GetTonePresetsData: [] as TonePresetRecord[],
    },
    GetToneStyleState: {
      GetToneStyleIsLoading: false,
      GetToneStyleIsSuccess: false,
      GetToneStyleIsError: null as null | string | object,
      GetToneStyleData: null as ToneStyleRecord | null,
    },
    SaveToneStyleState: {
      SaveToneStyleIsLoading: false,
      SaveToneStyleIsSuccess: false,
      SaveToneStyleIsError: null as null | string | object,
      SaveToneStyleData: null as ToneStyleRecord | null,
    },
    GetVocabularyState: {
      GetVocabularyIsLoading: false,
      GetVocabularyIsSuccess: false,
      GetVocabularyIsError: null as null | string | object,
      GetVocabularyData: null as VocabularyRecord | null,
    },
    SaveVocabularyState: {
      SaveVocabularyIsLoading: false,
      SaveVocabularyIsSuccess: false,
      SaveVocabularyIsError: null as null | string | object,
      SaveVocabularyData: null as VocabularyRecord | null,
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
          action.payload || "Something went wrong";
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
          action.payload || "Something went wrong";
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
          action.payload || "Something went wrong";
        state.CreateNeverSayRulesState.CreateNeverSayRulesIsSuccess = false;
      })
      // Tone Presets
      .addCase(GetTonePresets.pending, (state) => {
        state.GetTonePresetsState.GetTonePresetsIsLoading = true;
        state.GetTonePresetsState.GetTonePresetsIsSuccess = false;
        state.GetTonePresetsState.GetTonePresetsIsError = null;
      })
      .addCase(GetTonePresets.fulfilled, (state, action) => {
        state.GetTonePresetsState.GetTonePresetsIsLoading = false;
        state.GetTonePresetsState.GetTonePresetsIsSuccess = true;
        state.GetTonePresetsState.GetTonePresetsData = action.payload;
      })
      .addCase(GetTonePresets.rejected, (state, action) => {
        state.GetTonePresetsState.GetTonePresetsIsLoading = false;
        state.GetTonePresetsState.GetTonePresetsIsSuccess = false;
        state.GetTonePresetsState.GetTonePresetsIsError =
          action.payload || "Something went wrong";
      })
      // Tone Style
      .addCase(GetToneStyle.pending, (state) => {
        state.GetToneStyleState.GetToneStyleIsLoading = true;
        state.GetToneStyleState.GetToneStyleIsSuccess = false;
        state.GetToneStyleState.GetToneStyleIsError = null;
      })
      .addCase(GetToneStyle.fulfilled, (state, action) => {
        state.GetToneStyleState.GetToneStyleIsLoading = false;
        state.GetToneStyleState.GetToneStyleIsSuccess = true;
        state.GetToneStyleState.GetToneStyleData = action.payload;
      })
      .addCase(GetToneStyle.rejected, (state, action) => {
        state.GetToneStyleState.GetToneStyleIsLoading = false;
        state.GetToneStyleState.GetToneStyleIsSuccess = false;
        state.GetToneStyleState.GetToneStyleIsError =
          action.payload || "Something went wrong";
      })
      .addCase(SaveToneStyle.pending, (state) => {
        state.SaveToneStyleState.SaveToneStyleIsLoading = true;
        state.SaveToneStyleState.SaveToneStyleIsSuccess = false;
        state.SaveToneStyleState.SaveToneStyleIsError = null;
      })
      .addCase(SaveToneStyle.fulfilled, (state, action) => {
        state.SaveToneStyleState.SaveToneStyleIsLoading = false;
        state.SaveToneStyleState.SaveToneStyleIsSuccess = true;
        state.GetToneStyleState.GetToneStyleData = action.payload;
        state.SaveToneStyleState.SaveToneStyleData = action.payload;
      })
      .addCase(SaveToneStyle.rejected, (state, action) => {
        state.SaveToneStyleState.SaveToneStyleIsLoading = false;
        state.SaveToneStyleState.SaveToneStyleIsSuccess = false;
        state.SaveToneStyleState.SaveToneStyleIsError =
          action.payload || "Something went wrong";
      })
      // Vocabulary
      .addCase(GetVocabulary.pending, (state) => {
        state.GetVocabularyState.GetVocabularyIsLoading = true;
        state.GetVocabularyState.GetVocabularyIsSuccess = false;
        state.GetVocabularyState.GetVocabularyIsError = null;
      })
      .addCase(GetVocabulary.fulfilled, (state, action) => {
        state.GetVocabularyState.GetVocabularyIsLoading = false;
        state.GetVocabularyState.GetVocabularyIsSuccess = true;
        state.GetVocabularyState.GetVocabularyData = action.payload;
      })
      .addCase(GetVocabulary.rejected, (state, action) => {
        state.GetVocabularyState.GetVocabularyIsLoading = false;
        state.GetVocabularyState.GetVocabularyIsSuccess = false;
        state.GetVocabularyState.GetVocabularyIsError =
          action.payload || "Something went wrong";
      })
      .addCase(SaveVocabulary.pending, (state) => {
        state.SaveVocabularyState.SaveVocabularyIsLoading = true;
        state.SaveVocabularyState.SaveVocabularyIsSuccess = false;
        state.SaveVocabularyState.SaveVocabularyIsError = null;
      })
      .addCase(SaveVocabulary.fulfilled, (state, action) => {
        state.SaveVocabularyState.SaveVocabularyIsLoading = false;
        state.SaveVocabularyState.SaveVocabularyIsSuccess = true;
        state.GetVocabularyState.GetVocabularyData = action.payload;
        state.SaveVocabularyState.SaveVocabularyData = action.payload;
      })
      .addCase(SaveVocabulary.rejected, (state, action) => {
        state.SaveVocabularyState.SaveVocabularyIsLoading = false;
        state.SaveVocabularyState.SaveVocabularyIsSuccess = false;
        state.SaveVocabularyState.SaveVocabularyIsError =
          action.payload || "Something went wrong";
      });
  },
});

export default BrandVoiceSlice.reducer;
