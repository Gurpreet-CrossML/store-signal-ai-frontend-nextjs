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

/** A sample customer question, the same for every store. */
export type TestQuestion = {
  id: number;
  question: string;
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
  id: number;
  question: string;
  /** Code of the workflow that couldn't answer it. */
  workflow: string | null;
  threadId: string;
  /** Whether the conversation is still open (it is in Support) or closed (in Threads). */
  threadIsActive: boolean;
  askedAt: string;
};

type ApiUnansweredQuestion = {
  id: number;
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
    id: number | null;
    title: string | null;
    url: string | null;
  }[];
  /** AI messages only: the catalogue products the answer was based on, as the chat shows them. */
  products: ProductData[];
};

/** What the answer endpoint returns for one question. */
type ApiTestAnswer = {
  answer: string;
  citations: TestMessage["citations"];
  products: ProductData[];
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
        },
        {
          id: crypto.randomUUID(),
          sender: KNOWLEDGE_TEST_SENDERS.ai,
          message: answer.answer,
          citations: answer.citations ?? [],
          products: answer.products ?? [],
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
      })
      .addCase(AskTestQuestion.rejected, (state, action) => {
        // The question stays, so the chat can show it with the error and retry.
        state.TestChatState.TestChatError =
          (action.payload as string) ??
          "Couldn't get an answer. Please try again.";
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
