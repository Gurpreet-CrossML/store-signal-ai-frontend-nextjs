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
    id: string;
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
    external_created_at: string;
};

export type SocialCommentsResponse = {
    results: SocialComment[];
    count: number;
    next?: string | null;
    previous?: string | null;
};

// Shared row shape — Facebook and Instagram pages/posts/comments/DMs come back
// identically shaped from the API; only the endpoint (and therefore the
// platform they're scoped to) differs. See ENDPOINTS.fetch{Facebook,Instagram}*
// in src/lib/config.ts.
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
  // Set on `is_owner_reaction` / the contact's own reaction row, respectively —
  // at most one of each per message (DB unique indexes). See ENDPOINTS.reactMessage.
  owner_reaction: string | null;
  contact_reaction: string | null;
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
        { storeCode, accountId, channelType }: { storeCode: string; accountId: string; channelType?: string },
        thunkAPI,
    ) => {
        try {
            const response = await axiosInstance.get(
                `${ENDPOINTS.fetchSocialPosts({ accountId })}?store_code=${storeCode}${channelType ? `&channel_type=${channelType}` : ""}`,
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
                    "Unable to fetch posts, please try again later.",
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
                    "Unable to fetch connected pages, please try again later.",
            });

            return thunkAPI.rejectWithValue(data || "Something went wrong");
        }
    },
);

export const fetchPostComments = createAsyncThunk(
    "fetchPostComments",
    async (
        { storeCode, postId, page = 1, pageSize = 15, parentId }: { storeCode: string; postId: string; page?: number; pageSize?: number; parentId?: number },
        thunkAPI,
    ) => {
        try {
            const response = await axiosInstance.get(
                `${ENDPOINTS.fetchPostComments({ postId })}?store_code=${storeCode}&page=${page}&page_size=${pageSize}${parentId ? `&parent=${parentId}` : ""}`,
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

// ---- Pages (page/account switcher) ----

export const fetchFacebookPages = createAsyncThunk(
  "fetchFacebookPages",
  async (storeCode: string, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchFacebookPages()}?store_code=${storeCode}`,
      );
      return response.data.data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to fetch Facebook pages, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const fetchInstagramPages = createAsyncThunk(
  "fetchInstagramPages",
  async (storeCode: string, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchInstagramPages()}?store_code=${storeCode}`,
      );
      return response.data.data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to fetch Instagram pages, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

// ---- Posts ----

type FetchFacebookPostsArgs = { accountId: number; storeCode: string };

export const fetchFacebookPosts = createAsyncThunk(
  "fetchFacebookPosts",
  async ({ accountId, storeCode }: FetchFacebookPostsArgs, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchFacebookPosts()}?account_id=${accountId}&store_code=${storeCode}`,
      );
      return response.data.data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to fetch Facebook posts, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

type FetchInstagramPostsArgs = { accountId: number; storeCode: string };

export const fetchInstagramPosts = createAsyncThunk(
  "fetchInstagramPosts",
  async ({ accountId, storeCode }: FetchInstagramPostsArgs, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchInstagramPosts()}?account_id=${accountId}&store_code=${storeCode}`,
      );
      return response.data.data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to fetch Instagram posts, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

// ---- Comments ----

type FetchFacebookCommentsArgs = { postId: number; storeCode: string };

export const fetchFacebookComments = createAsyncThunk(
  "fetchFacebookComments",
  async ({ postId, storeCode }: FetchFacebookCommentsArgs, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchFacebookComments()}?post_id=${postId}&store_code=${storeCode}`,
      );
      return response.data.data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to fetch Facebook comments, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

type FetchInstagramCommentsArgs = { postId: number; storeCode: string };

export const fetchInstagramComments = createAsyncThunk(
  "fetchInstagramComments",
  async ({ postId, storeCode }: FetchInstagramCommentsArgs, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchInstagramComments()}?post_id=${postId}&store_code=${storeCode}`,
      );
      return response.data.data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to fetch Instagram comments, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

// ---- DMs ----

type FetchFacebookDmsArgs = { accountId: number; storeCode: string };

export const fetchFacebookDms = createAsyncThunk(
  "fetchFacebookDms",
  async ({ accountId, storeCode }: FetchFacebookDmsArgs, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchFacebookDms()}?account_id=${accountId}&store_code=${storeCode}`,
      );
      return response.data.data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to fetch Facebook DMs, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

type FetchInstagramDmsArgs = { accountId: number; storeCode: string };

export const fetchInstagramDms = createAsyncThunk(
  "fetchInstagramDms",
  async ({ accountId, storeCode }: FetchInstagramDmsArgs, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchInstagramDms()}?account_id=${accountId}&store_code=${storeCode}`,
      );
      return response.data.data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to fetch Instagram DMs, please try again later.",
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
    FetchFacebookPagesState: {
      FetchFacebookPagesIsLoading: false,
      FetchFacebookPagesIsSuccess: false,
      FetchFacebookPagesIsError: null as null | string | object,
      FetchFacebookPagesData: [] as MetaPage[],
    },
    FetchInstagramPagesState: {
      FetchInstagramPagesIsLoading: false,
      FetchInstagramPagesIsSuccess: false,
      FetchInstagramPagesIsError: null as null | string | object,
      FetchInstagramPagesData: [] as MetaPage[],
    },
    FetchFacebookPostsState: {
      FetchFacebookPostsIsLoading: false,
      FetchFacebookPostsIsSuccess: false,
      FetchFacebookPostsIsError: null as null | string | object,
      FetchFacebookPostsData: [] as MetaPost[],
    },
    FetchInstagramPostsState: {
      FetchInstagramPostsIsLoading: false,
      FetchInstagramPostsIsSuccess: false,
      FetchInstagramPostsIsError: null as null | string | object,
      FetchInstagramPostsData: [] as MetaPost[],
    },
    FetchFacebookCommentsState: {
      FetchFacebookCommentsIsLoading: false,
      FetchFacebookCommentsIsSuccess: false,
      FetchFacebookCommentsIsError: null as null | string | object,
      FetchFacebookCommentsData: [] as MetaComment[],
    },
    FetchInstagramCommentsState: {
      FetchInstagramCommentsIsLoading: false,
      FetchInstagramCommentsIsSuccess: false,
      FetchInstagramCommentsIsError: null as null | string | object,
      FetchInstagramCommentsData: [] as MetaComment[],
    },
    FetchFacebookDmsState: {
      FetchFacebookDmsIsLoading: false,
      FetchFacebookDmsIsSuccess: false,
      FetchFacebookDmsIsError: null as null | string | object,
      FetchFacebookDmsData: [] as MetaDm[],
    },
    FetchInstagramDmsState: {
      FetchInstagramDmsIsLoading: false,
      FetchInstagramDmsIsSuccess: false,
      FetchInstagramDmsIsError: null as null | string | object,
      FetchInstagramDmsData: [] as MetaDm[],
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
      .addCase(fetchFacebookPages.pending, (state) => {
        state.FetchFacebookPagesState.FetchFacebookPagesIsLoading = true;
        state.FetchFacebookPagesState.FetchFacebookPagesIsSuccess = false;
        state.FetchFacebookPagesState.FetchFacebookPagesIsError = null;
      })
      .addCase(fetchFacebookPages.fulfilled, (state, action) => {
        state.FetchFacebookPagesState.FetchFacebookPagesIsLoading = false;
        state.FetchFacebookPagesState.FetchFacebookPagesIsSuccess = true;
        state.FetchFacebookPagesState.FetchFacebookPagesData = action.payload;
      })
      .addCase(fetchFacebookPages.rejected, (state, action) => {
        state.FetchFacebookPagesState.FetchFacebookPagesIsLoading = false;
        state.FetchFacebookPagesState.FetchFacebookPagesIsSuccess = false;
        state.FetchFacebookPagesState.FetchFacebookPagesIsError =
          action.payload as string | object;
      })
      .addCase(fetchInstagramPages.pending, (state) => {
        state.FetchInstagramPagesState.FetchInstagramPagesIsLoading = true;
        state.FetchInstagramPagesState.FetchInstagramPagesIsSuccess = false;
        state.FetchInstagramPagesState.FetchInstagramPagesIsError = null;
      })
      .addCase(fetchInstagramPages.fulfilled, (state, action) => {
        state.FetchInstagramPagesState.FetchInstagramPagesIsLoading = false;
        state.FetchInstagramPagesState.FetchInstagramPagesIsSuccess = true;
        state.FetchInstagramPagesState.FetchInstagramPagesData = action.payload;
      })
      .addCase(fetchInstagramPages.rejected, (state, action) => {
        state.FetchInstagramPagesState.FetchInstagramPagesIsLoading = false;
        state.FetchInstagramPagesState.FetchInstagramPagesIsSuccess = false;
        state.FetchInstagramPagesState.FetchInstagramPagesIsError =
          action.payload as string | object;
      })
      .addCase(fetchFacebookPosts.pending, (state) => {
        state.FetchFacebookPostsState.FetchFacebookPostsIsLoading = true;
        state.FetchFacebookPostsState.FetchFacebookPostsIsSuccess = false;
        state.FetchFacebookPostsState.FetchFacebookPostsIsError = null;
      })
      .addCase(fetchFacebookPosts.fulfilled, (state, action) => {
        state.FetchFacebookPostsState.FetchFacebookPostsIsLoading = false;
        state.FetchFacebookPostsState.FetchFacebookPostsIsSuccess = true;
        state.FetchFacebookPostsState.FetchFacebookPostsData = action.payload;
      })
      .addCase(fetchFacebookPosts.rejected, (state, action) => {
        state.FetchFacebookPostsState.FetchFacebookPostsIsLoading = false;
        state.FetchFacebookPostsState.FetchFacebookPostsIsSuccess = false;
        state.FetchFacebookPostsState.FetchFacebookPostsIsError =
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
      .addCase(fetchInstagramPosts.pending, (state) => {
        state.FetchInstagramPostsState.FetchInstagramPostsIsLoading = true;
        state.FetchInstagramPostsState.FetchInstagramPostsIsSuccess = false;
        state.FetchInstagramPostsState.FetchInstagramPostsIsError = null;
      })
      .addCase(fetchInstagramPosts.fulfilled, (state, action) => {
        state.FetchInstagramPostsState.FetchInstagramPostsIsLoading = false;
        state.FetchInstagramPostsState.FetchInstagramPostsIsSuccess = true;
        state.FetchInstagramPostsState.FetchInstagramPostsData = action.payload;
      })
      .addCase(fetchInstagramPosts.rejected, (state, action) => {
        state.FetchInstagramPostsState.FetchInstagramPostsIsLoading = false;
        state.FetchInstagramPostsState.FetchInstagramPostsIsSuccess = false;
        state.FetchInstagramPostsState.FetchInstagramPostsIsError =
          action.payload as string | object;
      })
      .addCase(fetchFacebookComments.pending, (state) => {
        state.FetchFacebookCommentsState.FetchFacebookCommentsIsLoading = true;
        state.FetchFacebookCommentsState.FetchFacebookCommentsIsSuccess = false;
        state.FetchFacebookCommentsState.FetchFacebookCommentsIsError = null;
      })
      .addCase(fetchFacebookComments.fulfilled, (state, action) => {
        state.FetchFacebookCommentsState.FetchFacebookCommentsIsLoading = false;
        state.FetchFacebookCommentsState.FetchFacebookCommentsIsSuccess = true;
        state.FetchFacebookCommentsState.FetchFacebookCommentsData =
          action.payload;
      })
      .addCase(fetchFacebookComments.rejected, (state, action) => {
        state.FetchFacebookCommentsState.FetchFacebookCommentsIsLoading = false;
        state.FetchFacebookCommentsState.FetchFacebookCommentsIsSuccess = false;
        state.FetchFacebookCommentsState.FetchFacebookCommentsIsError =
          action.payload as string | object;
      })
      .addCase(fetchInstagramComments.pending, (state) => {
        state.FetchInstagramCommentsState.FetchInstagramCommentsIsLoading = true;
        state.FetchInstagramCommentsState.FetchInstagramCommentsIsSuccess = false;
        state.FetchInstagramCommentsState.FetchInstagramCommentsIsError = null;
      })
      .addCase(fetchInstagramComments.fulfilled, (state, action) => {
        state.FetchInstagramCommentsState.FetchInstagramCommentsIsLoading = false;
        state.FetchInstagramCommentsState.FetchInstagramCommentsIsSuccess = true;
        state.FetchInstagramCommentsState.FetchInstagramCommentsData =
          action.payload;
      })
      .addCase(fetchInstagramComments.rejected, (state, action) => {
        state.FetchInstagramCommentsState.FetchInstagramCommentsIsLoading = false;
        state.FetchInstagramCommentsState.FetchInstagramCommentsIsSuccess = false;
        state.FetchInstagramCommentsState.FetchInstagramCommentsIsError =
          action.payload as string | object;
      })
      .addCase(fetchFacebookDms.pending, (state) => {
        state.FetchFacebookDmsState.FetchFacebookDmsIsLoading = true;
        state.FetchFacebookDmsState.FetchFacebookDmsIsSuccess = false;
        state.FetchFacebookDmsState.FetchFacebookDmsIsError = null;
      })
      .addCase(fetchFacebookDms.fulfilled, (state, action) => {
        state.FetchFacebookDmsState.FetchFacebookDmsIsLoading = false;
        state.FetchFacebookDmsState.FetchFacebookDmsIsSuccess = true;
        state.FetchFacebookDmsState.FetchFacebookDmsData = action.payload;
      })
      .addCase(fetchFacebookDms.rejected, (state, action) => {
        state.FetchFacebookDmsState.FetchFacebookDmsIsLoading = false;
        state.FetchFacebookDmsState.FetchFacebookDmsIsSuccess = false;
        state.FetchFacebookDmsState.FetchFacebookDmsIsError = action.payload as
          | string
          | object;
      })
      .addCase(fetchInstagramDms.pending, (state) => {
        state.FetchInstagramDmsState.FetchInstagramDmsIsLoading = true;
        state.FetchInstagramDmsState.FetchInstagramDmsIsSuccess = false;
        state.FetchInstagramDmsState.FetchInstagramDmsIsError = null;
      })
      .addCase(fetchInstagramDms.fulfilled, (state, action) => {
        state.FetchInstagramDmsState.FetchInstagramDmsIsLoading = false;
        state.FetchInstagramDmsState.FetchInstagramDmsIsSuccess = true;
        state.FetchInstagramDmsState.FetchInstagramDmsData = action.payload;
      })
      .addCase(fetchInstagramDms.rejected, (state, action) => {
        state.FetchInstagramDmsState.FetchInstagramDmsIsLoading = false;
        state.FetchInstagramDmsState.FetchInstagramDmsIsSuccess = false;
        state.FetchInstagramDmsState.FetchInstagramDmsIsError =
          action.payload as string | object;
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
