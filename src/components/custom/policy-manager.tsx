"use client";

import { useEffect, useState } from "react";
import {
  IconDeviceFloppy,
  IconExternalLink,
  IconPlus,
  IconShieldCheck,
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
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
} from "@/redux/api-slice/knowledge-rag-slice";
import { AIScopeField } from "@/components/custom/knowledge/ai-scope-field";
import { KnowledgeStatusBadge } from "@/components/custom/knowledge/knowledge-badges";
import { POLICY_TYPE_OPTIONS } from "@/components/custom/knowledge/knowledge-meta";

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

  // The backend has no `policy_type` field, so the policy type is encoded as
  // the item's title (its label from POLICY_TYPE_OPTIONS) and read back the
  // same way.
  const policies = FetchKnowledgeItemsListData.results.filter(
    (entry) => entry.type === "general" && entry.source === "url",
  );
  const policyTypeLabel = (title: string) =>
    POLICY_TYPE_OPTIONS.find((option) => option.label === title)?.label ??
    title;

  const [isAdding, setIsAdding] = useState(false);
  const [type, setType] = useState("");
  const [url, setUrl] = useState("");
  const [aiScope, setAiScope] = useState<AIScope[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [aiScopeError, setAiScopeError] = useState<string | undefined>();

  const loadPolicies = () => {
    if (!storeCode) return;
    dispatch(FetchKnowledgeItems({ storeCode, pageSize: 100 }));
  };

  // Reset the form whenever the store changes — adjusted during render
  // against a sentinel, the endorsed alternative to setting state from an
  // effect (same pattern as the Threads screen's filter bar).
  const [prevStoreCode, setPrevStoreCode] = useState(storeCode);
  if (storeCode !== prevStoreCode) {
    setPrevStoreCode(storeCode);
    setIsAdding(false);
  }

  useEffect(() => {
    loadPolicies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeCode]);

  const usedTypes = new Set(
    policies.map(
      (p) =>
        POLICY_TYPE_OPTIONS.find((option) => option.label === p.title)?.value ??
        "",
    ),
  );
  const availableTypes = POLICY_TYPE_OPTIONS.filter(
    (option) => !usedTypes.has(option.value),
  );

  const resetForm = () => {
    setType("");
    setUrl("");
    setAiScope([]);
    setError(null);
    setAiScopeError(undefined);
  };

  const handleSave = async () => {
    if (!type || !url.trim()) {
      setError("Please choose a type and enter a URL.");
      return;
    }
    if (!isValidUrl(url)) {
      setError("Enter a valid policy URL.");
      return;
    }
    const existingUrls = policies.map((p) => p.url ?? "");
    if (existingUrls.includes(url.trim())) {
      setError("This policy URL has already been added.");
      return;
    }
    const scopeValid = aiScope.length > 0;
    setAiScopeError(scopeValid ? undefined : "Select at least one AI");
    if (!scopeValid) return;

    setError(null);
    const result = await dispatch(
      CreateKnowledgeItem({
        storeCode,
        type: "general",
        source: "url",
        aiScope,
        url: url.trim(),
        // `title` is required by the backend and doubles as the policy
        // type here, since there's no `policy_type` field on the model.
        title:
          POLICY_TYPE_OPTIONS.find((option) => option.value === type)?.label ??
          type,
      }),
    );

    if (!CreateKnowledgeItem.fulfilled.match(result)) {
      setError("This policy couldn't be saved. Please try again.");
      return;
    }
    resetForm();
    setIsAdding(false);
    loadPolicies();
  };

  return (
    <div className="flex w-full flex-col gap-6">
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
                          {policyTypeLabel(policy.title)}
                        </Typography>
                      </TableCell>
                      <TableCell className="max-w-md">
                        {policy.url ? (
                          <a
                            href={policy.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 truncate text-sm text-primary underline underline-offset-2"
                          >
                            <span className="truncate">{policy.url}</span>
                            <IconExternalLink className="size-3.5 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <KnowledgeStatusBadge status={policy.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              !isAdding && (
                <div className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
                  No policies linked yet. Add one so the AI can reference it.
                </div>
              )
            )}

            {isAdding && (
              <FieldGroup className="rounded-xl border border-border/60 p-3">
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Field>
                  <FieldLabel htmlFor="policy-manager-type">
                    Policy Type
                  </FieldLabel>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger id="policy-manager-type" className="w-full">
                      <SelectValue placeholder="Select policy type" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTypes.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="policy-manager-url">
                    Policy URL
                  </FieldLabel>
                  <Input
                    id="policy-manager-url"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder="https://company.com/policy"
                    autoComplete="off"
                  />
                </Field>

                <AIScopeField
                  value={aiScope}
                  onChange={(next) => {
                    setAiScope(next);
                    if (next.length > 0) setAiScopeError(undefined);
                  }}
                  error={aiScopeError}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      resetForm();
                      setIsAdding(false);
                    }}
                    disabled={CreateKnowledgeItemIsLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSave}
                    disabled={CreateKnowledgeItemIsLoading}
                  >
                    {CreateKnowledgeItemIsLoading ? (
                      <Spinner data-icon="inline-start" />
                    ) : (
                      <IconDeviceFloppy data-icon="inline-start" />
                    )}
                    {CreateKnowledgeItemIsLoading ? "Saving…" : "Save Policy"}
                  </Button>
                </div>
              </FieldGroup>
            )}

            {!isAdding && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => setIsAdding(true)}
                disabled={!storeCode}
              >
                <IconPlus className="size-4" />
                Add Policy
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
