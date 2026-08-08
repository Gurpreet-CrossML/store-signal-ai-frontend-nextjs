import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
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
  category: string;
  cover_url: string;
  followers_count: number | null;
  // IG only — how many accounts this profile follows; null on FB pages.
  follows_count: number | null;
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

export type SocialCommentAnalysis = {
  intent: string;
  intent_label: string;
  topics: string[];
  topic_labels: string[];
  sentiment: string;
  sentiment_label: string;
  is_spam: boolean;
  is_critical: boolean;
  confidence: number | null;
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
  // Null until the AI tagging pipeline has processed this comment.
  analysis: SocialCommentAnalysis | null;
  external_created_at: string;
};

export type SocialCommentsResponse = {
  results: SocialComment[];
  count: number;
  next?: string | null;
  previous?: string | null;
};

export type CommentTopic = {
  slug: string;
  label: string;
};

// A DM contact of one connected account — one row per conversation in the
// inbox list (from the users-list API, most recent conversation first).
export type SocialConversationUser = {
  id: number;
  external_id: string;
  name: string;
  username: string;
  profile_picture_url: string;
  last_message: string | null;
  last_message_at: string | null;
};

export type SocialUsersResponse = {
  results: SocialConversationUser[];
  count: number;
  next?: string | null;
  previous?: string | null;
};

export type SocialDmReplyTo = {
  id: number;
  content: string;
  sender_name: string | null;
};

// One piece of media on a DM, in send order. An attachment-only message
// has empty `content` and one or more of these.
export type SocialDmAttachment = {
  id: number;
  // "image" | "video" | "audio" | "file" | "sticker" | "share" | "other"
  attachment_type: string;
  position: number;
  // Meta CDN URL — signed and expiring (see expires_at). Blank for payload
  // shapes that carry no URL of their own.
  url: string;
  title: string;
  sticker_id: string;
  expires_at: string | null;
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
  // Absent on older payloads; the websocket broadcast also fires before
  // attachments are synced, so never assume this is populated.
  attachments?: SocialDmAttachment[];
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
    {
      storeCode,
      accountId,
      channelType,
    }: { storeCode: string; accountId: string; channelType?: string },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchSocialPosts({ accountId })}?store_code=${storeCode}${channelType ? `&channel_type=${channelType}` : ""}`,
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
          data?.message || "Unable to fetch posts, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const fetchPostComments = createAsyncThunk(
  "fetchPostComments",
  async (
    {
      storeCode,
      postId,
      page = 1,
      pageSize = 15,
      parentId,
      topic,
    }: {
      storeCode: string;
      // The post's external Graph id (SocialPost.external_id).
      postId: string;
      page?: number;
      pageSize?: number;
      parentId?: number;
      topic?: string;
    },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchPostComments({ postId })}?store_code=${storeCode}&page=${page}&page_size=${pageSize}${parentId ? `&parent=${parentId}` : ""}${topic ? `&topic=${encodeURIComponent(topic)}` : ""}`,
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
          "Unable to fetch post comments, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const fetchCommentTopics = createAsyncThunk(
  "fetchCommentTopics",
  async (
    { storeCode, postId }: { storeCode: string; postId: string },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchCommentTopics({ postId })}?store_code=${storeCode}`,
        {
          useBackend: true,
        },
      );
      const data = response.data.data;
      return (data?.topics ?? []) as CommentTopic[];
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to fetch comment topics, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const fetchSocialUsers = createAsyncThunk(
  "fetchSocialUsers",
  async (
    {
      storeCode,
      accountId,
      page = 1,
      pageSize = 50,
      search,
    }: {
      storeCode: string;
      // The connected account's external Graph id (ConnectedAccount.external_id).
      accountId: string;
      page?: number;
      pageSize?: number;
      search?: string;
    },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchSocialUsers({ accountId })}?store_code=${storeCode}&page=${page}&page_size=${pageSize}${search ? `&search=${encodeURIComponent(search)}` : ""}`,
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
          "Unable to fetch conversations, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const fetchSocialDms = createAsyncThunk(
  "fetchSocialDms",
  async (
    {
      storeCode,
      accountId,
      userId,
      page = 1,
      pageSize = 50,
    }: {
      storeCode: string;
      // The connected account's external Graph id (ConnectedAccount.external_id).
      accountId: string;
      // The conversation contact's DB id (SocialConversationUser.id).
      userId: number;
      page?: number;
      pageSize?: number;
    },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchSocialDms({ accountId, userId })}?store_code=${storeCode}&page=${page}&page_size=${pageSize}`,
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
          data?.message || "Unable to fetch messages, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const likeMetaComment = createAsyncThunk(
  "likeMetaComment",
  async (
    {
      storeCode,
      postId,
      commentId,
    }: { storeCode: string; postId: string; commentId: number },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(
        `${ENDPOINTS.likeComment({ postId, commentId })}?store_code=${storeCode}`,
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
    {
      storeCode,
      postId,
      commentId,
      is_hidden,
    }: {
      storeCode: string;
      postId: string;
      commentId: number;
      is_hidden: boolean;
    },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(
        `${ENDPOINTS.hideComment({ postId, commentId })}?store_code=${storeCode}`,
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
  async (
    {
      storeCode,
      postId,
      commentId,
    }: { storeCode: string; postId: string; commentId: number },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.delete(
        `${ENDPOINTS.deleteComment({ postId, commentId })}?store_code=${storeCode}`,
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
    {
      storeCode,
      userId,
      messageId,
      message,
      isExplicitReply = true,
      attachments,
    }: {
      storeCode: string;
      userId: number;
      messageId: number;
      message: string;
      isExplicitReply?: boolean;
      attachments?: File[];
    },
    thunkAPI,
  ) => {
    try {
      const url = `${ENDPOINTS.replyMessage({ userId, messageId })}?store_code=${storeCode}`;

      // With media the request has to be multipart; the JSON body stays the
      // shape it always was when there's nothing to upload.
      const response = attachments?.length
        ? await axiosInstance.post(
            url,
            (() => {
              const form = new FormData();
              form.append("message", message);
              form.append("is_explicit_reply", String(isExplicitReply));
              attachments.forEach((file) => form.append("attachments", file));
              return form;
            })(),
            {
              useBackend: true,
              headers: { "Content-Type": "multipart/form-data" },
            },
          )
        : await axiosInstance.post(
            url,
            { message, is_explicit_reply: isExplicitReply },
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
    {
      storeCode,
      userId,
      messageId,
      reaction,
    }: {
      storeCode: string;
      userId: number;
      messageId: number;
      reaction: string;
    },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(
        `${ENDPOINTS.reactMessage({ userId, messageId })}?store_code=${storeCode}`,
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
    {
      storeCode,
      postId,
      commentId,
      message,
    }: {
      storeCode: string;
      postId: string;
      commentId: number;
      message: string;
    },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(
        `${ENDPOINTS.replyComment({ postId, commentId })}?store_code=${storeCode}`,
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
    FetchCommentTopicsState: {
      FetchCommentTopicsIsLoading: false,
      FetchCommentTopicsIsSuccess: false,
      FetchCommentTopicsIsError: null as null | string | object,
      FetchCommentTopicsData: [] as CommentTopic[],
    },
    FetchSocialUsersState: {
      FetchSocialUsersIsLoading: false,
      FetchSocialUsersIsSuccess: false,
      FetchSocialUsersIsError: null as null | string | object,
      FetchSocialUsersData: {} as SocialUsersResponse,
    },
    FetchSocialDmsState: {
      FetchSocialDmsIsLoading: false,
      FetchSocialDmsIsSuccess: false,
      FetchSocialDmsIsError: null as null | string | object,
      FetchSocialDmsData: {} as SocialDmsResponse,
    },
  },
  reducers: {
    /**
     * A DM that arrived over the websocket, for the conversation currently
     * loaded. Deduped by id: the same row can arrive twice when a refetch
     * races the broadcast, and our own outgoing replies come back through
     * the same store-wide stream.
     */
    socialDmReceived(state, action: PayloadAction<SocialDm>) {
      const dms = state.FetchSocialDmsState.FetchSocialDmsData;
      if (!dms?.results) return;
      if (dms.results.some((msg) => msg.id === action.payload.id)) return;
      // The messages endpoint is oldest-first, so a new one belongs at the end.
      dms.results.push(action.payload);
      dms.count = (dms.count ?? dms.results.length - 1) + 1;
    },

    /**
     * Refresh a conversation row's preview when a message arrives for it,
     * and float it to the top so the list stays newest-first like the API
     * returns it.
     */
    socialConversationTouched(
      state,
      action: PayloadAction<{
        userId: number;
        lastMessage: string;
        lastMessageAt: string | null;
      }>,
    ) {
      const users = state.FetchSocialUsersState.FetchSocialUsersData;
      if (!users?.results) return;
      const index = users.results.findIndex(
        (user) => user.id === action.payload.userId,
      );
      // An unknown contact means a brand-new conversation — the list has to
      // be refetched to get their profile, which the screen handles.
      if (index === -1) return;

      const [user] = users.results.splice(index, 1);
      user.last_message = action.payload.lastMessage;
      user.last_message_at = action.payload.lastMessageAt;
      users.results.unshift(user);
    },
  },
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
        state.FetchSocialPostsState.FetchSocialPostsIsError = action.payload as
          | string
          | object;
      })
      .addCase(fetchSocialUsers.pending, (state) => {
        state.FetchSocialUsersState.FetchSocialUsersIsLoading = true;
        state.FetchSocialUsersState.FetchSocialUsersIsSuccess = false;
        state.FetchSocialUsersState.FetchSocialUsersIsError = null;
      })
      .addCase(fetchSocialUsers.fulfilled, (state, action) => {
        state.FetchSocialUsersState.FetchSocialUsersIsLoading = false;
        state.FetchSocialUsersState.FetchSocialUsersIsSuccess = true;
        state.FetchSocialUsersState.FetchSocialUsersData = action.payload;
      })
      .addCase(fetchSocialUsers.rejected, (state, action) => {
        state.FetchSocialUsersState.FetchSocialUsersIsLoading = false;
        state.FetchSocialUsersState.FetchSocialUsersIsSuccess = false;
        state.FetchSocialUsersState.FetchSocialUsersIsError = action.payload as
          | string
          | object;
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
        state.FetchPostCommentsState.FetchPostCommentsIsError =
          action.payload as string | object;
      })
      .addCase(fetchCommentTopics.pending, (state) => {
        state.FetchCommentTopicsState.FetchCommentTopicsIsLoading = true;
        state.FetchCommentTopicsState.FetchCommentTopicsIsSuccess = false;
        state.FetchCommentTopicsState.FetchCommentTopicsIsError = null;
      })
      .addCase(fetchCommentTopics.fulfilled, (state, action) => {
        state.FetchCommentTopicsState.FetchCommentTopicsIsLoading = false;
        state.FetchCommentTopicsState.FetchCommentTopicsIsSuccess = true;
        state.FetchCommentTopicsState.FetchCommentTopicsData = action.payload;
      })
      .addCase(fetchCommentTopics.rejected, (state, action) => {
        state.FetchCommentTopicsState.FetchCommentTopicsIsLoading = false;
        state.FetchCommentTopicsState.FetchCommentTopicsIsSuccess = false;
        state.FetchCommentTopicsState.FetchCommentTopicsIsError =
          action.payload as string | object;
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
        state.FetchSocialDmsState.FetchSocialDmsIsError = action.payload as
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

export const { socialDmReceived, socialConversationTouched } =
  SocialAISlice.actions;

export default SocialAISlice.reducer;
