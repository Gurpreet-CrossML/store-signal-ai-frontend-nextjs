"use client";

import { useState } from "react";
import {
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
import { Typography } from "@/components/ui/typography";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import {
  ACTIONS,
  AUTONOMY,
  DEFAULT_INTENTS,
  DEFAULT_TOPIC_RULES,
  INTENT_GROUPS,
  MANUAL_NOTE,
  SECTION_INFO,
  TOPICS,
  type ActionId,
  type Autonomy,
  type TopicRule,
} from "@/lib/comment-handling-data";
import { toggleInList } from "@/lib/helpers";

/* -------------------------------------------------------------------- */
/* Pieces                                                                */
/* -------------------------------------------------------------------- */

/** Manual / Draft Automatically / Auto. */
function AutonomySelect({
  value,
  onChange,
  label,
}: {
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
        {AUTONOMY.map((level) => (
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
 * Tick to add, untick to remove — the same shape the quick-actions picker
 * uses, rather than a chip with its own close button.
 */
function ActionPicker({
  actions,
  onToggle,
}: {
  actions: ActionId[];
  onToggle: (id: ActionId) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Typography variant="caption">Actions the AI may take</Typography>
      <div className="flex flex-wrap items-center gap-2">
        {ACTIONS.filter((action) => actions.includes(action.id)).map(
          (action) => (
            <Badge
              key={action.id}
              variant="outline"
              className={BADGE_TONE_STYLES[action.tone]}
            >
              {action.label}
            </Badge>
          ),
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <IconPlus data-icon="inline-start" />
              {actions.length ? "Edit Actions" : "Add Actions"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {ACTIONS.map((action) => (
              <DropdownMenuCheckboxItem
                key={action.id}
                checked={actions.includes(action.id)}
                // Radix closes on select by default; keep it open so
                // several can be ticked in one go.
                onSelect={(event) => event.preventDefault()}
                onCheckedChange={() => onToggle(action.id)}
              >
                {action.label}
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
 * How the AI handles comments.
 *
 * Two lists, deliberately: the intent cards are the baseline every comment
 * falls back to, and a topic rule overrides that baseline when the comment
 * is about that subject. Keeping them apart means the common case is a
 * fixed set of cards with nothing to manage, and the exceptions are visible
 * as exceptions rather than hidden inside a rule you have to open.
 */
export default function SocialCommentHandling() {
  const [intents, setIntents] = useState(DEFAULT_INTENTS);
  const [topicRules, setTopicRules] = useState(DEFAULT_TOPIC_RULES);
  const [baseline, setBaseline] = useState(() =>
    JSON.stringify({
      intents: DEFAULT_INTENTS,
      topicRules: DEFAULT_TOPIC_RULES,
    }),
  );

  // Icons are functions, which JSON.stringify drops on both sides — so they
  // never register as a change.
  const current = JSON.stringify({ intents, topicRules });
  const isDirty = current !== baseline;

  const unusedTopics = TOPICS.filter(
    (topic) => !topicRules.some((rule) => rule.topic === topic.value),
  );

  const handleSave = () => {
    setBaseline(current);
    toast.success("Comment handling saved", {
      description: "The AI follows these rules on new comments from now on.",
    });
  };

  const addTopicRule = () => {
    const topic = unusedTopics[0];
    setTopicRules((rules) => [
      ...rules,
      {
        id: `topic-${topic.value}`,
        topic: topic.value,
        // A new exception starts with nothing and no autonomy — it should
        // not be able to act before anyone has configured it.
        actions: [],
        autonomy: "manual",
      },
    ]);
  };

  const patchTopicRule = (id: string, patch: Partial<TopicRule>) =>
    setTopicRules((rules) =>
      rules.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)),
    );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6">
        <Typography variant="small" as="h3" className="flex items-center gap-2">
          Actions per Intent
          <InfoIcon text={SECTION_INFO} />
        </Typography>

        {INTENT_GROUPS.map((group) => (
          <div key={group} className="flex flex-col gap-3">
            <Typography variant="caption" as="h4">
              {group}
            </Typography>
            {intents
              .filter((intent) => intent.group === group)
              .map((intent) => (
                <Card key={intent.id} size="sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <intent.icon className="size-4" />
                      {intent.label}
                      {/* The ⓘ carries the fuller description and real examples,
                    so the line below it can stay one short tagline. */}
                      <InfoIcon text={intent.info} />
                    </CardTitle>
                    <CardDescription>{intent.tagline}</CardDescription>
                    <CardAction>
                      <AutonomySelect
                        value={intent.autonomy}
                        label={`How far the AI goes on ${intent.label}`}
                        onChange={(autonomy) =>
                          setIntents((rules) =>
                            rules.map((item) =>
                              item.id === intent.id
                                ? { ...item, autonomy }
                                : item,
                            ),
                          )
                        }
                      />
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    {/* On Manual the AI does nothing, so there is nothing to
                  configure — the picker is not shown at all rather than
                  offering actions that would never run. */}
                    {intent.autonomy === "manual" ? (
                      <Typography variant="caption" as="p">
                        {MANUAL_NOTE}
                      </Typography>
                    ) : (
                      <>
                        <ActionPicker
                          actions={intent.actions}
                          onToggle={(id) =>
                            setIntents((rules) =>
                              rules.map((item) =>
                                item.id === intent.id
                                  ? {
                                      ...item,
                                      actions: toggleInList(item.actions, id),
                                    }
                                  : item,
                              ),
                            )
                          }
                        />
                        <Typography variant="caption" as="p">
                          {intent.hint}
                        </Typography>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
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
            <Card key={rule.id} size="sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconTags className="size-4" />
                  {TOPICS.find((topic) => topic.value === rule.topic)?.label}
                  <Badge variant="secondary">Overrides intent</Badge>
                </CardTitle>
                <CardDescription>
                  Used instead of the intent card whenever a comment is tagged
                  with this topic.
                </CardDescription>
                <CardAction>
                  <AutonomySelect
                    value={rule.autonomy}
                    label="How far the AI goes on this topic"
                    onChange={(autonomy) =>
                      patchTopicRule(rule.id, { autonomy })
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
                      patchTopicRule(rule.id, { topic })
                    }
                  >
                    <SelectTrigger size="sm" className="w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TOPICS.map((topic) => (
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
                    actions={rule.actions}
                    onToggle={(id) =>
                      patchTopicRule(rule.id, {
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
                        rules.filter((item) => item.id !== rule.id),
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
          disabled={!isDirty}
        >
          <IconDeviceFloppy data-icon="inline-start" />
          Save Changes
        </Button>
        {isDirty && (
          <Typography variant="caption">You have unsaved changes.</Typography>
        )}
      </div>
    </div>
  );
}
