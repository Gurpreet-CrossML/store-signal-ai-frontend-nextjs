import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { axiosInstance } from "@/redux/axios-config";
import { ENDPOINTS } from "@/lib/config";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { type ToneStyleRecord } from "@/db/brand-voice";

export const GetToneStyle = createAsyncThunk<ToneStyleRecord, string>(
  "toneStyle/getToneStyle",
  async (storeCode: string, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchToneStyle()}?store_code=${storeCode}`,
      );
      return response.data.data as ToneStyleRecord;
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

const ToneStyleSlice = createSlice({
  name: "ToneStyle",
  initialState: {
    GetToneStyleState: {
      GetToneStyleIsLoading: false,
      GetToneStyleIsSuccess: false,
      GetToneStyleIsError: null as null | string | object,
      GetToneStyleData: null as null | ToneStyleRecord,
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
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
      });
  },
});

export default ToneStyleSlice.reducer;
