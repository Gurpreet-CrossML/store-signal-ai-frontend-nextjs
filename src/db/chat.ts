import { getDb, resolveStoreScope } from "@/lib/tenant-context";
import {
  store,
  toneStyle,
  vocabulary,
  vocabularyWordReplacements,
  wordReplacement,
} from "@/lib/drizzle/schema";
import { asc, eq } from "drizzle-orm";

/**
 * Brand Voice domain helpers.
 *
 * the query logic and the route layer stays thin. The Next API routes call these
 * helpers, which read from the tenant-scoped Postgres schema via `getDb()`.
 */

export type ToneStyleRecord = {
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

export type ToneStylePayload = Omit<
  ToneStyleRecord,
  "created_at" | "updated_at"
>;

export type WordReplacementRecord = {
  id: number;
  say_word: string;
  replace_word: string;
  is_active: boolean;
};

export type WordReplacementPayload = Omit<WordReplacementRecord, "id">;

export type VocabularyRecord = {
  preferred_phrases: string[];
  banned_words: string[];
  signature_phrases: string[];
  word_replacements: WordReplacementRecord[];
  created_at: string;
  updated_at: string;
};

export type VocabularyPayload = {
  preferred_phrases: string[];
  banned_words: string[];
  signature_phrases: string[];
  word_replacements: WordReplacementPayload[];
};

const DEFAULT_TONE_STYLE = {
  preset: "friendly",
  warmth: 50,
  formality: 50,
  energy: 50,
  playfulness: 50,
  directness: 50,
  answer_length: "standard",
  regional_spelling: "auto",
  use_bullet_points: true,
  frequency_policy: "sparing",
};

const DEFAULT_VOCABULARY = {
  preferred_phrases: [] as string[],
  banned_words: [] as string[],
  signature_phrases: [] as string[],
  word_replacements: [] as WordReplacementRecord[],
};

function nowIso() {
  return new Date().toISOString();
}

export function buildToneStyleDefaults(): ToneStyleRecord {
  const timestamp = nowIso();
  return {
    ...DEFAULT_TONE_STYLE,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

export function buildVocabularyDefaults(): VocabularyRecord {
  const timestamp = nowIso();
  return {
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
): Promise<ToneStyleRecord | null> {
  const storeRow = await get_store_by_code(store_code);
  if (!storeRow) {
    return null;
  }

  const db = getDb();
  const rows = await db
    .select({
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

  return rows[0] ?? null;
}

export async function getVocabulary(
  store_code: string,
): Promise<VocabularyRecord | null> {
  const storeRow = await get_store_by_code(store_code);
  if (!storeRow) {
    return null;
  }

  const db = getDb();
  const rows = await db
    .select({
      id: vocabulary.id,
      preferred_phrases: vocabulary.preferredPhrases,
      banned_words: vocabulary.bannedWords,
      signature_phrases: vocabulary.signaturePhrases,
      created_at: vocabulary.createdAt,
      updated_at: vocabulary.updatedAt,
    })
    .from(vocabulary)
    .where(eq(vocabulary.storeId, storeRow.id))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  const vocabularyId = row.id;

  const replacements = await db
    .select({
      id: wordReplacement.id,
      say_word: wordReplacement.sayWord,
      replace_word: wordReplacement.replaceWord,
      is_active: wordReplacement.isActive,
    })
    .from(vocabularyWordReplacements)
    .innerJoin(
      wordReplacement,
      eq(vocabularyWordReplacements.wordreplacementId, wordReplacement.id),
    )
    .where(eq(vocabularyWordReplacements.vocabularyId, vocabularyId))
    .orderBy(asc(vocabularyWordReplacements.id));

  const { id, ...base } = row;
  void id;
  return {
    ...base,
    preferred_phrases: (row.preferred_phrases ?? []) as string[],
    banned_words: (row.banned_words ?? []) as string[],
    signature_phrases: (row.signature_phrases ?? []) as string[],
    word_replacements: replacements,
  };
}
