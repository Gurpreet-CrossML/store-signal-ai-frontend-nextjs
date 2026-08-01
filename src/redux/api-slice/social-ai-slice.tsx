import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { axiosInstance } from "../axios-config";
import { ENDPOINTS } from "@/lib/config";
import { isAxiosError } from "axios";
import { toast } from "sonner";

type MetaOAuthUrlResponse = {
  authorize_url: string;
};

export type ConnectedAccount = {
  id: string;
  channel_type: string;
  external_id: string;
  name: string;
  username: string;
  profile_picture_url: string;
  webhook_status: string;
  is_active: boolean;
  last_event_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SocialAccountsSubscriptionsResponse = {
  results: ConnectedAccount[];
  count: number;
  next?: string | null;
  previous?: string | null;
};

export type MetaPage = {
  id: number;
  external_id: string;
  name: string;
  username: string;
  profile_picture_url: string;
  webhook_status: string;
  is_active: boolean;
  last_event_at: string | null;
};

export type MetaPost = {
  id: number;
  external_id: string;
  content: string;
  permalink: string;
  media_type: string;
  like_count: number | null;
  comments_count: number;
  posted_at: string;
  is_published: boolean;
  image_url: string | null;
};

export type MetaComment = {
  id: number;
  external_message_id: string;
  sender_type: string;
  message_direction: string;
  content: string;
  like_count: number;
  is_hidden: boolean;
  external_created_at: string | null;
  post_id: number | null;
  social_user_id: number | null;
  author_name: string | null;
  author_username: string | null;
  author_avatar: string | null;
};

export type MetaDm = {
  id: number;
  external_message_id: string;
  sender_type: string;
  message_direction: string;
  content: string;
  external_created_at: string | null;
  social_user_id: number | null;
  contact_external_id: string | null;
  contact_name: string | null;
  contact_username: string | null;
  contact_avatar: string | null;
};

export const fetchSocialAccountsSubscriptions = createAsyncThunk(
  "fetchSocialAccountsSubscriptions",
  async (storeCode: string, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchSocialAccountsSubscriptions()}?store_code=${storeCode}`,
        {
          useBackend: true,
        },
      );
      const data = response.data.data;
      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to fetch social subscriptions, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const createMetaOAuthUrl = createAsyncThunk(
  "createMetaOAuthUrl",
  async (storeCode: string, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.createMetaOAuthUrl()}?store_code=${storeCode}`,
        {
          useBackend: true,
        },
      );
      const data = response.data.data;
      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to fetch Meta OAuth URL, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const fetchMetaPages = createAsyncThunk(
  "fetchMetaPages",
  async (storeCode: string, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchMetaPages()}?store_code=${storeCode}`,
      );
      return response.data.data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to fetch Meta pages, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

type FetchMetaPostsArgs = { accountId: number; storeCode: string };

export const fetchMetaPosts = createAsyncThunk(
  "fetchMetaPosts",
  async ({ accountId, storeCode }: FetchMetaPostsArgs, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchMetaPosts()}?account_id=${accountId}&store_code=${storeCode}`,
      );
      return response.data.data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to fetch Meta posts, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

type FetchMetaCommentsArgs = { postId: number; storeCode: string };

export const fetchMetaComments = createAsyncThunk(
  "fetchMetaComments",
  async ({ postId, storeCode }: FetchMetaCommentsArgs, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchMetaComments()}?post_id=${postId}&store_code=${storeCode}`,
      );
      return response.data.data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to fetch Meta comments, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

type FetchMetaDmsArgs = { accountId: number; storeCode: string };

export const fetchMetaDms = createAsyncThunk(
  "fetchMetaDms",
  async ({ accountId, storeCode }: FetchMetaDmsArgs, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchMetaDms()}?account_id=${accountId}&store_code=${storeCode}`,
      );
      return response.data.data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message || "Unable to fetch Meta DMs, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const likeMetaComment = createAsyncThunk(
  "likeMetaComment",
  async (messageId: string, thunkAPI) => {
    try {
      const response = await axiosInstance.post(
        ENDPOINTS.likeMessage(messageId),
        {},
        { useBackend: true },
      );
      return response.data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Uh oh! Something went wrong.", {
        description: data?.message || "Unable to like item.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const hideMetaComment = createAsyncThunk(
  "hideMetaComment",
  async (
    { messageId, is_hidden }: { messageId: string; is_hidden: boolean },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(
        ENDPOINTS.hideMessage(messageId),
        { is_hidden },
        { useBackend: true },
      );
      return response.data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Uh oh! Something went wrong.", {
        description: data?.message || "Unable to hide item.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const deleteMetaComment = createAsyncThunk(
  "deleteMetaComment",
  async (messageId: string, thunkAPI) => {
    try {
      const response = await axiosInstance.delete(
        ENDPOINTS.deleteMessage(messageId),
        { useBackend: true },
      );
      return response.data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Uh oh! Something went wrong.", {
        description: data?.message || "Unable to delete item.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const replyToMetaMessage = createAsyncThunk(
  "replyToMetaMessage",
  async (
    { messageId, message }: { messageId: string; message: string },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(
        ENDPOINTS.replyMessage(messageId),
        { message },
        { useBackend: true },
      );
      return response.data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Uh oh! Something went wrong.", {
        description: data?.message || "Unable to reply to message.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const reactToMetaMessage = createAsyncThunk(
  "reactToMetaMessage",
  async (
    { messageId, reaction }: { messageId: string; reaction: string },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(
        ENDPOINTS.reactMessage(messageId),
        { reaction },
        { useBackend: true },
      );
      return response.data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Uh oh! Something went wrong.", {
        description: data?.message || "Unable to react to message.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const replyToMetaComment = createAsyncThunk(
  "replyToMetaComment",
  async (
    { messageId, message }: { messageId: string; message: string },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(
        ENDPOINTS.replyComment(messageId),
        { message },
        { useBackend: true },
      );
      return response.data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Uh oh! Something went wrong.", {
        description: data?.message || "Unable to reply to comment.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

const SocialAISlice = createSlice({
  name: "SocialAI",
  initialState: {
    FetchMetaOauthURLState: {
      FetchMetaOauthURLIsLoading: false,
      FetchMetaOauthURLIsSuccess: false,
      FetchMetaOauthURLIsError: null as null | string | object,
      FetchMetaOauthURLData: {} as MetaOAuthUrlResponse,
    },
    FetchSocialAccountSubscriptionsState: {
      FetchSocialAccountsSubscriptionsIsLoading: false,
      FetchSocialAccountsSubscriptionsIsSuccess: false,
      FetchSocialAccountsSubscriptionsIsError: null as null | string | object,
      FetchSocialAccountsSubscriptionsData:
        {} as SocialAccountsSubscriptionsResponse,
    },
    FetchMetaPagesState: {
      FetchMetaPagesIsLoading: false,
      FetchMetaPagesIsSuccess: false,
      FetchMetaPagesIsError: null as null | string | object,
      FetchMetaPagesData: [] as MetaPage[],
    },
    FetchMetaPostsState: {
      FetchMetaPostsIsLoading: false,
      FetchMetaPostsIsSuccess: false,
      FetchMetaPostsIsError: null as null | string | object,
      FetchMetaPostsData: [] as MetaPost[],
    },
    FetchMetaCommentsState: {
      FetchMetaCommentsIsLoading: false,
      FetchMetaCommentsIsSuccess: false,
      FetchMetaCommentsIsError: null as null | string | object,
      FetchMetaCommentsData: [] as MetaComment[],
    },
    FetchMetaDmsState: {
      FetchMetaDmsIsLoading: false,
      FetchMetaDmsIsSuccess: false,
      FetchMetaDmsIsError: null as null | string | object,
      FetchMetaDmsData: [] as MetaDm[],
    },
    LikeMetaCommentState: {
      isLoading: false,
      isSuccess: false,
      isError: null as null | string | object,
    },
    HideMetaCommentState: {
      isLoading: false,
      isSuccess: false,
      isError: null as null | string | object,
    },
    DeleteMetaCommentState: {
      isLoading: false,
      isSuccess: false,
      isError: null as null | string | object,
    },
    ReplyToMetaMessageState: {
      isLoading: false,
      isSuccess: false,
      isError: null as null | string | object,
    },
    ReplyToMetaCommentState: {
      isLoading: false,
      isSuccess: false,
      isError: null as null | string | object,
    },
    ReactToMetaMessageState: {
      isLoading: false,
      isSuccess: false,
      isError: null as null | string | object,
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createMetaOAuthUrl.pending, (state) => {
        state.FetchMetaOauthURLState.FetchMetaOauthURLIsLoading = true;
        state.FetchMetaOauthURLState.FetchMetaOauthURLIsSuccess = false;
        state.FetchMetaOauthURLState.FetchMetaOauthURLIsError = null;
      })
      .addCase(createMetaOAuthUrl.fulfilled, (state, action) => {
        state.FetchMetaOauthURLState.FetchMetaOauthURLIsLoading = false;
        state.FetchMetaOauthURLState.FetchMetaOauthURLIsSuccess = true;
        state.FetchMetaOauthURLState.FetchMetaOauthURLData = action.payload;
      })
      .addCase(createMetaOAuthUrl.rejected, (state, action) => {
        state.FetchMetaOauthURLState.FetchMetaOauthURLIsLoading = false;
        state.FetchMetaOauthURLState.FetchMetaOauthURLIsSuccess = false;
        state.FetchMetaOauthURLState.FetchMetaOauthURLIsError =
          action.payload as string | object;
      })
      .addCase(fetchSocialAccountsSubscriptions.pending, (state) => {
        state.FetchSocialAccountSubscriptionsState.FetchSocialAccountsSubscriptionsIsLoading = true;
        state.FetchSocialAccountSubscriptionsState.FetchSocialAccountsSubscriptionsIsSuccess = false;
        state.FetchSocialAccountSubscriptionsState.FetchSocialAccountsSubscriptionsIsError =
          null;
      })
      .addCase(fetchSocialAccountsSubscriptions.fulfilled, (state, action) => {
        state.FetchSocialAccountSubscriptionsState.FetchSocialAccountsSubscriptionsIsLoading = false;
        state.FetchSocialAccountSubscriptionsState.FetchSocialAccountsSubscriptionsIsSuccess = true;
        state.FetchSocialAccountSubscriptionsState.FetchSocialAccountsSubscriptionsData =
          action.payload;
      })
      .addCase(fetchSocialAccountsSubscriptions.rejected, (state, action) => {
        state.FetchSocialAccountSubscriptionsState.FetchSocialAccountsSubscriptionsIsLoading = false;
        state.FetchSocialAccountSubscriptionsState.FetchSocialAccountsSubscriptionsIsSuccess = false;
        state.FetchSocialAccountSubscriptionsState.FetchSocialAccountsSubscriptionsIsError =
          action.payload as string | object;
      })
      .addCase(fetchMetaPages.pending, (state) => {
        state.FetchMetaPagesState.FetchMetaPagesIsLoading = true;
        state.FetchMetaPagesState.FetchMetaPagesIsSuccess = false;
        state.FetchMetaPagesState.FetchMetaPagesIsError = null;
      })
      .addCase(fetchMetaPages.fulfilled, (state, action) => {
        state.FetchMetaPagesState.FetchMetaPagesIsLoading = false;
        state.FetchMetaPagesState.FetchMetaPagesIsSuccess = true;
        state.FetchMetaPagesState.FetchMetaPagesData = action.payload;
      })
      .addCase(fetchMetaPages.rejected, (state, action) => {
        state.FetchMetaPagesState.FetchMetaPagesIsLoading = false;
        state.FetchMetaPagesState.FetchMetaPagesIsSuccess = false;
        state.FetchMetaPagesState.FetchMetaPagesIsError = action.payload as
          | string
          | object;
      })
      .addCase(fetchMetaPosts.pending, (state) => {
        state.FetchMetaPostsState.FetchMetaPostsIsLoading = true;
        state.FetchMetaPostsState.FetchMetaPostsIsSuccess = false;
        state.FetchMetaPostsState.FetchMetaPostsIsError = null;
      })
      .addCase(fetchMetaPosts.fulfilled, (state, action) => {
        state.FetchMetaPostsState.FetchMetaPostsIsLoading = false;
        state.FetchMetaPostsState.FetchMetaPostsIsSuccess = true;
        state.FetchMetaPostsState.FetchMetaPostsData = action.payload;
      })
      .addCase(fetchMetaPosts.rejected, (state, action) => {
        state.FetchMetaPostsState.FetchMetaPostsIsLoading = false;
        state.FetchMetaPostsState.FetchMetaPostsIsSuccess = false;
        state.FetchMetaPostsState.FetchMetaPostsIsError = action.payload as
          | string
          | object;
      })
      .addCase(fetchMetaComments.pending, (state) => {
        state.FetchMetaCommentsState.FetchMetaCommentsIsLoading = true;
        state.FetchMetaCommentsState.FetchMetaCommentsIsSuccess = false;
        state.FetchMetaCommentsState.FetchMetaCommentsIsError = null;
      })
      .addCase(fetchMetaComments.fulfilled, (state, action) => {
        state.FetchMetaCommentsState.FetchMetaCommentsIsLoading = false;
        state.FetchMetaCommentsState.FetchMetaCommentsIsSuccess = true;
        state.FetchMetaCommentsState.FetchMetaCommentsData = action.payload;
      })
      .addCase(fetchMetaComments.rejected, (state, action) => {
        state.FetchMetaCommentsState.FetchMetaCommentsIsLoading = false;
        state.FetchMetaCommentsState.FetchMetaCommentsIsSuccess = false;
        state.FetchMetaCommentsState.FetchMetaCommentsIsError =
          action.payload as string | object;
      })
      .addCase(fetchMetaDms.pending, (state) => {
        state.FetchMetaDmsState.FetchMetaDmsIsLoading = true;
        state.FetchMetaDmsState.FetchMetaDmsIsSuccess = false;
        state.FetchMetaDmsState.FetchMetaDmsIsError = null;
      })
      .addCase(fetchMetaDms.fulfilled, (state, action) => {
        state.FetchMetaDmsState.FetchMetaDmsIsLoading = false;
        state.FetchMetaDmsState.FetchMetaDmsIsSuccess = true;
        state.FetchMetaDmsState.FetchMetaDmsData = action.payload;
      })
      .addCase(fetchMetaDms.rejected, (state, action) => {
        state.FetchMetaDmsState.FetchMetaDmsIsLoading = false;
        state.FetchMetaDmsState.FetchMetaDmsIsSuccess = false;
        state.FetchMetaDmsState.FetchMetaDmsIsError = action.payload as
          | string
          | object;
      })
      .addCase(likeMetaComment.pending, (state) => {
        state.LikeMetaCommentState.isLoading = true;
        state.LikeMetaCommentState.isSuccess = false;
        state.LikeMetaCommentState.isError = null;
      })
      .addCase(likeMetaComment.fulfilled, (state) => {
        state.LikeMetaCommentState.isLoading = false;
        state.LikeMetaCommentState.isSuccess = true;
      })
      .addCase(likeMetaComment.rejected, (state, action) => {
        state.LikeMetaCommentState.isLoading = false;
        state.LikeMetaCommentState.isSuccess = false;
        state.LikeMetaCommentState.isError = action.payload as string | object;
      })
      .addCase(hideMetaComment.pending, (state) => {
        state.HideMetaCommentState.isLoading = true;
        state.HideMetaCommentState.isSuccess = false;
        state.HideMetaCommentState.isError = null;
      })
      .addCase(hideMetaComment.fulfilled, (state) => {
        state.HideMetaCommentState.isLoading = false;
        state.HideMetaCommentState.isSuccess = true;
      })
      .addCase(hideMetaComment.rejected, (state, action) => {
        state.HideMetaCommentState.isLoading = false;
        state.HideMetaCommentState.isSuccess = false;
        state.HideMetaCommentState.isError = action.payload as string | object;
      })
      .addCase(deleteMetaComment.pending, (state) => {
        state.DeleteMetaCommentState.isLoading = true;
        state.DeleteMetaCommentState.isSuccess = false;
        state.DeleteMetaCommentState.isError = null;
      })
      .addCase(deleteMetaComment.fulfilled, (state) => {
        state.DeleteMetaCommentState.isLoading = false;
        state.DeleteMetaCommentState.isSuccess = true;
      })
      .addCase(deleteMetaComment.rejected, (state, action) => {
        state.DeleteMetaCommentState.isLoading = false;
        state.DeleteMetaCommentState.isSuccess = false;
        state.DeleteMetaCommentState.isError = action.payload as
          | string
          | object;
      })
      .addCase(replyToMetaMessage.pending, (state) => {
        state.ReplyToMetaMessageState.isLoading = true;
        state.ReplyToMetaMessageState.isSuccess = false;
        state.ReplyToMetaMessageState.isError = null;
      })
      .addCase(replyToMetaMessage.fulfilled, (state) => {
        state.ReplyToMetaMessageState.isLoading = false;
        state.ReplyToMetaMessageState.isSuccess = true;
      })
      .addCase(replyToMetaMessage.rejected, (state, action) => {
        state.ReplyToMetaMessageState.isLoading = false;
        state.ReplyToMetaMessageState.isSuccess = false;
        state.ReplyToMetaMessageState.isError = action.payload as
          | string
          | object;
      })
      .addCase(replyToMetaComment.pending, (state) => {
        state.ReplyToMetaCommentState.isLoading = true;
        state.ReplyToMetaCommentState.isSuccess = false;
        state.ReplyToMetaCommentState.isError = null;
      })
      .addCase(replyToMetaComment.fulfilled, (state) => {
        state.ReplyToMetaCommentState.isLoading = false;
        state.ReplyToMetaCommentState.isSuccess = true;
      })
      .addCase(replyToMetaComment.rejected, (state, action) => {
        state.ReplyToMetaCommentState.isLoading = false;
        state.ReplyToMetaCommentState.isSuccess = false;
        state.ReplyToMetaCommentState.isError = action.payload as
          | string
          | object;
      })
      .addCase(reactToMetaMessage.pending, (state) => {
        state.ReactToMetaMessageState.isLoading = true;
        state.ReactToMetaMessageState.isSuccess = false;
        state.ReactToMetaMessageState.isError = null;
      })
      .addCase(reactToMetaMessage.fulfilled, (state) => {
        state.ReactToMetaMessageState.isLoading = false;
        state.ReactToMetaMessageState.isSuccess = true;
      })
      .addCase(reactToMetaMessage.rejected, (state, action) => {
        state.ReactToMetaMessageState.isLoading = false;
        state.ReactToMetaMessageState.isSuccess = false;
        state.ReactToMetaMessageState.isError = action.payload as
          | string
          | object;
      });
  },
});

export default SocialAISlice.reducer;
