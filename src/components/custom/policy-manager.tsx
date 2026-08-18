"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconDeviceFloppy,
  IconExternalLink,
  IconPlus,
  IconShieldCheck,
  IconTrash,
} from "@tabler/icons-react";

import { InfoIcon } from "@/components/custom/info-icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Typography } from "@/components/ui/typography";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/custom/loading-state";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  CreateKnowledgeItem,
  FetchKnowledgeItems,
  type AIScope,
  type PolicyType,
} from "@/redux/api-slice/knowledge-rag-slice";
import { AIScopeField } from "@/components/custom/knowledge/ai-scope-field";
import { KnowledgeStatusBadge } from "@/components/custom/knowledge/knowledge-badges";
import { POLICY_TYPE_OPTIONS } from "@/components/custom/knowledge/knowledge-meta";

type DraftPolicy = {
  uid: string;
  type: string;
  url: string;
};

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function PolicyManager() {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );

  const { FetchKnowledgeItemsListData, FetchKnowledgeItemsIsLoading } =
    useAppSelector(
      (state) => state.GetKnowledgeRagReducer.FetchKnowledgeItemsState,
    );
  const { CreateKnowledgeItemIsLoading } = useAppSelector(
    (state) => state.GetKnowledgeRagReducer.CreateKnowledgeItemState,
  );

  const policies = FetchKnowledgeItemsListData.results.filter(
    (entry) => entry.type === "general" && Boolean(entry.policyType),
  );

  const [drafts, setDrafts] = useState<DraftPolicy[]>([]);
  const [aiScope, setAiScope] = useState<AIScope[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [aiScopeError, setAiScopeError] = useState<string | undefined>();
  const draftCounter = useRef(0);

  const loadPolicies = () => {
    if (!storeCode) return;
    dispatch(FetchKnowledgeItems({ storeCode, pageSize: 100 }));
  };

  const prevStoreRef = useRef(storeCode);
  useEffect(() => {
    if (prevStoreRef.current !== storeCode) setDrafts([]);
    prevStoreRef.current = storeCode;
    loadPolicies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeCode]);

  const usedTypes = (currentType: string) => {
    const fromSaved = policies.map((p) => p.policyType ?? "");
    const fromDrafts = drafts
      .map((d) => d.type)
      .filter((t) => t && t !== currentType);
    return new Set([...fromSaved, ...fromDrafts]);
  };

  const availableTypes = (currentType: string) => {
    const used = usedTypes(currentType);
    return POLICY_TYPE_OPTIONS.filter((option) => !used.has(option.value));
  };

  const addDraft = () => {
    draftCounter.current += 1;
    setDrafts((prev) => [
      ...prev,
      { uid: `draft-${draftCounter.current}`, type: "", url: "" },
    ]);
  };

  const updateDraft = (uid: string, field: "type" | "url", value: string) => {
    setError(null);
    setDrafts((prev) =>
      prev.map((draft) =>
        draft.uid === uid ? { ...draft, [field]: value } : draft,
      ),
    );
  };

  const removeDraft = (uid: string) => {
    setDrafts((prev) => prev.filter((draft) => draft.uid !== uid));
  };

  const handleSave = async () => {
    if (drafts.length === 0) {
      setError("Add a policy before saving.");
      return;
    }
    if (drafts.some((d) => !d.type || !d.url.trim())) {
      setError("Please choose a type and enter a URL for every policy.");
      return;
    }
    if (drafts.some((d) => !isValidUrl(d.url))) {
      setError("One or more policy URLs are invalid.");
      return;
    }
    const allUrls = [
      ...policies.map((p) => p.url ?? ""),
      ...drafts.map((d) => d.url.trim()),
    ];
    if (new Set(allUrls).size !== allUrls.length) {
      setError("Duplicate policy URLs are not allowed.");
      return;
    }
    const scopeValid = aiScope.length > 0;
    setAiScopeError(scopeValid ? undefined : "Select at least one AI");
    if (!scopeValid) return;

    setError(null);
    const results = await Promise.all(
      drafts.map((draft) =>
        dispatch(
          CreateKnowledgeItem({
            storeCode,
            type: "general",
            source: "url",
            aiScope,
            url: draft.url.trim(),
            policyType: draft.type as PolicyType,
          }),
        ).then((result) => ({
          uid: draft.uid,
          ok: CreateKnowledgeItem.fulfilled.match(result),
        })),
      ),
    );

    const failed = new Set(results.filter((r) => !r.ok).map((r) => r.uid));
    setDrafts((prev) => prev.filter((draft) => failed.has(draft.uid)));
    loadPolicies();
  };

  return (
    <div className="flex w-full flex-col gap-6">
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      {FetchKnowledgeItemsIsLoading ? (
        <LoadingState label="Loading Policies…" />
      ) : (
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconShieldCheck className="size-4" />
              Linked Policies
              <InfoIcon text="Policy pages the AI can reference when customers ask about refunds, shipping, privacy, and similar topics." />
            </CardTitle>
            <CardDescription>
              Each policy links a page from your store.
            </CardDescription>
            <CardAction>
              <Badge variant="secondary">{policies.length}</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {policies.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Policy</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policies.map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell>
                        <Typography variant="small" as="span">
                          {POLICY_TYPE_OPTIONS.find(
                            (option) => option.value === policy.policyType,
                          )?.label ?? policy.policyType}
                        </Typography>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <a
                          href={policy.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 truncate text-sm text-primary underline underline-offset-2"
                        >
                          <span className="truncate">{policy.url}</span>
                          <IconExternalLink className="size-3.5 shrink-0" />
                        </a>
                      </TableCell>
                      <TableCell>
                        <KnowledgeStatusBadge status={policy.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              drafts.length === 0 && (
                <div className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
                  No policies linked yet. Add one so the AI can reference it.
                </div>
              )
            )}

            {drafts.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-[minmax(0,220px)_minmax(0,1fr)_auto] items-center gap-2">
                  <Typography
                    variant="muted"
                    as="span"
                    className="text-xs font-medium"
                  >
                    Policy Type
                  </Typography>
                  <Typography
                    variant="muted"
                    as="span"
                    className="text-xs font-medium"
                  >
                    Policy URL
                  </Typography>
                  <span aria-hidden className="w-8" />
                </div>
                {drafts.map((draft) => (
                  <div
                    key={draft.uid}
                    className="grid grid-cols-[minmax(0,220px)_minmax(0,1fr)_auto] items-center gap-2"
                  >
                    <Select
                      value={draft.type}
                      onValueChange={(value) =>
                        updateDraft(draft.uid, "type", value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select policy type" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTypes(draft.type).map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={draft.url}
                      onChange={(event) =>
                        updateDraft(draft.uid, "url", event.target.value)
                      }
                      placeholder="https://company.com/policy"
                      autoComplete="off"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeDraft(draft.uid)}
                      aria-label="Remove policy"
                    >
                      <IconTrash className="size-4" />
                    </Button>
                  </div>
                ))}

                <AIScopeField
                  value={aiScope}
                  onChange={(next) => {
                    setAiScope(next);
                    if (next.length > 0) setAiScopeError(undefined);
                  }}
                  error={aiScopeError}
                />
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={addDraft}
              disabled={!storeCode}
            >
              <IconPlus className="size-4" />
              Add Policy
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-start border-t border-border py-3">
        <Button
          size="lg"
          onClick={handleSave}
          disabled={
            CreateKnowledgeItemIsLoading || drafts.length === 0 || !storeCode
          }
        >
          {CreateKnowledgeItemIsLoading ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <IconDeviceFloppy data-icon="inline-start" />
          )}
          {CreateKnowledgeItemIsLoading ? "Saving..." : "Save Policies"}
        </Button>
      </div>
    </div>
  );
}
