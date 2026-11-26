import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import {
  ENDPOINTS,
  KNOWLEDGE_TEST_SENDERS,
  type KnowledgeTestSender,
} from "@/lib/config";
import { toPaginatedList } from "@/lib/helpers";
import { axiosInstance } from "@/redux/axios-config";
import type { ProductData } from "@/redux/api-slice/thread-slice";

// The Test AI page: the sample questions a store owner can try, and the
// customer questions the AI couldn't answer.

/** Whether the store's AI could answer a test question when it was last asked. */
export type TestQuestionStatus = "answered" | "unanswered";

/** A thumbs up (good) or down (bad) on an answer. */
export type TestFeedback = "good" | "bad";

/** A sample customer question as it stands for the selected store. */
export type TestQuestion = {
  /** The store's own row for the question (not the shared question's id). */
  id: string;
  question: string;
  category: { id: number; name: string; slug: string } | null;
  /** Null until the question has been asked. */
  status: TestQuestionStatus | null;
  /** How confident the latest answer was, 0 to 1; null when it has none. */
  confidence: number | null;
  lastAskedAt: string | null;
  feedback: TestFeedback | null;
};

type ApiTestQuestion = {
  id: string;
  question: string;
  category: TestQuestion["category"];
  status: TestQuestionStatus | null;
  confidence: number | null;
  last_asked_at: string | null;
  feedback: TestFeedback | null;
};

/** A workflow that left customer questions unanswered. */
export type UnansweredWorkflow = {
  /** The workflow's code, used to list its questions. */
  code: string;
  name: string;
  /** How many questions it left unanswered. */
  count: number;
};

/** A customer question the AI couldn't answer. */
export type UnansweredQuestion = {
  id: string;
  question: string;
  /** Code of the workflow that couldn't answer it. */
  workflow: string | null;
  threadId: string;
  /** Whether the conversation is still open (it is in Support) or closed (in Threads). */
  threadIsActive: boolean;
  askedAt: string;
};

type ApiUnansweredQuestion = {
  id: string;
  question: string;
  workflow: string | null;
  thread_id: string;
  thread_is_active: boolean;
  asked_at: string;
};

/**
 * One message of the Test AI chat: a question the user tried, or the answer
 * the AI gave. The chat is not saved anywhere: it lives only in this page's
 * state and is cleared when the user leaves the page or reloads.
 */
export type TestMessage = {
  /** Made here, only to tell the messages apart. */
  id: string;
  sender: KnowledgeTestSender;
  /** The question, or the answer that was shown. */
  message: string;
  /** AI messages only: the knowledge the answer was based on. */
  citations: {
    /** The knowledge item the passage came from. */
    id: string | null;
    title: string | null;
    url: string | null;
  }[];
  /** AI messages only: the catalogue products the answer was based on, as the chat shows them. */
  products: ProductData[];
  /**
   * AI messages only: how closely the best knowledge passage used matches the
   * question, 0 to 1. Null when no passage was used (nothing found, or an
   * answer from products only) and on the user's own messages.
   */
  confidence: number | null;
  /**
   * AI messages only: the store's test question this answer was recorded on,
   * to rate it with. Null when the question was typed, not one of the test
   * questions.
   */
  testQuestionId: string | null;
  /** AI messages only: the rating the user gave this answer. */
  feedback: TestFeedback | null;
};

/** What the answer endpoint returns for one question. */
type ApiTestAnswer = {
  answer: string;
  citations: TestMessage["citations"];
  products: ProductData[];
  confidence: number | null;
  test_question_id: string | null;
};

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
      storeCode,
      page = 1,
      pageSize,
      search = "",
      status = "",
      category = "",
    }: {
      storeCode: string;
      page?: number;
      pageSize: number;
      search?: string;
      /** "answered", "unanswered" or "not_asked"; all when empty. */
      status?: string;
      /** A category's slug; all when empty. */
      category?: string;
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
      if (status) params.set("status", status);
      if (category) params.set("category", category);
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchTestQuestions()}?${params.toString()}`,
        { useBackend: true },
      );
      const paginated = toPaginatedList<ApiTestQuestion>(response.data?.data);
      return {
        ...paginated,
        results: paginated.results.map(
          (item): TestQuestion => ({
            id: item.id,
            question: item.question,
            category: item.category,
            status: item.status,
            confidence: item.confidence,
            lastAskedAt: item.last_asked_at,
            feedback: item.feedback,
          }),
        ),
      } as TestQuestionList;
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

export const FetchUnansweredWorkflows = createAsyncThunk(
  "FetchUnansweredWorkflows",
  async (
    {
      storeCode,
      dateFrom,
      dateTo,
    }: {
      storeCode: string;
      /** Count only the questions asked on or after this day (yyyy-MM-dd). */
      dateFrom?: string;
      /** Count only the questions asked on or before this day (yyyy-MM-dd). */
      dateTo?: string;
    },
    thunkAPI,
  ) => {
    try {
      const params = new URLSearchParams({ store_code: storeCode });
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchUnansweredWorkflows()}?${params.toString()}`,
        { useBackend: true },
      );
      return (response.data?.data ?? []) as UnansweredWorkflow[];
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Couldn't load the workflows.", {
        description: data?.message || "Please try again later.",
      });
      return thunkAPI.rejectWithValue(data || "Couldn't load the workflows.");
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
      workflow,
      dateFrom,
      dateTo,
    }: {
      storeCode: string;
      page?: number;
      pageSize: number;
      search?: string;
      /** Code of the workflow whose questions to list. */
      workflow: string;
      /** Only the questions asked on or after this day (yyyy-MM-dd). */
      dateFrom?: string;
      /** Only the questions asked on or before this day (yyyy-MM-dd). */
      dateTo?: string;
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
      params.set("workflow", workflow);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
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
            workflow: item.workflow,
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

export const AskTestQuestion = createAsyncThunk(
  "AskTestQuestion",
  async (
    { storeCode, question }: { storeCode: string; question: string },
    thunkAPI,
  ) => {
    try {
      const params = new URLSearchParams({ store_code: storeCode });
      const response = await axiosInstance.post(
        `${ENDPOINTS.testAnswer()}?${params.toString()}`,
        { question },
      );
      const answer = response.data?.data as ApiTestAnswer;
      // The question and the answer, as two chat messages.
      return [
        {
          id: crypto.randomUUID(),
          sender: KNOWLEDGE_TEST_SENDERS.user,
          message: question,
          citations: [],
          products: [],
          confidence: null,
          testQuestionId: null,
          feedback: null,
        },
        {
          id: crypto.randomUUID(),
          sender: KNOWLEDGE_TEST_SENDERS.ai,
          message: answer.answer,
          citations: answer.citations ?? [],
          products: answer.products ?? [],
          confidence: answer.confidence ?? null,
          testQuestionId: answer.test_question_id ?? null,
          feedback: null,
        },
      ] satisfies TestMessage[];
    } catch (error) {
      // No toast: the chat shows the failure under the question, with a retry.
      const response = isAxiosError(error) ? error.response : undefined;
      return thunkAPI.rejectWithValue(
        response?.data?.message || "Couldn't get an answer. Please try again.",
      );
    }
  },
);

/**
 * Rates the AI's answer to a test question, or clears the rating (`null`). The
 * screen shows the rating at once; if saving fails it goes back to `previous`.
 */
export const SetTestAnswerFeedback = createAsyncThunk(
  "SetTestAnswerFeedback",
  async (
    {
      storeCode,
      testQuestionId,
      feedback,
    }: {
      storeCode: string;
      /** The chat message the rating is shown on. */
      messageId: string;
      testQuestionId: string;
      feedback: TestFeedback | null;
      /** The rating before this one, to go back to if saving fails. */
      previous: TestFeedback | null;
    },
    thunkAPI,
  ) => {
    try {
      const params = new URLSearchParams({ store_code: storeCode });
      await axiosInstance.patch(
        `${ENDPOINTS.testQuestionFeedback(testQuestionId)}?${params.toString()}`,
        { feedback },
        { useBackend: true },
      );
      return feedback;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      toast.error("Couldn't save your feedback.", {
        description: response?.data?.message || "Please try again.",
      });
      return thunkAPI.rejectWithValue(response?.data || null);
    }
  },
);

/** Shows a rating on the answer message and on the test question row it belongs to. */
function setAnswerFeedback(
  state: {
    TestChatState: { TestChatItems: TestMessage[] };
    FetchTestQuestionsState: {
      FetchTestQuestionsData: TestQuestionList | null;
    };
  },
  target: { messageId: string; testQuestionId: string },
  feedback: TestFeedback | null,
) {
  const message = state.TestChatState.TestChatItems.find(
    (item) => item.id === target.messageId,
  );
  if (message) message.feedback = feedback;
  const row =
    state.FetchTestQuestionsState.FetchTestQuestionsData?.results.find(
      (item) => item.id === target.testQuestionId,
    );
  if (row) row.feedback = feedback;
}

const KnowledgeTestAiSlice = createSlice({
  name: "KnowledgeTestAi",
  initialState: {
    FetchTestQuestionsState: {
      FetchTestQuestionsIsLoading: false,
      FetchTestQuestionsIsError: null as null | string | object,
      FetchTestQuestionsData: null as TestQuestionList | null,
    },
    FetchUnansweredWorkflowsState: {
      FetchUnansweredWorkflowsIsLoading: false,
      FetchUnansweredWorkflowsData: null as UnansweredWorkflow[] | null,
    },
    FetchUnansweredQuestionsState: {
      FetchUnansweredQuestionsIsLoading: false,
      FetchUnansweredQuestionsIsError: null as null | string | object,
      FetchUnansweredQuestionsData: null as UnansweredQuestionList | null,
    },
    // The Test AI chat, kept only while the page is open: the messages so far,
    // the question being answered now, and why the last one failed.
    TestChatState: {
      TestChatItems: [] as TestMessage[],
      TestChatPendingQuestion: null as string | null,
      TestChatError: null as string | null,
    },
  },
  reducers: {
    // Drops the listed unanswered questions, so another workflow's list never
    // shows the previous one's while it loads.
    ResetUnansweredQuestions: (state) => {
      state.FetchUnansweredQuestionsState.FetchUnansweredQuestionsData = null;
    },
    // Clears the Test AI chat: it is not saved, so leaving the page ends it.
    ResetTestChat: (state) => {
      state.TestChatState = {
        TestChatItems: [],
        TestChatPendingQuestion: null,
        TestChatError: null,
      };
    },
  },
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
      // AskTestQuestion
      .addCase(AskTestQuestion.pending, (state, action) => {
        state.TestChatState.TestChatPendingQuestion = action.meta.arg.question;
        state.TestChatState.TestChatError = null;
      })
      .addCase(AskTestQuestion.fulfilled, (state, action) => {
        state.TestChatState.TestChatItems.push(...action.payload);
        state.TestChatState.TestChatPendingQuestion = null;
        // A test question's row in the list now shows how this try went.
        const answer = action.payload[action.payload.length - 1];
        if (answer.testQuestionId !== null) {
          const row =
            state.FetchTestQuestionsState.FetchTestQuestionsData?.results.find(
              (item) => item.id === answer.testQuestionId,
            );
          if (row) {
            row.status =
              answer.citations.length > 0 || answer.products.length > 0
                ? "answered"
                : "unanswered";
            row.confidence = answer.confidence;
            row.lastAskedAt = new Date().toISOString();
            row.feedback = null;
          }
        }
      })
      .addCase(AskTestQuestion.rejected, (state, action) => {
        // The question stays, so the chat can show it with the error and retry.
        state.TestChatState.TestChatError =
          (action.payload as string) ??
          "Couldn't get an answer. Please try again.";
      })
      // SetTestAnswerFeedback
      .addCase(SetTestAnswerFeedback.pending, (state, action) => {
        setAnswerFeedback(state, action.meta.arg, action.meta.arg.feedback);
      })
      .addCase(SetTestAnswerFeedback.rejected, (state, action) => {
        setAnswerFeedback(state, action.meta.arg, action.meta.arg.previous);
      })
      // FetchUnansweredWorkflows
      .addCase(FetchUnansweredWorkflows.pending, (state) => {
        state.FetchUnansweredWorkflowsState.FetchUnansweredWorkflowsIsLoading = true;
      })
      .addCase(FetchUnansweredWorkflows.fulfilled, (state, action) => {
        state.FetchUnansweredWorkflowsState.FetchUnansweredWorkflowsIsLoading = false;
        state.FetchUnansweredWorkflowsState.FetchUnansweredWorkflowsData =
          action.payload;
      })
      .addCase(FetchUnansweredWorkflows.rejected, (state) => {
        state.FetchUnansweredWorkflowsState.FetchUnansweredWorkflowsIsLoading = false;
        state.FetchUnansweredWorkflowsState.FetchUnansweredWorkflowsData ??= [];
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

export const { ResetTestChat, ResetUnansweredQuestions } =
  KnowledgeTestAiSlice.actions;

export default KnowledgeTestAiSlice.reducer;
