"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  IconAlertTriangle,
  IconDeviceFloppy,
  IconPlus,
  IconTags,
  IconTrash,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { InfoIcon } from "@/components/custom/info-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import {
  ACTIONS,
  DEFAULT_INTENTS,
  INTENT_GROUPS,
  MANUAL_NOTE,
  SECTION_INFO,
  type ActionId,
  type Autonomy,
} from "@/lib/comment-handling-data";
import { toggleInList } from "@/lib/helpers";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  deleteTopicRule,
  fetchCommentSettings,
  fetchSocialAccountsSubscriptions,
  saveIntentRule,
  saveTopicRule,
  type CommentIntentRule,
  type CommentSettingsAction,
  type CommentTopicRule,
} from "@/redux/api-slice/social-ai-slice";

/* -------------------------------------------------------------------- */
/* Display metadata, keyed by the ids the API uses                       */
/* -------------------------------------------------------------------- */

const ACTION_META = new Map(ACTIONS.map((action) => [action.id, action]));
const INTENT_META = new Map(
  DEFAULT_INTENTS.map((intent) => [intent.id, intent]),
);

// The one topic the backend refuses a rule for — it means "no specific
// subject", so it always falls back to the intent card.
const UNRULEABLE_TOPIC = "general";

/** actions compare as sets and autonomy as-is — order comes from the backend. */
function sameRule(
  a: { actions: ActionId[]; autonomy: Autonomy },
  b?: { actions: ActionId[]; autonomy: Autonomy },
) {
  if (!b) return false;
  return (
    a.autonomy === b.autonomy &&
    [...a.actions].sort().join() === [...b.actions].sort().join()
  );
}

/* -------------------------------------------------------------------- */
/* Pieces                                                                */
/* -------------------------------------------------------------------- */

/** Manual / Draft Automatically / Auto. */
function AutonomySelect({
  levels,
  value,
  onChange,
  label,
}: {
  levels: { value: Autonomy; label: string }[];
  value: Autonomy;
  onChange: (value: Autonomy) => void;
  label: string;
}) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as Autonomy)}>
      <SelectTrigger size="sm" className="w-44" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {levels.map((level) => (
          <SelectItem key={level.value} value={level.value}>
            {level.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * The actions set on a rule, with a checklist to change them.
 *
 * `options` come from the API in priority order — the fixed order the AI
 * executes them in — so the chips and the checklist both read as that
 * sequence. Users pick a subset, they never reorder it.
 */
function ActionPicker({
  options,
  actions,
  onToggle,
}: {
  options: CommentSettingsAction[];
  actions: ActionId[];
  onToggle: (id: ActionId) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Typography variant="caption">
        Actions the AI may take, in the order it takes them
      </Typography>
      <div className="flex flex-wrap items-center gap-2">
        {options
          .filter((action) => actions.includes(action.id))
          .map((action) => (
            <Badge
              key={action.id}
              variant="outline"
              className={
                BADGE_TONE_STYLES[ACTION_META.get(action.id)?.tone ?? "neutral"]
              }
            >
              {action.label}
            </Badge>
          ))}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <IconPlus data-icon="inline-start" />
              {actions.length ? "Edit Actions" : "Add Actions"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {options.map((action) => (
              <DropdownMenuCheckboxItem
                key={action.id}
                checked={actions.includes(action.id)}
                // Radix closes on select by default; keep it open so
                // several can be ticked in one go.
                onSelect={(event) => event.preventDefault()}
                onCheckedChange={() => onToggle(action.id)}
              >
                {action.priority} · {action.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- */
/* Screen                                                                */
/* -------------------------------------------------------------------- */

/**
 * How the AI handles comments, per connected account.
 *
 * Two lists, deliberately: the intent cards are the baseline every comment
 * falls back to, and a topic rule overrides that baseline when the comment
 * is about that subject. Rules resolve against the account the comment
 * arrived on, so the screen starts with an account picker and everything
 * below it belongs to that account.
 */
export default function SocialCommentHandling() {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const {
    FetchSocialAccountsSubscriptionsData: accountsData,
    FetchSocialAccountsSubscriptionsIsLoading: accountsLoading,
  } = useAppSelector(
    (state) => state.GetSocialAIReducer.FetchSocialAccountSubscriptionsState,
  );
  const {
    FetchCommentSettingsData: settingsData,
    FetchCommentSettingsIsLoading: settingsLoading,
  } = useAppSelector(
    (state) => state.GetSocialAIReducer.FetchCommentSettingsState,
  );

  const accounts = accountsData?.results ?? [];
  const [pickedAccountId, setSelectedAccountId] = useState("");
  // Until the user picks, the first connected account is the one configured.
  const selectedAccountId =
    pickedAccountId || (accounts.length ? String(accounts[0].id) : "");

  // The account's saved config lives in redux; these two hold the edits on
  // top of it, reseeded whenever a fresh config arrives.
  const [intents, setIntents] = useState<CommentIntentRule[]>([]);
  const [topicRules, setTopicRules] = useState<CommentTopicRule[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (storeCode) dispatch(fetchSocialAccountsSubscriptions(storeCode));
  }, [dispatch, storeCode]);

  useEffect(() => {
    if (!storeCode || !selectedAccountId) return;
    let cancelled = false;
    dispatch(fetchCommentSettings({ storeCode, accountId: selectedAccountId }))
      .unwrap()
      .then((config) => {
        if (cancelled) return;
        setIntents(config.intents);
        setTopicRules(config.topic_rules);
      })
      .catch(() => {
        // The thunk already toasts; the screen stays on its empty state.
      });
    return () => {
      cancelled = true;
    };
  }, [dispatch, storeCode, selectedAccountId]);

  // Never render one account's rules under another account's picker value —
  // the fetch clears the slot, but a guard is what makes that a promise.
  const config =
    settingsData && String(settingsData.account.id) === selectedAccountId
      ? settingsData
      : null;

  const topicLabel = (topic: string) =>
    config?.topics.find((entry) => entry.value === topic)?.label ?? topic;

  const savedIntentById = useMemo(
    () => new Map((config?.intents ?? []).map((rule) => [rule.id, rule])),
    [config],
  );
  const savedTopicByTopic = useMemo(
    () =>
      new Map((config?.topic_rules ?? []).map((rule) => [rule.topic, rule])),
    [config],
  );

  const dirtyIntents = intents.filter(
    (rule) => !sameRule(rule, savedIntentById.get(rule.id)),
  );
  const dirtyTopicRules = topicRules.filter(
    (rule) => !sameRule(rule, savedTopicByTopic.get(rule.topic)),
  );
  const removedTopicRules = (config?.topic_rules ?? []).filter(
    (saved) => !topicRules.some((rule) => rule.topic === saved.topic),
  );
  const isDirty =
    dirtyIntents.length > 0 ||
    dirtyTopicRules.length > 0 ||
    removedTopicRules.length > 0;

  const ruleableTopics = (config?.topics ?? []).filter(
    (topic) => topic.value !== UNRULEABLE_TOPIC,
  );
  const unusedTopics = ruleableTopics.filter(
    (topic) => !topicRules.some((rule) => rule.topic === topic.value),
  );
  const suggestedRules = (config?.suggested_topic_rules ?? []).filter(
    (suggested) => !topicRules.some((rule) => rule.topic === suggested.topic),
  );

  /**
   * The API saves rule-by-rule, so one press of Save diffs the edits
   * against the loaded config and issues only the calls that change
   * something. Fulfilled saves patch the redux config, which is what
   * clears the dirty state per rule — a partial failure stays dirty.
   */
  const handleSave = async () => {
    if (!config) return;
    setIsSaving(true);
    const accountId = selectedAccountId;
    const results = await Promise.allSettled([
      ...dirtyIntents.map((rule) =>
        dispatch(
          saveIntentRule({
            storeCode,
            accountId,
            intent: rule.id,
            actions: rule.actions,
            autonomy: rule.autonomy,
          }),
        ).unwrap(),
      ),
      ...dirtyTopicRules.map((rule) =>
        dispatch(
          saveTopicRule({
            storeCode,
            accountId,
            topic: rule.topic,
            actions: rule.actions,
            autonomy: rule.autonomy,
          }),
        ).unwrap(),
      ),
      ...removedTopicRules.map((rule) =>
        dispatch(
          deleteTopicRule({ storeCode, accountId, topic: rule.topic }),
        ).unwrap(),
      ),
    ]);
    setIsSaving(false);
    if (results.every((result) => result.status === "fulfilled")) {
      toast.success("Comment handling saved", {
        description: "The AI follows these rules on new comments from now on.",
      });
    }
  };

  const patchIntent = (id: string, patch: Partial<CommentIntentRule>) =>
    setIntents((rules) =>
      rules.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)),
    );

  const patchTopicRule = (topic: string, patch: Partial<CommentTopicRule>) =>
    setTopicRules((rules) =>
      rules.map((rule) =>
        rule.topic === topic ? { ...rule, ...patch } : rule,
      ),
    );

  const addTopicRule = () => {
    const topic = unusedTopics[0];
    setTopicRules((rules) => [
      ...rules,
      {
        id: `topic-${topic.value}`,
        topic: topic.value,
        label: topic.label,
        // A new exception starts with nothing and no autonomy — it should
        // not be able to act before anyone has configured it.
        actions: [],
        autonomy: "manual",
      },
    ]);
  };

  if (!accountsLoading && accounts.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <IconTags />
          </EmptyMedia>
          <EmptyTitle>No Connected Accounts</EmptyTitle>
          <EmptyDescription>
            Comment rules are set per connected account. Connect a Facebook page
            or Instagram account first.
          </EmptyDescription>
        </EmptyHeader>
        <Button variant="outline" size="sm" asChild>
          <Link href="/settings/social-ai/accounts">Connected Accounts</Link>
        </Button>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Typography variant="caption" as="p">
          Every connected account has its own rules — pick the one to configure.
        </Typography>
        <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
          <SelectTrigger className="w-64" aria-label="Connected account">
            <SelectValue placeholder="Select an account" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={String(account.id)}>
                {account.name} ·{" "}
                {account.channel_type === "instagram"
                  ? "Instagram"
                  : "Facebook"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {config && !config.account.allow_ai_auto_respond && (
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconAlertTriangle className="size-4" />
              AI responses are off for this account
            </CardTitle>
            <CardDescription>
              While the account&apos;s AI toggle is off, comments are only
              tagged — none of the rules below run.
            </CardDescription>
            <CardAction>
              <Button variant="outline" size="sm" asChild>
                <Link href="/settings/social-ai/accounts">Manage Accounts</Link>
              </Button>
            </CardAction>
          </CardHeader>
        </Card>
      )}

      {!config || settingsLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-6">
            <Typography
              variant="small"
              as="h3"
              className="flex items-center gap-2"
            >
              Actions per Intent
              <InfoIcon text={SECTION_INFO} />
            </Typography>

            {INTENT_GROUPS.map((group) => (
              <div key={group} className="flex flex-col gap-3">
                <Typography variant="caption" as="h4">
                  {group}
                </Typography>
                {intents
                  .filter(
                    (intent) =>
                      (INTENT_META.get(intent.id)?.group ??
                        "Reactions & Everything Else") === group,
                  )
                  .map((intent) => {
                    const meta = INTENT_META.get(intent.id);
                    const MetaIcon = meta?.icon;
                    return (
                      <Card key={intent.id} size="sm">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            {MetaIcon && <MetaIcon className="size-4" />}
                            {intent.label}
                            {/* The ⓘ carries the fuller description and real
                          examples, so the line below it can stay one short
                          tagline. */}
                            {meta?.info && <InfoIcon text={meta.info} />}
                            {intent.is_customized && (
                              <Badge variant="secondary">Customized</Badge>
                            )}
                          </CardTitle>
                          {meta?.tagline && (
                            <CardDescription>{meta.tagline}</CardDescription>
                          )}
                          <CardAction>
                            <AutonomySelect
                              levels={config.autonomy_levels}
                              value={intent.autonomy}
                              label={`How far the AI goes on ${intent.label}`}
                              onChange={(autonomy) =>
                                patchIntent(intent.id, { autonomy })
                              }
                            />
                          </CardAction>
                        </CardHeader>
                        <CardContent>
                          {/* On Manual the AI does nothing, so there is nothing
                        to configure — the picker is not shown at all rather
                        than offering actions that would never run. */}
                          {intent.autonomy === "manual" ? (
                            <Typography variant="caption" as="p">
                              {MANUAL_NOTE}
                            </Typography>
                          ) : (
                            <>
                              <ActionPicker
                                options={config.actions}
                                actions={intent.actions}
                                onToggle={(id) =>
                                  patchIntent(intent.id, {
                                    actions: toggleInList(intent.actions, id),
                                  })
                                }
                              />
                              {meta?.hint && (
                                <Typography variant="caption" as="p">
                                  {meta.hint}
                                </Typography>
                              )}
                            </>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Typography
                variant="small"
                as="h3"
                className="flex items-center gap-2"
              >
                Topic Overrides
                <InfoIcon text="A comment carries topics as well as an intent. When it matches one of these topics, this rule is used instead of its intent card." />
              </Typography>
              <Button
                variant="outline"
                size="sm"
                onClick={addTopicRule}
                disabled={unusedTopics.length === 0}
              >
                <IconPlus data-icon="inline-start" />
                Add Topic Rule
              </Button>
            </div>

            {suggestedRules.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <Typography variant="caption">Suggested:</Typography>
                {suggestedRules.map((suggested) => (
                  <Button
                    key={suggested.topic}
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setTopicRules((rules) => [...rules, suggested])
                    }
                  >
                    <IconPlus data-icon="inline-start" />
                    {suggested.label || topicLabel(suggested.topic)}
                  </Button>
                ))}
              </div>
            )}

            {topicRules.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia>
                    <IconTags />
                  </EmptyMedia>
                  <EmptyTitle>No Topic Overrides</EmptyTitle>
                  <EmptyDescription>
                    Every comment is handled by its intent card above. Add an
                    override to treat one subject differently.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              topicRules.map((rule) => (
                <Card key={rule.topic} size="sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconTags className="size-4" />
                      {topicLabel(rule.topic)}
                      <Badge variant="secondary">Overrides intent</Badge>
                    </CardTitle>
                    <CardDescription>
                      Used instead of the intent card whenever a comment is
                      tagged with this topic.
                    </CardDescription>
                    <CardAction>
                      <AutonomySelect
                        levels={config.autonomy_levels}
                        value={rule.autonomy}
                        label="How far the AI goes on this topic"
                        onChange={(autonomy) =>
                          patchTopicRule(rule.topic, { autonomy })
                        }
                      />
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-2">
                      <Typography variant="caption">Topic</Typography>
                      <Select
                        value={rule.topic}
                        onValueChange={(topic) =>
                          patchTopicRule(rule.topic, {
                            topic,
                            label: topicLabel(topic),
                          })
                        }
                      >
                        <SelectTrigger size="sm" className="w-64">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ruleableTopics.map((topic) => (
                            <SelectItem
                              key={topic.value}
                              value={topic.value}
                              // One rule per topic, or two would contradict.
                              disabled={
                                topic.value !== rule.topic &&
                                topicRules.some(
                                  (other) => other.topic === topic.value,
                                )
                              }
                            >
                              {topic.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {rule.autonomy !== "manual" && (
                      <ActionPicker
                        options={config.actions}
                        actions={rule.actions}
                        onToggle={(id) =>
                          patchTopicRule(rule.topic, {
                            actions: toggleInList(rule.actions, id),
                          })
                        }
                      />
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                      {rule.autonomy === "manual" && (
                        <Typography variant="caption" as="p">
                          {MANUAL_NOTE}
                        </Typography>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Remove this topic rule"
                        className="ml-auto text-destructive hover:text-destructive"
                        onClick={() =>
                          setTopicRules((rules) =>
                            rules.filter((item) => item.topic !== rule.topic),
                          )
                        }
                      >
                        <IconTrash data-icon="inline-start" />
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="flex items-center gap-3 border-t border-border py-3">
            <Button
              type="button"
              size="lg"
              onClick={handleSave}
              disabled={!isDirty || isSaving}
            >
              {isSaving ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <IconDeviceFloppy data-icon="inline-start" />
              )}
              Save Changes
            </Button>
            {isDirty && (
              <Typography variant="caption">
                You have unsaved changes.
              </Typography>
            )}
          </div>
        </>
      )}
    </div>
  );
}
