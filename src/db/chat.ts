import { and, eq } from "drizzle-orm";

import { getDb, resolveStoreScope } from "@/lib/tenant-context";
import { neverSayRules, personaIdentity, store } from "@/lib/drizzle/schema";

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

function canAccessStore(storeCode: string) {
  const scope = resolveStoreScope(storeCode);
  return scope === null || scope.includes(storeCode);
}

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
