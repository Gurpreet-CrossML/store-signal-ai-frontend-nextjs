import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { axiosInstance } from "@/redux/axios-config";
import { ENDPOINTS } from "@/lib/config";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { type VocabularyRecord } from "@/db/brand-voice";

export const GetVocabulary = createAsyncThunk<VocabularyRecord, string>(
  "vocabulary/getVocabulary",
  async (storeCode: string, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchVocabulary()}?store_code=${storeCode}`,
      );
      return response.data.data as VocabularyRecord;
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

const VocabularySlice = createSlice({
  name: "Vocabulary",
  initialState: {
    GetVocabularyState: {
      GetVocabularyIsLoading: false,
      GetVocabularyIsSuccess: false,
      GetVocabularyIsError: null as null | string | object,
      GetVocabularyData: null as null | VocabularyRecord,
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
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
      });
  },
});

export default VocabularySlice.reducer;
