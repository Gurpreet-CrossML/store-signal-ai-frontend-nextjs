"use client";

import { useEffect, useState } from "react";
import { IconDeviceFloppy } from "@tabler/icons-react";

import { InfoIcon } from "@/components/custom/info-icon";
import { LoadingState } from "@/components/custom/loading-state";
import { ChipList } from "@/components/custom/chip-list";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  FetchStoreAllowedIpsSettings,
  UpdateStoreAllowedIpsSettings,
} from "@/redux/api-slice/store-settings-slice";
import {
  dedupeIps,
  describeIpProblem,
  IP_SPLIT_PATTERN,
  normalizeIp,
} from "@/lib/ip";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

export default function SettingsStore() {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const {
    FetchStoreAllowedIpsSettingsData,
    FetchStoreAllowedIpsSettingsIsLoading,
  } = useAppSelector(
    (state) => state.GetStoreSettingsReducer.FetchStoreAllowedIpsSettingsState,
  );
  const { UpdateStoreAllowedIpsSettingsIsLoading } = useAppSelector(
    (state) => state.GetStoreSettingsReducer.UpdateStoreAllowedIpsSettingsState,
  );

  const [allowedIps, setAllowedIps] = useState<string[]>([]);

  useEffect(() => {
    if (storeCode) dispatch(FetchStoreAllowedIpsSettings(storeCode));
  }, [dispatch, storeCode]);

  // Seed the editor from the server once it arrives, and again whenever the
  // store changes — these settings are per store. Adjusted during render,
  // the endorsed alternative to setState-in-effect.
  // Deduped on the way in too: the field can't create repeats, but a list
  // saved before this guard existed still could.
  const savedIps = dedupeIps(
    FetchStoreAllowedIpsSettingsData?.allowed_ips ?? [],
  );
  const [lastLoaded, setLastLoaded] = useState<string | null>(null);
  const loadedKey = `${storeCode}|${savedIps.join(",")}`;
  if (!FetchStoreAllowedIpsSettingsIsLoading && lastLoaded !== loadedKey) {
    setLastLoaded(loadedKey);
    setAllowedIps(savedIps);
  }

  const isDirty =
    allowedIps.length !== savedIps.length ||
    allowedIps.some((ip, index) => ip !== savedIps[index]);

  const handleSave = () => {
    if (!storeCode) return;
    // Final guard before it leaves the browser.
    dispatch(
      UpdateStoreAllowedIpsSettings({
        storeCode,
        allowedIps: dedupeIps(allowedIps),
      }),
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Allowed IPs
            <InfoIcon text="Restricts who can see the chat widget on your storefront. Add the public IP addresses that should see it — everyone else gets no widget at all. Useful while testing before a public launch." />
          </CardTitle>
          <CardDescription>
            Limit the chat widget to specific public IP addresses. Leave empty
            to show it to every visitor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {FetchStoreAllowedIpsSettingsIsLoading ? (
            <LoadingState label="Loading settings…" />
          ) : (
            <ChipList
              items={allowedIps}
              placeholder="e.g. 203.0.113.42 — press Enter to add"
              onAdd={(values) => setAllowedIps([...allowedIps, ...values])}
              onRemove={(index) =>
                setAllowedIps(allowedIps.filter((_, i) => i !== index))
              }
              disabled={UpdateStoreAllowedIpsSettingsIsLoading}
              // The IP-specific rules the generic list doesn't know about.
              validate={describeIpProblem}
              normalize={normalizeIp}
              splitPattern={IP_SPLIT_PATTERN}
              duplicateMessage={(ip) => `${ip} is already allowed.`}
              chipClassName="bg-muted font-mono text-foreground"
            />
          )}
        </CardContent>
      </Card>

      <div className="flex justify-start border-t border-border py-3">
        <Button
          type="button"
          size="lg"
          onClick={handleSave}
          disabled={
            UpdateStoreAllowedIpsSettingsIsLoading ||
            FetchStoreAllowedIpsSettingsIsLoading ||
            !isDirty
          }
        >
          {UpdateStoreAllowedIpsSettingsIsLoading ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <IconDeviceFloppy data-icon="inline-start" />
          )}
          {UpdateStoreAllowedIpsSettingsIsLoading
            ? "Saving..."
            : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
