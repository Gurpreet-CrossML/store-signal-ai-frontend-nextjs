import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { axiosInstance } from "@/redux/axios-config";
import { ENDPOINTS } from "@/lib/config";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { Store } from "@/redux/api-slice/stores-slice";

type GetStoreFaqsArgs = {
  store_code?: string;
  page?: number;
  limit?: number;
};

export type StoreFaq = {
  id: number;
  store: string;
  question: string;
  answer: string;
  created_at: string;
  updated_at: string;
};

export type FetchStoreFaqsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: StoreFaq[];
};

export type StoreDocumentStatus =
  | "pending"
  | "in-progress"
  | "completed"
  | "failed";

export type StoreDocument = {
  id: number;
  name: string;
  type: string;
  status: StoreDocumentStatus;
  size: number;
  error: string | null;
  created_at: string;
  updated_at: string;
};

export type FetchStoreLibraryResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: StoreDocument[];
};

export type StorePolicy = {
  id: number;
  store: Store;
  link_type: string;
  url: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export const FetchStoreFaqs = createAsyncThunk(
  "FetchStoreFaqs",
  async (
    { store_code = "", page = 1, limit = 10 }: GetStoreFaqsArgs = {},
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchStoreFaqs()}?store_code=${store_code}&page=${page}&page_size=${limit}`,
      );
      const data = response.data.data;

      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message || "Unable to fetch the FAQs, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const CreateStoreFaq = createAsyncThunk(
  "CreateStoreFaq",
  async (
    {
      store_code,
      question,
      answer,
    }: { store_code: string; question: string; answer: string },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(ENDPOINTS.createStoreFaq(), {
        store: store_code,
        question,
        answer,
      });
      const data = response.data.data;

      toast.success(response?.data?.message || "FAQ created successfully!");

      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message || "Unable to create the FAQ, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const UpdateStoreFaq = createAsyncThunk(
  "UpdateStoreFaq",
  async (
    {
      store_code,
      id,
      question,
      answer,
    }: { store_code: string; id: number; question: string; answer: string },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.put(
        `${ENDPOINTS.updateStoreFaq(id)}?store_code=${store_code}`,
        {
          question,
          answer,
          store: store_code,
        },
      );
      const data = response.data.data;

      toast.success(response?.data?.message || "FAQ updated successfully!");

      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message || "Unable to update the FAQ, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const DeleteStoreFaq = createAsyncThunk(
  "DeleteStoreFaq",
  async ({ store_code, id }: { store_code: string; id: number }, thunkAPI) => {
    try {
      const response = await axiosInstance.delete(
        `${ENDPOINTS.deleteStoreFaq(id)}?store_code=${store_code}`,
      );
      const data = response.data.data;

      toast.success(response?.data?.message || "FAQ deleted successfully!");

      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message || "Unable to delete the FAQ, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const FetchLibraryDocuments = createAsyncThunk(
  "FetchLibraryDocuments",
  async ({ store_code }: { store_code: string }, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchLibraryDocuments()}?store_code=${store_code}`,
      );
      const data = response.data.data;

      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to fetch the library documents, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const UploadLibraryDocument = createAsyncThunk(
  "UploadLibraryDocument",
  async (
    {
      store_code,
      file,
      fileType,
    }: { store_code: string; file: File; fileType: string },
    thunkAPI,
  ) => {
    try {
      const formData = new FormData();
      formData.append("path", file);
      formData.append("type", fileType);
      formData.append("size", parseInt(file.size.toString()).toString());
      formData.append("name", file.name);

      const response = await axiosInstance.post(
        `${ENDPOINTS.uploadLibraryDocument()}?store_code=${store_code}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      const data = response.data.data;

      toast.success(
        response?.data?.message || "Document uploaded successfully!",
      );

      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to upload the document, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const FetchStorePolicies = createAsyncThunk(
  "FetchStorePolicies",
  async ({ store_code }: { store_code: string }, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchScrapeLink()}?store_code=${store_code}`,
      );
      const data = response.data.data;

      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to fetch the store policies, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const CreateStorePolicy = createAsyncThunk(
  "CreateStorePolicy",
  async (
    {
      store_code,
      url,
      type,
    }: { store_code: string; url: string; type: string },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(
        `${ENDPOINTS.createScrapeLink()}?store_code=${store_code}`,
        {
          url,
          link_type: type,
          store: store_code,
        },
      );
      const data = response.data.data;

      toast.success(
        response?.data?.message || "Store policy created successfully!",
      );

      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to create the store policy, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const FetchStorePolicyType = createAsyncThunk(
  "FetchStorePolicyType",
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchScrapeLinkTypes()}`,
      );
      const data = response.data.data;

      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to fetch the store policy types, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

const KnowledgeSlice = createSlice({
  name: "Knowledge",
  initialState: {
    FetchStoreFaqsState: {
      FetchStoreFaqsIsLoading: false,
      FetchStoreFaqsIsSuccess: false,
      FetchStoreFaqsIsError: null as null | string | object,
      FetchStoreFaqsListData: {} as FetchStoreFaqsResponse,
    },
    CreateStoreFaqState: {
      CreateStoreFaqIsLoading: false,
      CreateStoreFaqIsSuccess: false,
      CreateStoreFaqIsError: null as null | string | object,
    },
    UpdateStoreFaqState: {
      UpdateStoreFaqIsLoading: false,
      UpdateStoreFaqIsSuccess: false,
      UpdateStoreFaqIsError: null as null | string | object,
    },
    DeleteStoreFaqState: {
      DeleteStoreFaqIsLoading: false,
      DeleteStoreFaqIsSuccess: false,
      DeleteStoreFaqIsError: null as null | string | object,
    },
    FetchLibraryDocumentsState: {
      FetchLibraryDocumentsIsLoading: false,
      FetchLibraryDocumentsIsSuccess: false,
      FetchLibraryDocumentsIsError: null as null | string | object,
      FetchLibraryDocumentsListData: {} as FetchStoreLibraryResponse,
    },
    UploadLibraryDocumentState: {
      UploadLibraryDocumentIsLoading: false,
      UploadLibraryDocumentIsSuccess: false,
      UploadLibraryDocumentIsError: null as null | string | object,
    },
    FetchStorePoliciesState: {
      FetchStorePoliciesIsLoading: false,
      FetchStorePoliciesIsSuccess: false,
      FetchStorePoliciesIsError: null as null | string | object,
      FetchStorePoliciesListData: [] as StorePolicy[],
    },
    CreateStorePolicyState: {
      CreateStorePolicyIsLoading: false,
      CreateStorePolicyIsSuccess: false,
      CreateStorePolicyIsError: null as null | string | object,
    },
    FetchStorePolicyTypeState: {
      FetchStorePolicyTypeIsLoading: false,
      FetchStorePolicyTypeIsSuccess: false,
      FetchStorePolicyTypeIsError: null as null | string | object,
      FetchStorePolicyTypeListData: {} as Record<string, string>,
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // FetchStoreFaqs
      .addCase(FetchStoreFaqs.pending, (state) => {
        state.FetchStoreFaqsState.FetchStoreFaqsIsLoading = true;
        state.FetchStoreFaqsState.FetchStoreFaqsIsSuccess = false;
        state.FetchStoreFaqsState.FetchStoreFaqsIsError = null;
      })
      .addCase(FetchStoreFaqs.fulfilled, (state, action) => {
        state.FetchStoreFaqsState.FetchStoreFaqsIsLoading = false;
        state.FetchStoreFaqsState.FetchStoreFaqsIsSuccess = true;
        state.FetchStoreFaqsState.FetchStoreFaqsListData = action.payload;
      })
      .addCase(FetchStoreFaqs.rejected, (state, action) => {
        state.FetchStoreFaqsState.FetchStoreFaqsIsLoading = false;
        state.FetchStoreFaqsState.FetchStoreFaqsIsSuccess = false;
        state.FetchStoreFaqsState.FetchStoreFaqsIsError =
          action.payload || "Something went wrong";
      })
      // CreateStoreFaq
      .addCase(CreateStoreFaq.pending, (state) => {
        state.CreateStoreFaqState.CreateStoreFaqIsLoading = true;
        state.CreateStoreFaqState.CreateStoreFaqIsSuccess = false;
        state.CreateStoreFaqState.CreateStoreFaqIsError = null;
      })
      .addCase(CreateStoreFaq.fulfilled, (state) => {
        state.CreateStoreFaqState.CreateStoreFaqIsLoading = false;
        state.CreateStoreFaqState.CreateStoreFaqIsSuccess = true;
      })
      .addCase(CreateStoreFaq.rejected, (state, action) => {
        state.CreateStoreFaqState.CreateStoreFaqIsLoading = false;
        state.CreateStoreFaqState.CreateStoreFaqIsSuccess = false;
        state.CreateStoreFaqState.CreateStoreFaqIsError =
          action.payload || "Something went wrong";
      })
      // UpdateStoreFaq
      .addCase(UpdateStoreFaq.pending, (state) => {
        state.UpdateStoreFaqState.UpdateStoreFaqIsLoading = true;
        state.UpdateStoreFaqState.UpdateStoreFaqIsSuccess = false;
        state.UpdateStoreFaqState.UpdateStoreFaqIsError = null;
      })
      .addCase(UpdateStoreFaq.fulfilled, (state) => {
        state.UpdateStoreFaqState.UpdateStoreFaqIsLoading = false;
        state.UpdateStoreFaqState.UpdateStoreFaqIsSuccess = true;
      })
      .addCase(UpdateStoreFaq.rejected, (state, action) => {
        state.UpdateStoreFaqState.UpdateStoreFaqIsLoading = false;
        state.UpdateStoreFaqState.UpdateStoreFaqIsSuccess = false;
        state.UpdateStoreFaqState.UpdateStoreFaqIsError =
          action.payload || "Something went wrong";
      })
      // DeleteStoreFaq
      .addCase(DeleteStoreFaq.pending, (state) => {
        state.DeleteStoreFaqState.DeleteStoreFaqIsLoading = true;
        state.DeleteStoreFaqState.DeleteStoreFaqIsSuccess = false;
        state.DeleteStoreFaqState.DeleteStoreFaqIsError = null;
      })
      .addCase(DeleteStoreFaq.fulfilled, (state) => {
        state.DeleteStoreFaqState.DeleteStoreFaqIsLoading = false;
        state.DeleteStoreFaqState.DeleteStoreFaqIsSuccess = true;
      })
      .addCase(DeleteStoreFaq.rejected, (state, action) => {
        state.DeleteStoreFaqState.DeleteStoreFaqIsLoading = false;
        state.DeleteStoreFaqState.DeleteStoreFaqIsSuccess = false;
        state.DeleteStoreFaqState.DeleteStoreFaqIsError =
          action.payload || "Something went wrong";
      })
      // FetchLibraryDocuments
      .addCase(FetchLibraryDocuments.pending, (state) => {
        state.FetchLibraryDocumentsState.FetchLibraryDocumentsIsLoading = true;
        state.FetchLibraryDocumentsState.FetchLibraryDocumentsIsSuccess = false;
        state.FetchLibraryDocumentsState.FetchLibraryDocumentsIsError = null;
      })
      .addCase(FetchLibraryDocuments.fulfilled, (state, action) => {
        state.FetchLibraryDocumentsState.FetchLibraryDocumentsIsLoading = false;
        state.FetchLibraryDocumentsState.FetchLibraryDocumentsIsSuccess = true;
        state.FetchLibraryDocumentsState.FetchLibraryDocumentsListData =
          action.payload;
      })
      .addCase(FetchLibraryDocuments.rejected, (state, action) => {
        state.FetchLibraryDocumentsState.FetchLibraryDocumentsIsLoading = false;
        state.FetchLibraryDocumentsState.FetchLibraryDocumentsIsSuccess = false;
        state.FetchLibraryDocumentsState.FetchLibraryDocumentsIsError =
          action.payload || "Something went wrong";
      })
      // UploadLibraryDocument
      .addCase(UploadLibraryDocument.pending, (state) => {
        state.UploadLibraryDocumentState.UploadLibraryDocumentIsLoading = true;
        state.UploadLibraryDocumentState.UploadLibraryDocumentIsSuccess = false;
        state.UploadLibraryDocumentState.UploadLibraryDocumentIsError = null;
      })
      .addCase(UploadLibraryDocument.fulfilled, (state) => {
        state.UploadLibraryDocumentState.UploadLibraryDocumentIsLoading = false;
        state.UploadLibraryDocumentState.UploadLibraryDocumentIsSuccess = true;
      })
      .addCase(UploadLibraryDocument.rejected, (state, action) => {
        state.UploadLibraryDocumentState.UploadLibraryDocumentIsLoading = false;
        state.UploadLibraryDocumentState.UploadLibraryDocumentIsSuccess = false;
        state.UploadLibraryDocumentState.UploadLibraryDocumentIsError =
          action.payload || "Something went wrong";
      })
      // FetchStorePolicies
      .addCase(FetchStorePolicies.pending, (state) => {
        state.FetchStorePoliciesState.FetchStorePoliciesIsLoading = true;
        state.FetchStorePoliciesState.FetchStorePoliciesIsSuccess = false;
        state.FetchStorePoliciesState.FetchStorePoliciesIsError = null;
      })
      .addCase(FetchStorePolicies.fulfilled, (state, action) => {
        state.FetchStorePoliciesState.FetchStorePoliciesIsLoading = false;
        state.FetchStorePoliciesState.FetchStorePoliciesIsSuccess = true;
        state.FetchStorePoliciesState.FetchStorePoliciesListData =
          action.payload;
      })
      .addCase(FetchStorePolicies.rejected, (state, action) => {
        state.FetchStorePoliciesState.FetchStorePoliciesIsLoading = false;
        state.FetchStorePoliciesState.FetchStorePoliciesIsSuccess = false;
        state.FetchStorePoliciesState.FetchStorePoliciesIsError =
          action.payload || "Something went wrong";
      })
      // CreateStorePolicy
      .addCase(CreateStorePolicy.pending, (state) => {
        state.CreateStorePolicyState.CreateStorePolicyIsLoading = true;
        state.CreateStorePolicyState.CreateStorePolicyIsSuccess = false;
        state.CreateStorePolicyState.CreateStorePolicyIsError = null;
      })
      .addCase(CreateStorePolicy.fulfilled, (state) => {
        state.CreateStorePolicyState.CreateStorePolicyIsLoading = false;
        state.CreateStorePolicyState.CreateStorePolicyIsSuccess = true;
      })
      .addCase(CreateStorePolicy.rejected, (state, action) => {
        state.CreateStorePolicyState.CreateStorePolicyIsLoading = false;
        state.CreateStorePolicyState.CreateStorePolicyIsSuccess = false;
        state.CreateStorePolicyState.CreateStorePolicyIsError =
          action.payload || "Something went wrong";
      })
      // FetchStorePolicyType
      .addCase(FetchStorePolicyType.pending, (state) => {
        state.FetchStorePolicyTypeState.FetchStorePolicyTypeIsLoading = true;
        state.FetchStorePolicyTypeState.FetchStorePolicyTypeIsSuccess = false;
        state.FetchStorePolicyTypeState.FetchStorePolicyTypeIsError = null;
      })
      .addCase(FetchStorePolicyType.fulfilled, (state, action) => {
        state.FetchStorePolicyTypeState.FetchStorePolicyTypeIsLoading = false;
        state.FetchStorePolicyTypeState.FetchStorePolicyTypeIsSuccess = true;
        state.FetchStorePolicyTypeState.FetchStorePolicyTypeListData =
          action.payload;
      })
      .addCase(FetchStorePolicyType.rejected, (state, action) => {
        state.FetchStorePolicyTypeState.FetchStorePolicyTypeIsLoading = false;
        state.FetchStorePolicyTypeState.FetchStorePolicyTypeIsSuccess = false;
        state.FetchStorePolicyTypeState.FetchStorePolicyTypeIsError =
          action.payload || "Something went wrong";
      });
  },
});

export default KnowledgeSlice.reducer;
