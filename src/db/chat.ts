import { and, asc, eq } from "drizzle-orm";

import { getDb, resolveStoreScope } from "@/lib/tenant-context";
import {
  neverSayRules,
  personaIdentity,
  store,
  tonePreset,
  toneStyle,
  vocabulary,
  vocabularyWordReplacements,
  wordReplacement,
} from "@/lib/drizzle/schema";
import { getAbsoluteS3Url } from "@/lib/url";

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
  frequency_policy: string;
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


function canAccessStore(storeCode: string) {
  const scope = resolveStoreScope(storeCode);
  return scope === null || scope.includes(storeCode);
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

// Queries

export async function getPersonaIdentity(
  storeCode: string,
): Promise<PersonaIdentityRow | null> {
  if (!canAccessStore(storeCode)) return null;

  const rows = await getDb()
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
    .innerJoin(store, eq(personaIdentity.storeId, store.id))
    .where(and(eq(store.code, storeCode)))
    .limit(1);

  return (rows[0] as PersonaIdentityRow | undefined) ?? null;
}

export async function getNeverSayRules(
  storeCode: string,
): Promise<NeverSayRulesRow | null> {
  if (!canAccessStore(storeCode)) return null;

  const rows = await getDb()
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
    .innerJoin(store, eq(neverSayRules.storeId, store.id))
    .where(and(eq(store.code, storeCode)))
    .limit(1);

  return (rows[0] as NeverSayRulesRow | undefined) ?? null;
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
      preset: toneStyle.presetId,
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
