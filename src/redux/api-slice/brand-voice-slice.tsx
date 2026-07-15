import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import { ENDPOINTS } from "@/lib/config";
import { axiosInstance } from "@/redux/axios-config";
import type {
  ToneStylePayload,
  ToneStyleRecord,
  VocabularyPayload,
  VocabularyRecord,
} from "@/db/brand-voice";

type AsyncState<T> = {
  isLoading: boolean;
  isSuccess: boolean;
  isError: null | string | object;
  data: T | null;
};

function createAsyncState<T>(data: T | null = null): AsyncState<T> {
  return {
    isLoading: false,
    isSuccess: false,
    isError: null,
    data,
  };
}

type BrandVoiceState = {
  toneStyle: {
    fetch: AsyncState<ToneStyleRecord>;
    save: AsyncState<ToneStyleRecord>;
  };
  vocabulary: {
    fetch: AsyncState<VocabularyRecord>;
    save: AsyncState<VocabularyRecord>;
  };
};

const initialState: BrandVoiceState = {
  toneStyle: {
    fetch: createAsyncState<ToneStyleRecord>(),
    save: createAsyncState<ToneStyleRecord>(),
  },
  vocabulary: {
    fetch: createAsyncState<VocabularyRecord>(),
    save: createAsyncState<VocabularyRecord>(),
  },
};

export const GetToneStyle = createAsyncThunk<ToneStyleRecord | null, string>(
  "brandVoice/getToneStyle",
  async (storeCode, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchToneStyle()}&store_code=${encodeURIComponent(storeCode)}`,
      );
      return response.data.data as ToneStyleRecord | null;
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

export const SaveToneStyle = createAsyncThunk<
  ToneStyleRecord,
  { storeCode: string; payload: ToneStylePayload }
>("brandVoice/saveToneStyle", async ({ storeCode, payload }, thunkAPI) => {
  try {
    const response = await axiosInstance.post(
      `${ENDPOINTS.saveToneStyle()}?store_code=${encodeURIComponent(storeCode)}`,
      payload,
    );
    toast.success("Tone & Style saved successfully");
    return response.data.data as ToneStyleRecord;
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

export const GetVocabulary = createAsyncThunk<VocabularyRecord | null, string>(
  "brandVoice/getVocabulary",
  async (storeCode, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchVocabulary()}&store_code=${encodeURIComponent(storeCode)}`,
      );
      return response.data.data as VocabularyRecord | null;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to fetch the Vocabulary, please try again later.",
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
    toast.success("Vocabulary saved successfully");
    return response.data.data as VocabularyRecord;
  } catch (error) {
    const response = isAxiosError(error) ? error.response : undefined;
    const data = response?.data;
    toast.error("Uh oh! Something went wrong.", {
      description:
        data?.message ||
        "Unable to save the Vocabulary, please try again later.",
    });
    return thunkAPI.rejectWithValue(data || "Something went wrong");
  }
});

const BrandVoiceSlice = createSlice({
  name: "BrandVoice",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(GetToneStyle.pending, (state) => {
        state.toneStyle.fetch.isLoading = true;
        state.toneStyle.fetch.isSuccess = false;
        state.toneStyle.fetch.isError = null;
      })
      .addCase(GetToneStyle.fulfilled, (state, action) => {
        state.toneStyle.fetch.isLoading = false;
        state.toneStyle.fetch.isSuccess = true;
        state.toneStyle.fetch.data = action.payload;
      })
      .addCase(GetToneStyle.rejected, (state, action) => {
        state.toneStyle.fetch.isLoading = false;
        state.toneStyle.fetch.isSuccess = false;
        state.toneStyle.fetch.isError =
          action.payload || "Something went wrong";
      })
      .addCase(SaveToneStyle.pending, (state) => {
        state.toneStyle.save.isLoading = true;
        state.toneStyle.save.isSuccess = false;
        state.toneStyle.save.isError = null;
      })
      .addCase(SaveToneStyle.fulfilled, (state, action) => {
        state.toneStyle.save.isLoading = false;
        state.toneStyle.save.isSuccess = true;
        state.toneStyle.fetch.data = action.payload;
        state.toneStyle.save.data = action.payload;
      })
      .addCase(SaveToneStyle.rejected, (state, action) => {
        state.toneStyle.save.isLoading = false;
        state.toneStyle.save.isSuccess = false;
        state.toneStyle.save.isError = action.payload || "Something went wrong";
      })
      .addCase(GetVocabulary.pending, (state) => {
        state.vocabulary.fetch.isLoading = true;
        state.vocabulary.fetch.isSuccess = false;
        state.vocabulary.fetch.isError = null;
      })
      .addCase(GetVocabulary.fulfilled, (state, action) => {
        state.vocabulary.fetch.isLoading = false;
        state.vocabulary.fetch.isSuccess = true;
        state.vocabulary.fetch.data = action.payload;
      })
      .addCase(GetVocabulary.rejected, (state, action) => {
        state.vocabulary.fetch.isLoading = false;
        state.vocabulary.fetch.isSuccess = false;
        state.vocabulary.fetch.isError =
          action.payload || "Something went wrong";
      })
      .addCase(SaveVocabulary.pending, (state) => {
        state.vocabulary.save.isLoading = true;
        state.vocabulary.save.isSuccess = false;
        state.vocabulary.save.isError = null;
      })
      .addCase(SaveVocabulary.fulfilled, (state, action) => {
        state.vocabulary.save.isLoading = false;
        state.vocabulary.save.isSuccess = true;
        state.vocabulary.fetch.data = action.payload;
        state.vocabulary.save.data = action.payload;
      })
      .addCase(SaveVocabulary.rejected, (state, action) => {
        state.vocabulary.save.isLoading = false;
        state.vocabulary.save.isSuccess = false;
        state.vocabulary.save.isError =
          action.payload || "Something went wrong";
      });
  },
});

export default BrandVoiceSlice.reducer;
