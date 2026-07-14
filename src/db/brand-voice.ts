import { getDb, resolveStoreScope } from "@/lib/tenant-context";
import { store, toneStyle, vocabulary } from "@/lib/drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Brand Voice domain helpers.
 *
 * This follows the same repo pattern as `src/db/threads.ts`: the DB helper owns
 * the query logic and the route layer stays thin. The Next API routes call these
 * helpers, which read from the tenant-scoped Postgres schema via `getDb()`.
 */

export type ToneStyleRecord = {
  id: number;
  store: number;
  preset: string;
  warmth: number;
  formality: number;
  energy: number;
  playfulness: number;
  directness: number;
  answer_length: string;
  regional_spelling: string;
  use_bullet_points: boolean;
  frequency_policy: string;
  created_at: string;
  updated_at: string;
};

export type VocabularyRecord = {
  id: number;
  store: number;
  preferred_phrases: string[];
  banned_words: string[];
  signature_phrases: string[];
  word_replacements: Record<string, string>;
  created_at: string;
  updated_at: string;
};

const DEFAULT_TONE_STYLE = {
  preset: "balanced",
  warmth: 50,
  formality: 50,
  energy: 50,
  playfulness: 50,
  directness: 50,
  answer_length: "medium",
  regional_spelling: "us",
  use_bullet_points: true,
  frequency_policy: "normal",
};

const DEFAULT_VOCABULARY = {
  preferred_phrases: [] as string[],
  banned_words: [] as string[],
  signature_phrases: [] as string[],
  word_replacements: {} as Record<string, string>,
};

function nowIso() {
  return new Date().toISOString();
}

export function buildToneStyleDefaults(storeId = 0): ToneStyleRecord {
  const timestamp = nowIso();
  return {
    id: 0,
    store: storeId,
    ...DEFAULT_TONE_STYLE,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

export function buildVocabularyDefaults(storeId = 0): VocabularyRecord {
  const timestamp = nowIso();
  return {
    id: 0,
    store: storeId,
    ...DEFAULT_VOCABULARY,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

export type StoreRow = {
  id: number;
  code: string;
  name: string;
  platform: string;
};

export async function get_store_by_code(
  store_code: string,
): Promise<StoreRow | null> {
  const db = getDb();
  const scope = resolveStoreScope(store_code);
  if (scope !== null && !scope.includes(store_code)) return null;

  const rows = await db
    .select({
      id: store.id,
      code: store.code,
      name: store.name,
      platform: store.platform,
    })
    .from(store)
    .where(eq(store.code, store_code))
    .limit(1);

  return rows[0] ?? null;
}

export async function getToneStyle(
  store_code: string,
): Promise<ToneStyleRecord> {
  const storeRow = await get_store_by_code(store_code);
  if (!storeRow) {
    return buildToneStyleDefaults();
  }

  const db = getDb();
  const rows = await db
    .select({
      id: toneStyle.id,
      store: toneStyle.storeId,
      preset: toneStyle.preset,
      warmth: toneStyle.warmth,
      formality: toneStyle.formality,
      energy: toneStyle.energy,
      playfulness: toneStyle.playfulness,
      directness: toneStyle.directness,
      answer_length: toneStyle.answerLength,
      regional_spelling: toneStyle.regionalSpelling,
      use_bullet_points: toneStyle.useBulletPoints,
      frequency_policy: toneStyle.frequencyPolicy,
      created_at: toneStyle.createdAt,
      updated_at: toneStyle.updatedAt,
    })
    .from(toneStyle)
    .where(eq(toneStyle.storeId, storeRow.id))
    .limit(1);

  return rows[0] ?? buildToneStyleDefaults(storeRow.id);
}

export async function getVocabulary(
  store_code: string,
): Promise<VocabularyRecord> {
  const storeRow = await get_store_by_code(store_code);
  if (!storeRow) {
    return buildVocabularyDefaults();
  }

  const db = getDb();
  const rows = await db
    .select({
      id: vocabulary.id,
      store: vocabulary.storeId,
      preferred_phrases: vocabulary.preferredPhrases,
      banned_words: vocabulary.bannedWords,
      signature_phrases: vocabulary.signaturePhrases,
      word_replacements: vocabulary.wordReplacements,
      created_at: vocabulary.createdAt,
      updated_at: vocabulary.updatedAt,
    })
    .from(vocabulary)
    .where(eq(vocabulary.storeId, storeRow.id))
    .limit(1);

  const row = rows[0];
  if (!row) return buildVocabularyDefaults(storeRow.id);

  return {
    ...row,
    preferred_phrases: (row.preferred_phrases ?? []) as string[],
    banned_words: (row.banned_words ?? []) as string[],
    signature_phrases: (row.signature_phrases ?? []) as string[],
    word_replacements: (row.word_replacements ?? {}) as Record<string, string>,
  };
}
