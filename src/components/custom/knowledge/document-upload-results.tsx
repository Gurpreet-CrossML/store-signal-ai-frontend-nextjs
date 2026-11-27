import { IconAlertTriangle, IconCircleCheck } from "@tabler/icons-react";

import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import type { FileOutcome } from "@/lib/knowledge-upload";
import { cn } from "@/lib/utils";

/** How many documents ended in each way. */
export function countOutcomes(outcomes: FileOutcome[]) {
  const counts = { added: 0, skipped: 0, failed: 0, notSent: 0 };
  outcomes.forEach((outcome) => (counts[outcome.status] += 1));
  return counts;
}

/**
 * The note above the file list once an upload is over and not everything went
 * in: how many were added, what the user can do about the rest. The files
 * themselves show their own result in their rows.
 */
export function DocumentUploadSummary({
  outcomes,
  stoppedMessage,
}: {
  outcomes: FileOutcome[];
  /** Why the upload stopped early, if it did. */
  stoppedMessage: string | null;
}) {
  const { added, skipped, failed, notSent } = countOutcomes(outcomes);
  const total = outcomes.length;
  const hasProblem = failed > 0 || notSent > 0;

  const headline =
    added > 0
      ? `${added} of ${total} ${total === 1 ? "document was" : "documents were"} added`
      : skipped > 0 && !hasProblem
        ? "Nothing new was added"
        : "No documents were added";

  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm",
        hasProblem ? BADGE_TONE_STYLES.warning : BADGE_TONE_STYLES.accent,
      )}
    >
      {hasProblem ? (
        <IconAlertTriangle className="mt-0.5 size-4 shrink-0" />
      ) : (
        <IconCircleCheck className="mt-0.5 size-4 shrink-0" />
      )}
      <div className="flex flex-col gap-1">
        <p className="font-semibold">{headline}</p>
        {added > 0 && <p>The added ones are saved and are being read now.</p>}
        {skipped > 0 && (
          <p>
            {skipped} {skipped === 1 ? "was" : "were"} already in your
            knowledge, so {skipped === 1 ? "it was" : "they were"} skipped.
          </p>
        )}
        {failed > 0 && (
          <p>
            {failed} {failed === 1 ? "file was" : "files were"} refused. Each
            one says why below. Fix {failed === 1 ? "it" : "them"}, then add{" "}
            {failed === 1 ? "it" : "them"} again as new documents.
          </p>
        )}
        {notSent > 0 && (
          <p>
            {stoppedMessage ? `${stoppedMessage} ` : ""}
            {notSent} {notSent === 1 ? "file was" : "files were"} not sent.
            Nothing is wrong with {notSent === 1 ? "it" : "them"}, so you can
            send {notSent === 1 ? "it" : "them"} again.
          </p>
        )}
      </div>
    </div>
  );
}
