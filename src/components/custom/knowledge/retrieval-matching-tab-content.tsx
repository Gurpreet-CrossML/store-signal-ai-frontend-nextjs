"use client";

import { useEffect, useState } from "react";
import { IconDeviceFloppy } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { LoadingState } from "@/components/custom/loading-state";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  FetchAIKnowledgeScope,
  FetchRetrievalSettings,
  SaveAIKnowledgeScope,
  SaveRetrievalSettings,
  type AIKnowledgeScopeConfig,
  type RagSettings,
} from "@/redux/api-slice/knowledge-rag-slice";
import { RetrievalSettingsCard } from "@/components/custom/knowledge/retrieval-settings-card";
import { GroundingSettingsCard } from "@/components/custom/knowledge/grounding-settings-card";

export default function RetrievalMatchingTabContent() {
  const dispatch = useAppDispatch();

  const { FetchRetrievalSettingsData, FetchRetrievalSettingsIsLoading } =
    useAppSelector(
      (state) => state.GetKnowledgeRagReducer.FetchRetrievalSettingsState,
    );
  const { FetchAIKnowledgeScopeData, FetchAIKnowledgeScopeIsLoading } =
    useAppSelector(
      (state) => state.GetKnowledgeRagReducer.FetchAIKnowledgeScopeState,
    );
  const { SaveRetrievalSettingsIsLoading } = useAppSelector(
    (state) => state.GetKnowledgeRagReducer.SaveRetrievalSettingsState,
  );
  const { SaveAIKnowledgeScopeIsLoading } = useAppSelector(
    (state) => state.GetKnowledgeRagReducer.SaveAIKnowledgeScopeState,
  );

  const [settings, setSettings] = useState<RagSettings | null>(null);
  const [scope, setScope] = useState<AIKnowledgeScopeConfig | null>(null);

  useEffect(() => {
    dispatch(FetchRetrievalSettings());
    dispatch(FetchAIKnowledgeScope());
  }, [dispatch]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- seeds the local editable draft once the fetch resolves; edits then live only here until Save
    if (FetchRetrievalSettingsData) setSettings(FetchRetrievalSettingsData);
  }, [FetchRetrievalSettingsData]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- seeds the local editable draft once the fetch resolves; edits then live only here until Save
    if (FetchAIKnowledgeScopeData) setScope(FetchAIKnowledgeScopeData);
  }, [FetchAIKnowledgeScopeData]);

  const isLoading =
    (FetchRetrievalSettingsIsLoading && !settings) ||
    (FetchAIKnowledgeScopeIsLoading && !scope);
  const isSaving =
    SaveRetrievalSettingsIsLoading || SaveAIKnowledgeScopeIsLoading;

  const handleSave = async () => {
    if (settings) await dispatch(SaveRetrievalSettings(settings));
    if (scope) await dispatch(SaveAIKnowledgeScope(scope));
  };

  if (isLoading || !settings || !scope) {
    return <LoadingState label="Loading retrieval settings…" />;
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <RetrievalSettingsCard
        value={settings.retrieval}
        onChange={(retrieval) => setSettings({ ...settings, retrieval })}
      />
      <GroundingSettingsCard
        value={settings.grounding}
        onChange={(grounding) => setSettings({ ...settings, grounding })}
      />

      <div className="flex justify-start border-t border-border py-3">
        <Button size="lg" onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <IconDeviceFloppy data-icon="inline-start" />
          )}
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
