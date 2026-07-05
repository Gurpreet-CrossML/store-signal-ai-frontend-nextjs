"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { GetStores } from "@/redux/api-slice/stores-slice";
import {
  connectStoreIntegration,
  deleteStoreIntegration,
  fetchIntegrationsCatalog,
  fetchStoreIntegrations,
  fetchStoreIntegrationDetail,
  testStoreIntegrationConnection,
  setEnabledId,
} from "@/redux/api-slice/integrations-slice";
import type {
  Integration,
  IntegrationAttribute,
} from "@/lib/integration-types";
import { IntegrationCard } from "@/components/custom/integration-card";
import {
  IntegrationDialog,
  StepId,
} from "@/components/custom/integration-dialog";

export default function StoreIntegrationsTabContent() {
  const dispatch = useAppDispatch();
  const selectedStoreCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const storeList = useAppSelector(
    (state) => state.GetStoresReducer.GetStoresState.GetStoresListData,
  );

  const store =
    storeList.find((item) => item.code === selectedStoreCode) ?? null;
  const storeId = store ? Number(store.id) : null;

  const integrationsState = useAppSelector(
    (state) => state.GetIntegrationsReducer.IntegrationsState,
  );
  const { catalog, enabledIds, savedIds, storeIntegrationIds } = {
    catalog: integrationsState.catalog,
    enabledIds: integrationsState.enabledIds,
    savedIds: integrationsState.savedIds,
    storeIntegrationIds: integrationsState.storeIntegrationIds,
  };

  const [selectedIntegration, setSelectedIntegration] =
    useState<Integration | null>(null);
  const [step, setStep] = useState<StepId>(0);
  const [attributes, setAttributes] = useState<IntegrationAttribute[]>([]);
  const [attributeValues, setAttributeValues] = useState<
    Record<string, string>
  >({});
  const [testState, setTestState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const prefillRequestRef = useRef(0);

  useEffect(() => {
    if (!storeList.length) {
      dispatch(GetStores({}));
    }
  }, [dispatch, storeList.length]);

  useEffect(() => {
    dispatch(fetchIntegrationsCatalog());
  }, [dispatch]);

  useEffect(() => {
    if (storeId != null) {
      dispatch(fetchStoreIntegrations(storeId));
    }
  }, [dispatch, storeId]);

  const closePanel = (keepEnabled: boolean) => {
    prefillRequestRef.current += 1;

    if (
      selectedIntegration &&
      !keepEnabled &&
      !savedIds[selectedIntegration.id]
    ) {
      dispatch(setEnabledId({ id: selectedIntegration.id, enabled: false }));
    }

    setSelectedIntegration(null);
    setStep(0);
    setAttributes([]);
    setAttributeValues({});
    setTestState("idle");
    setTestMessage(null);
    setSaving(false);
  };

  const openPanel = (integration: Integration) => {
    if (selectedIntegration && selectedIntegration.id !== integration.id) {
      const previousId = selectedIntegration.id;
      if (!savedIds[previousId]) {
        dispatch(setEnabledId({ id: previousId, enabled: false }));
      }
    }

    dispatch(setEnabledId({ id: integration.id, enabled: true }));

    prefillRequestRef.current += 1;
    const requestId = prefillRequestRef.current;

    setSelectedIntegration(integration);
    setStep(0);
    setAttributes(integration.attributes ?? []);
    setAttributeValues({});
    setTestState("idle");
    setTestMessage(null);
    setSaving(false);

    if (
      savedIds[integration.id] &&
      storeIntegrationIds[integration.id] &&
      storeId != null
    ) {
      dispatch(
        fetchStoreIntegrationDetail({
          storeId,
          storeIntegrationRowId: storeIntegrationIds[integration.id],
        }),
      )
        .unwrap()
        .then((data) => {
          if (prefillRequestRef.current !== requestId) return;

          const prefilled: Record<string, string> = {};
          for (const attr of data.stored_attributes ?? []) {
            prefilled[attr.code] = attr.value;
          }
          setAttributeValues(prefilled);
        })
        .catch(() => {});
    }
  };

  const handleToggle = async (integration: Integration, checked: boolean) => {
    if (checked) {
      openPanel(integration);
      return;
    }

    if (savedIds[integration.id]) {
      const storeIntegrationId = storeIntegrationIds[integration.id];
      if (storeId == null || storeIntegrationId == null) return;

      dispatch(
        deleteStoreIntegration({ storeId, integrationId: integration.id }),
      );
      return;
    }

    if (selectedIntegration?.id === integration.id) {
      closePanel(false);
      return;
    }

    dispatch(setEnabledId({ id: integration.id, enabled: false }));
  };

  const handleTestConnection = async () => {
    if (!selectedIntegration || storeId == null) return;

    setTestState("loading");
    setTestMessage(null);

    try {
      const response = await dispatch(
        testStoreIntegrationConnection({
          storeId,
          integrationId: selectedIntegration.id,
          attributeValues,
        }),
      ).unwrap();

      const message =
        (response as { message?: string; detail?: string })?.message ||
        (response as { message?: string; detail?: string })?.detail ||
        "Connection verified successfully.";
      setTestState("success");
      setTestMessage(message);
    } catch (error) {
      setTestState("error");
      const responseMessage =
        (error as { message?: string; detail?: string; error?: string }) ||
        undefined;
      setTestMessage(
        responseMessage?.message ||
          responseMessage?.detail ||
          responseMessage?.error ||
          (error instanceof Error ? error.message : "") ||
          "Something went wrong.",
      );
    }
  };

  const handleSave = async () => {
    if (!selectedIntegration || storeId == null) return;
    if (testState !== "success") return;

    setSaving(true);

    try {
      await dispatch(
        connectStoreIntegration({
          storeId,
          integrationId: selectedIntegration.id,
          attributeValues,
        }),
      ).unwrap();

      closePanel(true);
    } catch {
      // toast is handled in the thunk
    } finally {
      setSaving(false);
    }
  };

  const currentSaved = selectedIntegration
    ? Boolean(savedIds[selectedIntegration.id])
    : false;

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-heading text-xl font-medium">Integrations</h2>
          <p className="text-sm text-muted-foreground">
            Browse available integrations and enable one to configure it.
          </p>
        </div>
        {store ? (
          <Badge variant="outline" className="shrink-0">
            {store.name}
          </Badge>
        ) : (
          <Badge variant="outline" className="shrink-0">
            Select a store
          </Badge>
        )}
      </div>

      {!store && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          Pick a store from the sidebar before you test or save an integration.
        </div>
      )}

      {integrationsState.catalogIsLoading ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
          Loading integrations...
        </div>
      ) : catalog.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
          No integrations were returned by the backend yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {catalog.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              checked={Boolean(enabledIds[integration.id])}
              saved={Boolean(savedIds[integration.id])}
              onToggle={(checked) => void handleToggle(integration, checked)}
              onOpenPanel={() => openPanel(integration)}
            />
          ))}
        </div>
      )}

      <IntegrationDialog
        integration={selectedIntegration}
        step={step}
        attributes={attributes}
        attributeValues={attributeValues}
        testState={testState}
        testMessage={testMessage}
        saving={saving}
        storeId={storeId}
        storeName={store?.name ?? null}
        currentSaved={currentSaved}
        onClose={closePanel}
        onSetStep={setStep}
        onSetAttributeValues={setAttributeValues}
        onSetTestState={setTestState}
        onSetTestMessage={setTestMessage}
        onTestConnection={handleTestConnection}
        onSave={handleSave}
      />
    </div>
  );
}
