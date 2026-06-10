"use client";

import { useEffect, useRef, useState } from "react";
import {
    IconDeviceFloppy,
    IconExternalLink,
    IconPlus,
    IconShield,
    IconTrash,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    CreateStorePolicy,
    FetchStorePolicies,
    FetchStorePolicyType,
} from "@/redux/api-slice/knowledge-slice";

type DraftPolicy = {
    uid: string;
    type: string;
    url: string;
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    completed: "default",
    "in-progress": "secondary",
    pending: "outline",
    failed: "destructive",
};

function isValidUrl(value: string): boolean {
    try {
        const url = new URL(value.trim());
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

export default function StorePolicyTabContent() {
    const dispatch = useAppDispatch();
    const storeCode = useAppSelector(
        (state) => state.GetStoresReducer.selectedStore
    );

    const { FetchStorePoliciesListData, FetchStorePoliciesIsLoading } = useAppSelector(
        (state) => state.GetKnowledgeReducer.FetchStorePoliciesState
    );
    const { FetchStorePolicyTypeListData } = useAppSelector(
        (state) => state.GetKnowledgeReducer.FetchStorePolicyTypeState
    );
    const { CreateStorePolicyIsLoading } = useAppSelector(
        (state) => state.GetKnowledgeReducer.CreateStorePolicyState
    );

    const policies = FetchStorePoliciesListData ?? [];
    const policyTypes = FetchStorePolicyTypeListData ?? {};

    const [drafts, setDrafts] = useState<DraftPolicy[]>([]);
    const [error, setError] = useState<string | null>(null);
    const draftCounter = useRef(0);

    const loadPolicies = () => {
        if (!storeCode) return;
        dispatch(FetchStorePolicies({ store_code: storeCode }));
    };

    useEffect(() => {
        dispatch(FetchStorePolicyType());
    }, [dispatch]);

    const prevStoreRef = useRef(storeCode);
    useEffect(() => {
        if (prevStoreRef.current !== storeCode) setDrafts([]);
        prevStoreRef.current = storeCode;
        loadPolicies();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storeCode]);

    const usedTypes = (currentType: string) => {
        const fromSaved = policies.map((p) => p.link_type);
        const fromDrafts = drafts.map((d) => d.type).filter((t) => t && t !== currentType);
        return new Set([...fromSaved, ...fromDrafts]);
    };

    const availableTypes = (currentType: string) => {
        const used = usedTypes(currentType);
        return Object.entries(policyTypes).filter(([key]) => !used.has(key));
    };

    const addDraft = () => {
        draftCounter.current += 1;
        setDrafts((prev) => [...prev, { uid: `draft-${draftCounter.current}`, type: "", url: "" }]);
    };

    const updateDraft = (uid: string, field: "type" | "url", value: string) => {
        setError(null);
        setDrafts((prev) =>
            prev.map((draft) => (draft.uid === uid ? { ...draft, [field]: value } : draft))
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
        const allUrls = [...policies.map((p) => p.url), ...drafts.map((d) => d.url.trim())];
        if (new Set(allUrls).size !== allUrls.length) {
            setError("Duplicate policy URLs are not allowed.");
            return;
        }

        setError(null);
        const results = await Promise.all(
            drafts.map((draft) =>
                dispatch(
                    CreateStorePolicy({ store_code: storeCode, url: draft.url.trim(), type: draft.type })
                ).then((result) => ({
                    uid: draft.uid,
                    ok: CreateStorePolicy.fulfilled.match(result),
                }))
            )
        );

        const failed = new Set(results.filter((r) => !r.ok).map((r) => r.uid));
        setDrafts((prev) => prev.filter((draft) => failed.has(draft.uid)));
        loadPolicies();
    };

    return (
        <div className="flex w-full flex-col gap-4 py-4">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center bg-primary/10 text-primary">
                        <IconShield className="size-5" />
                    </div>
                    <div className="flex flex-col">
                        <h2 className="font-heading text-sm font-medium">Company Policies</h2>
                        <p className="text-xs text-muted-foreground">
                            Manage your business policies and terms.
                        </p>
                    </div>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={CreateStorePolicyIsLoading || drafts.length === 0 || !storeCode}
                >
                    {CreateStorePolicyIsLoading ? (
                        <>
                            <Spinner data-icon="inline-start" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <IconDeviceFloppy />
                            Save Policies
                        </>
                    )}
                </Button>
            </div>

            {error && (
                <div className="border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {error}
                </div>
            )}

            {FetchStorePoliciesIsLoading ? (
                <div className="flex items-center justify-center py-10 gap-2">
                    <Spinner className="size-6" />
                    Loading Policies...
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {policies.map((policy, index) => {
                        const variant = STATUS_VARIANT[policy.status] ?? "outline";
                        return (
                            <div
                                key={policy.id}
                                className="flex flex-col gap-3 border border-border/60 p-4"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium">Policy #{index + 1}</span>
                                    {policy.status && (
                                        <Badge variant={variant} className="font-normal capitalize">
                                            {policy.status}
                                        </Badge>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-muted-foreground">Policy Type</span>
                                        <span className="text-xs font-medium">
                                            {policyTypes[policy.link_type] ?? policy.link_type}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-muted-foreground">Policy URL</span>
                                        <a
                                            href={policy.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 truncate text-xs text-primary underline underline-offset-2"
                                        >
                                            <span className="truncate">{policy.url}</span>
                                            <IconExternalLink className="size-3.5 shrink-0" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {drafts.map((draft, index) => (
                        <div
                            key={draft.uid}
                            className="flex flex-col gap-3 border border-dashed border-border p-4"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium">
                                    New Policy #{policies.length + index + 1}
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => removeDraft(draft.uid)}
                                    aria-label="Remove policy"
                                >
                                    <IconTrash />
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-muted-foreground">Policy Type</span>
                                    <Select
                                        value={draft.type}
                                        onValueChange={(value) => updateDraft(draft.uid, "type", value)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select policy type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableTypes(draft.type).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-muted-foreground">Policy URL</span>
                                    <Input
                                        value={draft.url}
                                        onChange={(event) => updateDraft(draft.uid, "url", event.target.value)}
                                        placeholder="https://company.com/policy"
                                        autoComplete="off"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                    {policies.length === 0 && drafts.length === 0 && (
                        <div className="flex h-32 flex-col items-center justify-center border border-dashed border-border text-xs text-muted-foreground">
                            No policies added yet. Add a policy to get started.
                        </div>
                    )}

                    <Button
                        type="button"
                        variant="outline"
                        className="w-full border-dashed"
                        onClick={addDraft}
                        disabled={!storeCode}
                    >
                        <IconPlus />
                        Add New Policy
                    </Button>
                </div>
            )}
        </div>
    );
}
