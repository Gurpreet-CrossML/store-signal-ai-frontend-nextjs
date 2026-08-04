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

export type SocialPostMediaEntry = {
  id: string;
  media_type: string;
  position: number;
  url: string;
  thumbnail_url: string;
  // Instagram's Graph API returns no dimensions for images — null there.
  width: number | null;
  height: number | null;
};

export type SocialPost = {
    id: number;
    account_name: string;
    external_id: string;
    channel_type: string;
    content: string;
    permalink: string;
    media_type: string;
    like_count: number;
    comments_count: number;
    posted_at: string;
    media_entries: SocialPostMediaEntry[];
};

export type SocialPostsResponse = {
  results: SocialPost[];
  count: number;
  next?: string | null;
  previous?: string | null;
};

export type SocialUser = {
  id: number;
  external_id: string;
  name: string;
  username: string;
  profile_picture_url: string;
};

export type SocialComment = {
  id: number;
  post: number;
  external_message_id: string;
  content: string;
  like_count: number;
  social_user: SocialUser | null;
  // "user" for customer comments; "agent"/"ai" when the page itself replied.
  sender_type: string;
  parent_message: number | null;
  reply_count: number;
  is_hidden: boolean;
  owner_liked: boolean;
  is_deleted: boolean;
  external_created_at: string;
};

export type SocialCommentsResponse = {
  results: SocialComment[];
  count: number;
  next?: string | null;
  previous?: string | null;
};

export type SocialDmReplyTo = {
    id: number;
    content: string;
    sender_name: string | null;
};

export type SocialDm = {
    id: number;
    external_message_id: string;
    content: string;
    sender_type: string;
    message_direction: string;
    social_user: SocialUser | null;
    external_created_at: string | null;
    owner_reaction: string | null;
    reply_to: SocialDmReplyTo | null;
};

export type SocialDmsResponse = {
    results: SocialDm[];
    count: number;
    next?: string | null;
    previous?: string | null;
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

export const fetchSocialPosts = createAsyncThunk(
    "fetchSocialPosts",
    async (
        { storeCode, channelType }: { storeCode: string; channelType?: string },
        thunkAPI,
    ) => {
        try {
            const response = await axiosInstance.get(
                `${ENDPOINTS.fetchSocialPosts()}?store_code=${storeCode}${channelType ? `&channel_type=${channelType}` : ""}`,
                {
                    useBackend: true,
                }
            );
            const data = response.data.data;
            return data;
        } catch (error) {
            const response = isAxiosError(error) ? error.response : undefined;
            const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message || "Unable to fetch posts, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const fetchMetaPages = createAsyncThunk(
  "fetchMetaPages",
  async (
    { storeCode, channelType }: { storeCode: string; channelType?: string },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchMetaPages()}?store_code=${storeCode}${channelType ? `&channel_type=${channelType}` : ""}`,
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
          "Unable to fetch connected pages, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const fetchPostComments = createAsyncThunk(
    "fetchPostComments",
    async (
        { storeCode, postId, page = 1, pageSize = 15, parentId }: { storeCode: string; postId: number; page?: number; pageSize?: number; parentId?: number },
        thunkAPI,
    ) => {
        try {
            const response = await axiosInstance.get(
                `${ENDPOINTS.fetchPostComments()}?store_code=${storeCode}&post=${postId}&page=${page}&page_size=${pageSize}${parentId ? `&parent=${parentId}` : ""}`,
                {
                    useBackend: true,
                }
            );
            const data = response.data.data;
            return data;
        } catch (error) {
            const response = isAxiosError(error) ? error.response : undefined;
            const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to fetch post comments, please try again later.",
      });

            return thunkAPI.rejectWithValue(data || "Something went wrong");
        }
    },
);

export const fetchSocialDms = createAsyncThunk(
    "fetchSocialDms",
    async (
        { storeCode, accountId, page = 1, pageSize = 50, search }: { storeCode: string; accountId: number; page?: number; pageSize?: number; search?: string },
        thunkAPI,
    ) => {
        try {
            const response = await axiosInstance.get(
                `${ENDPOINTS.fetchSocialDms()}?store_code=${storeCode}&account=${accountId}&page=${page}&page_size=${pageSize}${search ? `&search=${encodeURIComponent(search)}` : ""}`,
                {
                    useBackend: true,
                }
            );
            const data = response.data.data;
            return data;
        } catch (error) {
            const response = isAxiosError(error) ? error.response : undefined;
            const data = response?.data;

            toast.error("Uh oh! Something went wrong.", {
                description:
                    data?.message ||
                    "Unable to fetch messages, please try again later.",
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
        ENDPOINTS.likeComment(messageId),
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
        ENDPOINTS.hideComment(messageId),
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
        ENDPOINTS.deleteComment(messageId),
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
        FetchSocialPostsState: {
            FetchSocialPostsIsLoading: false,
            FetchSocialPostsIsSuccess: false,
            FetchSocialPostsIsError: null as null | string | object,
            FetchSocialPostsData: {} as SocialPostsResponse,
        },
        FetchPostCommentsState: {
            FetchPostCommentsIsLoading: false,
            FetchPostCommentsIsSuccess: false,
            FetchPostCommentsIsError: null as null | string | object,
            FetchPostCommentsData: {} as SocialCommentsResponse,
        },
        FetchMetaPagesState: {
            FetchMetaPagesIsLoading: false,
            FetchMetaPagesIsSuccess: false,
            FetchMetaPagesIsError: null as null | string | object,
            FetchMetaPagesData: [] as ConnectedAccount[],
        },
        FetchSocialDmsState: {
            FetchSocialDmsIsLoading: false,
            FetchSocialDmsIsSuccess: false,
            FetchSocialDmsIsError: null as null | string | object,
            FetchSocialDmsData: {} as SocialDmsResponse,
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
      .addCase(fetchSocialPosts.pending, (state) => {
                state.FetchSocialPostsState.FetchSocialPostsIsLoading = true;
                state.FetchSocialPostsState.FetchSocialPostsIsSuccess = false;
                state.FetchSocialPostsState.FetchSocialPostsIsError = null;
            })
            .addCase(fetchSocialPosts.fulfilled, (state, action) => {
                state.FetchSocialPostsState.FetchSocialPostsIsLoading = false;
                state.FetchSocialPostsState.FetchSocialPostsIsSuccess = true;
                state.FetchSocialPostsState.FetchSocialPostsData = action.payload;
            })
            .addCase(fetchSocialPosts.rejected, (state, action) => {
                state.FetchSocialPostsState.FetchSocialPostsIsLoading = false;
                state.FetchSocialPostsState.FetchSocialPostsIsSuccess = false;
                state.FetchSocialPostsState.FetchSocialPostsIsError = action.payload as string | object;
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
                state.FetchMetaPagesState.FetchMetaPagesIsError = action.payload as string | object;
            })
            .addCase(fetchPostComments.pending, (state) => {
                state.FetchPostCommentsState.FetchPostCommentsIsLoading = true;
                state.FetchPostCommentsState.FetchPostCommentsIsSuccess = false;
                state.FetchPostCommentsState.FetchPostCommentsIsError = null;
            })
            .addCase(fetchPostComments.fulfilled, (state, action) => {
                state.FetchPostCommentsState.FetchPostCommentsIsLoading = false;
                state.FetchPostCommentsState.FetchPostCommentsIsSuccess = true;
                state.FetchPostCommentsState.FetchPostCommentsData = action.payload;
            })
            .addCase(fetchPostComments.rejected, (state, action) => {
                state.FetchPostCommentsState.FetchPostCommentsIsLoading = false;
                state.FetchPostCommentsState.FetchPostCommentsIsSuccess = false;
                state.FetchPostCommentsState.FetchPostCommentsIsError = action.payload as string | object;
      })
      .addCase(fetchSocialDms.pending, (state) => {
        state.FetchSocialDmsState.FetchSocialDmsIsLoading = true;
        state.FetchSocialDmsState.FetchSocialDmsIsSuccess = false;
        state.FetchSocialDmsState.FetchSocialDmsIsError = null;
      })
      .addCase(fetchSocialDms.fulfilled, (state, action) => {
        state.FetchSocialDmsState.FetchSocialDmsIsLoading = false;
        state.FetchSocialDmsState.FetchSocialDmsIsSuccess = true;
        state.FetchSocialDmsState.FetchSocialDmsData = action.payload;
      })
      .addCase(fetchSocialDms.rejected, (state, action) => {
        state.FetchSocialDmsState.FetchSocialDmsIsLoading = false;
        state.FetchSocialDmsState.FetchSocialDmsIsSuccess = false;
        state.FetchSocialDmsState.FetchSocialDmsIsError = action.payload as string | object;
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

