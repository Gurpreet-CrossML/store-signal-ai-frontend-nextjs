import {
  KNOWLEDGE_FILE_BATCH_MAX_BYTES,
  KNOWLEDGE_FILE_BATCH_MAX_FILES,
} from "@/lib/config";

/** What became of one document in an upload. */
export type FileOutcome =
  /** Saved as a knowledge item. */
  | { status: "added" }
  /** Not saved because the knowledge base already has it: nothing to fix. */
  | { status: "skipped"; message: string }
  /** Refused by the server; the file has to change before it can be added. */
  | { status: "failed"; message: string }
  /** Never sent, because the upload stopped first; nothing is wrong with it. */
  | { status: "notSent" };

/** The server's answer to one group of files. Positions are those of the file
 * in the whole upload, not in the group. */
export type GroupReply =
  | { kind: "saved"; savedIndexes: number[] }
  | { kind: "invalid"; errors: Record<number, string> }
  | { kind: "failed"; message: string };

export type BatchedUploadResult = {
  /** One per file, in the order given. */
  outcomes: FileOutcome[];
  /** Why the upload stopped before every group was sent; null if it didn't. */
  stoppedMessage: string | null;
};

// The server words a copy of something it already has in one of these ways
// (`knowledge/serializers.py`). A copy is not a problem to fix, so it is told
// apart from a real rejection.
const DUPLICATE_MESSAGE = /already been added|same content as/i;

/** Groups files, in order, so a group has at most
 * `KNOWLEDGE_FILE_BATCH_MAX_FILES` files and `KNOWLEDGE_FILE_BATCH_MAX_BYTES`
 * bytes. Returns the positions of each group's files. */
export function planFileBatches(sizes: number[]): number[][] {
  const groups: number[][] = [];
  let current: number[] = [];
  let bytes = 0;

  sizes.forEach((size, index) => {
    const full =
      current.length >= KNOWLEDGE_FILE_BATCH_MAX_FILES ||
      (current.length > 0 && bytes + size > KNOWLEDGE_FILE_BATCH_MAX_BYTES);
    if (full) {
      groups.push(current);
      current = [];
      bytes = 0;
    }
    current.push(index);
    bytes += size;
  });
  if (current.length > 0) groups.push(current);
  return groups;
}

/** How the upload stands, reported while it runs. */
export type UploadSnapshot = {
  /** One per file, in the order given. */
  outcomes: FileOutcome[];
  /** The files in the request that is being sent right now. */
  active: number[];
};

/**
 * Sends files group by group and says what became of each one.
 *
 * The server saves a group all together or not at all, so when it refuses some
 * files of a group the others were not saved either. They have been checked by
 * then, so they are sent again once, without the refused ones, and the rest of
 * the upload carries on. Anything else that goes wrong (the connection, a
 * timeout, a server error, no storage left) stops the upload: what the server
 * did with that group is unknown, so the files from there on are left unsent.
 *
 * Given the outcomes of an earlier run, only the files still unsent are sent.
 */
export async function uploadInGroups({
  sizes,
  initial,
  send,
  onChange,
}: {
  sizes: number[];
  /** The outcomes so far, to carry on from; every file is unsent if omitted. */
  initial?: FileOutcome[];
  send: (indexes: number[]) => Promise<GroupReply>;
  /** Called whenever something changes, so the screen can follow along. */
  onChange?: (snapshot: UploadSnapshot) => void;
}): Promise<BatchedUploadResult> {
  const outcomes: FileOutcome[] = sizes.map(
    (_, index) => initial?.[index] ?? { status: "notSent" },
  );
  const report = (active: number[]) =>
    onChange?.({ outcomes: [...outcomes], active });

  const unsent = outcomes.flatMap((outcome, index) =>
    outcome.status === "notSent" ? [index] : [],
  );
  const groups = planFileBatches(unsent.map((index) => sizes[index])).map(
    (group) => group.map((at) => unsent[at]),
  );

  let stoppedMessage: string | null = null;
  report([]);

  for (const group of groups) {
    let pending = group;

    // At most two tries: the group, then the files left after refusals.
    for (let attempt = 0; attempt < 2 && pending.length > 0; attempt++) {
      report(pending);
      const reply = await send(pending);

      if (reply.kind === "failed") {
        stoppedMessage = reply.message;
        break;
      }

      if (reply.kind === "saved") {
        const saved = new Set(reply.savedIndexes);
        pending.forEach((index) => {
          if (saved.has(index)) outcomes[index] = { status: "added" };
        });
        // Fewer saved than sent: the server ran out of room for the rest.
        if (pending.some((index) => !saved.has(index))) {
          stoppedMessage = "There isn't enough storage left for the rest.";
        }
        pending = [];
        break;
      }

      pending.forEach((index) => {
        const message = reply.errors[index];
        if (message === undefined) return;
        outcomes[index] = DUPLICATE_MESSAGE.test(message)
          ? { status: "skipped", message }
          : { status: "failed", message };
      });
      pending = pending.filter((index) => reply.errors[index] === undefined);
      report([]);
    }

    report([]);
    if (stoppedMessage) break;
  }

  return { outcomes, stoppedMessage };
}

/** What a file's row shows while an upload runs or after it. */
export type RowStatus = {
  status: FileOutcome["status"] | "uploading" | "waiting";
  /** What to tell the user under the file name, if anything. */
  detail?: string;
};

/** How one file stands, in words for its row. `running` is true while the
 * upload is going, when an unsent file is still waiting its turn. */
export function describeRow(
  outcome: FileOutcome,
  { uploading, running }: { uploading: boolean; running: boolean },
): RowStatus {
  if (uploading) return { status: "uploading" };
  switch (outcome.status) {
    case "added":
      return { status: "added" };
    case "notSent":
      return running
        ? { status: "waiting" }
        : {
            status: "notSent",
            detail: "Not sent. Nothing is wrong with this file.",
          };
    case "skipped":
      return {
        status: "skipped",
        // A copy within the upload names its twin; a stored one is just skipped.
        detail: /same content as/i.test(outcome.message)
          ? outcome.message
          : "Already in your knowledge, so it was skipped.",
      };
    case "failed": {
      const { reason, fix } = describeFileProblem(outcome.message);
      return {
        status: "failed",
        detail: [reason, fix].filter(Boolean).join(" "),
      };
    }
  }
}

/** A refusal in plain words: what is wrong, and what to do about it. */
export type FileProblem = { reason: string; fix?: string };

/** The refusals the server words in a known way, each turned into plain words
 * that state the limit, so the user knows what to aim for. The numbers come
 * from the server's own message, which has the real limit (and for pages, how
 * many this document has). */
const PROBLEM_PATTERNS: {
  pattern: RegExp;
  describe: (match: RegExpMatchArray) => FileProblem;
}[] = [
  {
    pattern: /unsupported file type/i,
    describe: () => ({
      reason: "This file type isn't supported.",
      fix: "Save it as PDF, Word, Excel, CSV or an image, then add it again.",
    }),
  },
  {
    pattern: /size must not exceed ([\d.]+) ?MB/i,
    describe: ([, limit]) => ({
      reason: `This file is too big. The most allowed is ${limit} MB per file.`,
      fix: `Make it smaller than ${limit} MB, or split it into parts, then add it again.`,
    }),
  },
  {
    pattern: /must not exceed ([\d,]+) pages(?: \(this one has ([\d,]+)\))?/i,
    describe: ([, limit, actual]) => ({
      reason: actual
        ? `This document has ${actual} pages. The most allowed is ${limit} pages per document.`
        : `This document has too many pages. The most allowed is ${limit} pages per document.`,
      fix: `Split it into smaller documents of ${limit} pages or fewer, then add them again.`,
    }),
  },
  {
    pattern: /must not exceed ([\d,]+) records/i,
    describe: ([, limit]) => ({
      reason: `This file has too many rows. The most allowed is ${limit} rows per file.`,
      fix: `Split the rows across several files of ${limit} rows or fewer, then add them again.`,
    }),
  },
  {
    pattern: /no records/i,
    describe: () => ({
      reason: "This file has nothing to read.",
      fix: "Check that it has rows or items in it, then add it again.",
    }),
  },
  {
    pattern: /could not be read|corrupt/i,
    describe: () => ({
      reason: "We couldn't read this file.",
      fix: "Open it and save it again, then add it again.",
    }),
  },
];

/** Puts a server refusal into plain words. A message with no match is shown
 * as the server wrote it. */
export function describeFileProblem(message: string): FileProblem {
  for (const { pattern, describe } of PROBLEM_PATTERNS) {
    const match = message.match(pattern);
    if (match) return describe(match);
  }
  return { reason: message };
}
