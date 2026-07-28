import { and, asc, eq, SQL } from "drizzle-orm";

import { getDb } from "@/lib/tenant-context";
import {
  neverSayRules,
  personaIdentity,
  store,
  tonePreset,
  toneStyle,
  vocabulary,
  vocabularyPreset,
  neverSayRulesPreset,
  vocabularyWordReplacements,
  wordReplacement,
} from "@/lib/drizzle/schema";
import { getAbsoluteS3Url } from "@/lib/url";
import { storeIdScope } from "./access";

// Persona Identity Types

export type SelfReference = "i" | "we";

export type PersonaIdentityRow = {
  name: string;
  role_description: string;
  self_reference: SelfReference;
  email_signature: string;
  backstory: string;
  created_at: string;
  updated_at: string;
};

// Never Say Rules Types

export type RequiredLegalPhrase = { context: string; phrase: string };

export type NeverSayRulesRow = {
  no_hollow_apologies: boolean;
  never_reveal_ai_unprompted: boolean;
  do_not_say_phrases: string[];
  forbidden_claims: string[];
  required_legal_phrases: RequiredLegalPhrase[];
  created_at: string;
  updated_at: string;
};

export type NeverSayRulesPresetRecord = {
  id: number;
  do_not_say_phrases: string[];
  forbidden_claims: string[];
  required_legal_phrases: RequiredLegalPhrase[];
};

// Tone & Style Types

export type ToneStyleRecord = {
  preset: number;
  warmth: number;
  formality: number;
  energy: number;
  playfulness: number;
  directness: number;
  answer_length: string;
  regional_spelling: string;
  use_bullet_points: boolean;
  emoji_policy: string;
  exclamation_marks_policy: string;
  created_at: string;
  updated_at: string;
};

export type ToneStylePayload = Omit<
  ToneStyleRecord,
  "created_at" | "updated_at"
>;

export type TonePresetRecord = {
  id: number;
  name: string;
  description: string;
  icon: string | null;
  warmth: number;
  formality: number;
  energy: number;
  playfulness: number;
  directness: number;
  preview_question: string;
  preview_message: string;
};

// Vocabulary Types

export type WordReplacementRecord = {
  id: number;
  say_word: string;
  replace_word: string;
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

export type WordReplacementPair = {
  say_word: string;
  replace_word: string;
};

export type VocabularyPresetRecord = {
  id: number;
  preferred_phrases: string[];
  banned_words: string[];
  signature_phrases: string[];
  word_replacement_pairs: WordReplacementPair[];
};

export type VocabularyPayload = {
  preferred_phrases: string[];
  banned_words: string[];
  signature_phrases: string[];
  word_replacements: WordReplacementPayload[];
};

// Queries

/**
 * Port of PersonaIdentity fetching logic.
 */
export async function getPersonaIdentity(
  storeCode: string,
): Promise<PersonaIdentityRow | null> {
  const db = getDb();
  const conditions: SQL[] = [];
  const scope = storeIdScope(personaIdentity.storeId, storeCode);
  if (scope) conditions.push(scope);

  const rows = await db
    .select({
      name: personaIdentity.name,
      role_description: personaIdentity.roleDescription,
      self_reference: personaIdentity.selfReference,
      email_signature: personaIdentity.emailSignature,
      backstory: personaIdentity.backstory,
      created_at: personaIdentity.createdAt,
      updated_at: personaIdentity.updatedAt,
    })
    .from(personaIdentity)
    .where(conditions.length ? and(...conditions) : undefined)
    .limit(1);

  return (rows[0] as PersonaIdentityRow | undefined) ?? null;
}

/**
 * Port of NeverSayRules fetching logic.
 */
export async function getNeverSayRules(
  storeCode: string,
): Promise<NeverSayRulesRow | null> {
  const db = getDb();
  const conditions: SQL[] = [];
  const scope = storeIdScope(neverSayRules.storeId, storeCode);
  if (scope) conditions.push(scope);

  const rows = await db
    .select({
      no_hollow_apologies: neverSayRules.noHollowApologies,
      never_reveal_ai_unprompted: neverSayRules.neverRevealAiUnprompted,
      do_not_say_phrases: neverSayRules.doNotSayPhrases,
      forbidden_claims: neverSayRules.forbiddenClaims,
      required_legal_phrases: neverSayRules.requiredLegalPhrases,
      created_at: neverSayRules.createdAt,
      updated_at: neverSayRules.updatedAt,
    })
    .from(neverSayRules)
    .where(conditions.length ? and(...conditions) : undefined)
    .limit(1);

  return (rows[0] as NeverSayRulesRow | undefined) ?? null;
}

/**
 * Port of ToneStyle fetching logic.
 */
export async function getToneStyle(
  store_code: string,
): Promise<ToneStyleRecord | null> {
  const db = getDb();
  const conditions: SQL[] = [];
  const scope = storeIdScope(toneStyle.storeId, store_code);
  if (scope) conditions.push(scope);

  const rows = await db
    .select({
      preset: toneStyle.presetId,
      warmth: toneStyle.warmth,
      formality: toneStyle.formality,
      energy: toneStyle.energy,
      playfulness: toneStyle.playfulness,
      directness: toneStyle.directness,
      answer_length: toneStyle.answerLength,
      regional_spelling: toneStyle.regionalSpelling,
      use_bullet_points: toneStyle.useBulletPoints,
      emoji_policy: toneStyle.emojiPolicy,
      exclamation_marks_policy: toneStyle.exclamationMarksPolicy,
      created_at: toneStyle.createdAt,
      updated_at: toneStyle.updatedAt,
    })
    .from(toneStyle)
    .where(conditions.length ? and(...conditions) : undefined)
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Port of TonePresets listing logic.
 */
export async function listTonePresets(): Promise<TonePresetRecord[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: tonePreset.id,
      name: tonePreset.name,
      description: tonePreset.description,
      icon: tonePreset.icon,
      warmth: tonePreset.warmth,
      formality: tonePreset.formality,
      energy: tonePreset.energy,
      playfulness: tonePreset.playfulness,
      directness: tonePreset.directness,
      preview_question: tonePreset.previewQuestion,
      preview_message: tonePreset.previewMessage,
    })
    .from(tonePreset)
    .orderBy(asc(tonePreset.id));

  return rows.map((row) => ({
    ...row,
    icon: row.icon ? getAbsoluteS3Url(row.icon) : null,
  }));
}

/**
 * Port of Vocabulary fetching logic.
 */
export async function getVocabulary(
  store_code: string,
): Promise<VocabularyRecord | null> {
  const db = getDb();
  const conditions: SQL[] = [];
  const scope = storeIdScope(vocabulary.storeId, store_code);
  if (scope) conditions.push(scope);

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
    .where(conditions.length ? and(...conditions) : undefined)
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  const vocabularyId = row.id;

  const replacements = await db
    .select({
      id: wordReplacement.id,
      say_word: wordReplacement.sayWord,
      replace_word: wordReplacement.replaceWord,
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

export async function listVocabularyPresets(): Promise<
  VocabularyPresetRecord[]
> {
  const db = getDb();
  const rows = await db
    .select({
      id: vocabularyPreset.id,
      preferred_phrases: vocabularyPreset.preferredPhrases,
      banned_words: vocabularyPreset.bannedWords,
      signature_phrases: vocabularyPreset.signaturePhrases,
      word_replacement_pairs: vocabularyPreset.wordReplacementPairs,
    })
    .from(vocabularyPreset)
    .orderBy(asc(vocabularyPreset.id));

  return rows as VocabularyPresetRecord[];
}

export async function listNeverSayRulesPresets(): Promise<
  NeverSayRulesPresetRecord[]
> {
  const db = getDb();
  const rows = await db
    .select({
      id: neverSayRulesPreset.id,
      do_not_say_phrases: neverSayRulesPreset.doNotSayPhrases,
      forbidden_claims: neverSayRulesPreset.forbiddenClaims,
      required_legal_phrases: neverSayRulesPreset.requiredLegalPhrases,
    })
    .from(neverSayRulesPreset)
    .orderBy(asc(neverSayRulesPreset.id));

  return rows as unknown as NeverSayRulesPresetRecord[];
}
