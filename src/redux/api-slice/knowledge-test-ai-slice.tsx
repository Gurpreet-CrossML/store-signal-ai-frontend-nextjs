import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import {
  ENDPOINTS,
  type KnowledgeTestSender,
  type KnowledgeUnansweredReason,
} from "@/lib/config";
import { toPaginatedList } from "@/lib/helpers";
import { axiosInstance } from "@/redux/axios-config";
import type { ProductData } from "@/redux/api-slice/thread-slice";

// The Test AI page: the sample questions a store owner can try, and the
// customer questions the AI couldn't answer.

/** A sample customer question, the same for every store. */
export type TestQuestion = {
  id: number;
  question: string;
};

/** A customer question the AI couldn't answer. */
export type UnansweredQuestion = {
  id: number;
  question: string;
  /** The AI's reply; `null` when it never replied. */
  answer: string | null;
  reason: KnowledgeUnansweredReason;
  /** The reply's confidence from 0 to 1; `null` when it has none. */
  confidence: number | null;
  threadId: string;
  /** Whether the conversation is still open (it is in Support) or closed (in Threads). */
  threadIsActive: boolean;
  askedAt: string;
};

type ApiUnansweredQuestion = {
  id: number;
  question: string;
  answer: string | null;
  reason: KnowledgeUnansweredReason;
  confidence: number | null;
  thread_id: string;
  thread_is_active: boolean;
  asked_at: string;
};

/**
 * One message of the Test AI chat: a question the user tried, or the answer
 * the AI gave. They are saved as separate messages, like the helpdesk Copilot.
 */
export type TestMessage = {
  id: number;
  sender: KnowledgeTestSender;
  /** The question, or the answer that was shown. */
  message: string;
  /** AI messages only: the knowledge the answer was based on. */
  citations: {
    /** The knowledge item the passage came from. */
    id: number | null;
    title: string | null;
    url: string | null;
  }[];
  /** AI messages only: the catalogue products the answer was based on, as the chat shows them. */
  products: ProductData[];
  createdAt: string;
};

type ApiTestMessage = {
  id: number;
  sender: KnowledgeTestSender;
  message: string;
  citations: {
    /** The knowledge item the passage came from. */
    id: number | null;
    title: string | null;
    url: string | null;
  }[];
  products: ProductData[];
  created_at: string;
};

const mapApiTestMessage = (item: ApiTestMessage): TestMessage => ({
  id: item.id,
  sender: item.sender,
  message: item.message,
  citations: item.citations ?? [],
  products: item.products ?? [],
  createdAt: item.created_at,
});

export type UnansweredQuestionList = {
  count: number;
  next: string | null;
  previous: string | null;
  results: UnansweredQuestion[];
};

export type TestQuestionList = {
  count: number;
  next: string | null;
  previous: string | null;
  results: TestQuestion[];
};

export const FetchTestQuestions = createAsyncThunk(
  "FetchTestQuestions",
  async (
    {
      page = 1,
      pageSize,
      search = "",
    }: { page?: number; pageSize: number; search?: string },
    thunkAPI,
  ) => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (search.trim()) params.set("search", search.trim());
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchTestQuestions()}?${params.toString()}`,
        { useBackend: true },
      );
      return toPaginatedList<TestQuestion>(
        response.data?.data,
      ) as TestQuestionList;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Couldn't load the test questions.", {
        description: data?.message || "Please try again later.",
      });
      return thunkAPI.rejectWithValue(
        data || "Couldn't load the test questions.",
      );
    }
  },
);

export const FetchUnansweredQuestions = createAsyncThunk(
  "FetchUnansweredQuestions",
  async (
    {
      storeCode,
      page = 1,
      pageSize,
      search = "",
      reason,
    }: {
      storeCode: string;
      page?: number;
      pageSize: number;
      search?: string;
      /** Only the questions flagged for this reason; every one when omitted. */
      reason?: KnowledgeUnansweredReason;
    },
    thunkAPI,
  ) => {
    try {
      const params = new URLSearchParams({
        store_code: storeCode,
        page: String(page),
        page_size: String(pageSize),
      });
      if (search.trim()) params.set("search", search.trim());
      if (reason) params.set("reason", reason);
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchUnansweredQuestions()}?${params.toString()}`,
        { useBackend: true },
      );
      const paginated = toPaginatedList<ApiUnansweredQuestion>(
        response.data?.data,
      );
      return {
        ...paginated,
        results: paginated.results.map(
          (item): UnansweredQuestion => ({
            id: item.id,
            question: item.question,
            answer: item.answer,
            reason: item.reason,
            confidence: item.confidence,
            threadId: item.thread_id,
            threadIsActive: item.thread_is_active,
            askedAt: item.asked_at,
          }),
        ),
      } as UnansweredQuestionList;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Couldn't load the unanswered questions.", {
        description: data?.message || "Please try again later.",
      });
      return thunkAPI.rejectWithValue(
        data || "Couldn't load the unanswered questions.",
      );
    }
  },
);

export const FetchTestMessages = createAsyncThunk(
  "FetchTestMessages",
  async ({ storeCode }: { storeCode: string }, thunkAPI) => {
    try {
      const params = new URLSearchParams({ store_code: storeCode });
      const response = await axiosInstance.get(
        `${ENDPOINTS.testMessages()}?${params.toString()}`,
        { useBackend: true },
      );
      return ((response.data?.data ?? []) as ApiTestMessage[]).map(
        mapApiTestMessage,
      );
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Couldn't load your earlier test questions.", {
        description: data?.message || "Please try again later.",
      });
      return thunkAPI.rejectWithValue(
        data || "Couldn't load your earlier test questions.",
      );
    }
  },
);

export const AskTestQuestion = createAsyncThunk(
  "AskTestQuestion",
  async (
    { storeCode, question }: { storeCode: string; question: string },
    thunkAPI,
  ) => {
    try {
      const params = new URLSearchParams({ store_code: storeCode });
      const response = await axiosInstance.post(
        `${ENDPOINTS.testMessages()}?${params.toString()}`,
        { question },
      );
      // The saved question and answer, as two messages.
      return ((response.data?.data ?? []) as ApiTestMessage[]).map(
        mapApiTestMessage,
      );
    } catch (error) {
      // No toast: the chat shows the failure under the question, with a retry.
      const response = isAxiosError(error) ? error.response : undefined;
      return thunkAPI.rejectWithValue(
        response?.data?.message || "Couldn't get an answer. Please try again.",
      );
    }
  },
);

const KnowledgeTestAiSlice = createSlice({
  name: "KnowledgeTestAi",
  initialState: {
    FetchTestQuestionsState: {
      FetchTestQuestionsIsLoading: false,
      FetchTestQuestionsIsError: null as null | string | object,
      FetchTestQuestionsData: null as TestQuestionList | null,
    },
    FetchUnansweredQuestionsState: {
      FetchUnansweredQuestionsIsLoading: false,
      FetchUnansweredQuestionsIsError: null as null | string | object,
      FetchUnansweredQuestionsData: null as UnansweredQuestionList | null,
    },
    // The Test AI chat: the user's earlier messages, the question being
    // answered now, and why the last one failed.
    TestChatState: {
      TestChatIsLoading: false,
      TestChatItems: null as TestMessage[] | null,
      TestChatPendingQuestion: null as string | null,
      TestChatError: null as string | null,
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // FetchTestQuestions
      .addCase(FetchTestQuestions.pending, (state) => {
        state.FetchTestQuestionsState.FetchTestQuestionsIsLoading = true;
        state.FetchTestQuestionsState.FetchTestQuestionsIsError = null;
      })
      .addCase(FetchTestQuestions.fulfilled, (state, action) => {
        state.FetchTestQuestionsState.FetchTestQuestionsIsLoading = false;
        state.FetchTestQuestionsState.FetchTestQuestionsData = action.payload;
      })
      .addCase(FetchTestQuestions.rejected, (state, action) => {
        state.FetchTestQuestionsState.FetchTestQuestionsIsLoading = false;
        state.FetchTestQuestionsState.FetchTestQuestionsIsError =
          (action.payload as string | object) ??
          "Couldn't load the test questions.";
      })
      // FetchTestMessages
      .addCase(FetchTestMessages.pending, (state) => {
        // A fresh load (first open, or another store): drop the old chat.
        state.TestChatState = {
          TestChatIsLoading: true,
          TestChatItems: null,
          TestChatPendingQuestion: null,
          TestChatError: null,
        };
      })
      .addCase(FetchTestMessages.fulfilled, (state, action) => {
        state.TestChatState.TestChatIsLoading = false;
        state.TestChatState.TestChatItems = action.payload;
      })
      .addCase(FetchTestMessages.rejected, (state) => {
        state.TestChatState.TestChatIsLoading = false;
        state.TestChatState.TestChatItems ??= [];
      })
      // AskTestQuestion
      .addCase(AskTestQuestion.pending, (state, action) => {
        state.TestChatState.TestChatPendingQuestion = action.meta.arg.question;
        state.TestChatState.TestChatError = null;
      })
      .addCase(AskTestQuestion.fulfilled, (state, action) => {
        state.TestChatState.TestChatItems = [
          ...(state.TestChatState.TestChatItems ?? []),
          ...action.payload,
        ];
        state.TestChatState.TestChatPendingQuestion = null;
      })
      .addCase(AskTestQuestion.rejected, (state, action) => {
        // The question stays, so the chat can show it with the error and retry.
        state.TestChatState.TestChatError =
          (action.payload as string) ??
          "Couldn't get an answer. Please try again.";
      })
      // FetchUnansweredQuestions
      .addCase(FetchUnansweredQuestions.pending, (state) => {
        state.FetchUnansweredQuestionsState.FetchUnansweredQuestionsIsLoading = true;
        state.FetchUnansweredQuestionsState.FetchUnansweredQuestionsIsError =
          null;
      })
      .addCase(FetchUnansweredQuestions.fulfilled, (state, action) => {
        state.FetchUnansweredQuestionsState.FetchUnansweredQuestionsIsLoading = false;
        state.FetchUnansweredQuestionsState.FetchUnansweredQuestionsData =
          action.payload;
      })
      .addCase(FetchUnansweredQuestions.rejected, (state, action) => {
        state.FetchUnansweredQuestionsState.FetchUnansweredQuestionsIsLoading = false;
        state.FetchUnansweredQuestionsState.FetchUnansweredQuestionsIsError =
          (action.payload as string | object) ??
          "Couldn't load the unanswered questions.";
      });
  },
});

export default KnowledgeTestAiSlice.reducer;
