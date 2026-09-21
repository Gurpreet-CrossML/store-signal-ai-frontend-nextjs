"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { IconDeviceFloppy } from "@tabler/icons-react";

import { STORE_PLATFORMS } from "@/lib/config";

import { ChipList } from "@/components/custom/chip-list";
import { LoadingState } from "@/components/custom/loading-state";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import {
  dedupeIps,
  describeIpProblem,
  IP_SPLIT_PATTERN,
  normalizeIp,
} from "@/lib/ip";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  FetchStoreAllowedIpsSettings,
  UpdateStoreAllowedIpsSettings,
} from "@/redux/api-slice/store-settings-slice";
import type { StoreListItem } from "@/redux/api-slice/stores-slice";

/**
 * Per-store allowed-IPs editor in a bottom drawer, opened from a row on
 * Settings → Stores.
 * The editing rules are the ones the old Store Settings screen enforced:
 * dedupe on the way in and out, IP-specific validation in the chip field.
 */
export function StoreAllowedIpsDrawer({
  store,
  onOpenChange,
  onSaved,
}: {
  /** The store being edited; null keeps the drawer closed. */
  store: StoreListItem | null;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}) {
  const dispatch = useAppDispatch();
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
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);

  const platform = STORE_PLATFORMS.find((p) => p.value === store?.platform);
  const storeCode = store?.code ?? "";
  useEffect(() => {
    if (storeCode) dispatch(FetchStoreAllowedIpsSettings(storeCode));
  }, [dispatch, storeCode]);

  // Seed the editor from the server once it arrives, per store — adjusted
  // during render, the endorsed alternative to setState-in-effect.
  const savedIps = dedupeIps(
    FetchStoreAllowedIpsSettingsData?.allowed_ips ?? [],
  );
  const [lastLoaded, setLastLoaded] = useState<string | null>(null);
  const loadedKey = `${storeCode}|${savedIps.join(",")}`;
  if (
    storeCode &&
    !FetchStoreAllowedIpsSettingsIsLoading &&
    lastLoaded !== loadedKey
  ) {
    setLastLoaded(loadedKey);
    setAllowedIps(savedIps);
  }

  const isDirty =
    allowedIps.length !== savedIps.length ||
    allowedIps.some((ip, index) => ip !== savedIps[index]);

  useEffect(() => {
    if (!isDirty) return;

    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = true;
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [isDirty]);

  const requestClose = () => {
    if (isDirty) {
      setDiscardDialogOpen(true);
      return;
    }
    onOpenChange(false);
  };

  const handleSave = async () => {
    if (!storeCode) return;
    const result = await dispatch(
      UpdateStoreAllowedIpsSettings({
        storeCode,
        allowedIps: dedupeIps(allowedIps),
      }),
    );
    if (UpdateStoreAllowedIpsSettings.fulfilled.match(result)) {
      onSaved?.();
      onOpenChange(false);
    }
  };

  return (
    <Drawer
      open={Boolean(store)}
      onOpenChange={(open) => {
        if (!open) requestClose();
      }}
    >
      <DrawerContent>
        <div className="mx-auto flex w-full max-w-lg flex-col overflow-y-auto">
          {/* Hand-rolled header: DrawerHeader centers itself in a bottom
              drawer, and this one reads top to bottom — store first, then
              what is being edited. */}
          <div className="flex flex-col gap-3 p-4 text-left">
            <div className="flex items-center gap-2">
              {platform && (
                <Image
                  src={platform.icon}
                  alt=""
                  width={20}
                  height={20}
                  className="size-5 object-contain"
                />
              )}
              <Typography variant="small">{store?.name}</Typography>
              <Typography variant="muted" className="font-mono text-xs">
                {store?.code}
              </Typography>
            </div>
            <div className="flex flex-col gap-1">
              <DrawerTitle>Allowed IPs</DrawerTitle>
              <DrawerDescription>
                Limit this store&apos;s chat widget to specific public IP
                addresses. Leave empty to show it to every visitor.
              </DrawerDescription>
            </div>
          </div>
          <div className="px-4">
            {FetchStoreAllowedIpsSettingsIsLoading ? (
              <LoadingState label="Loading allowed IPs…" />
            ) : (
              <ChipList
                items={allowedIps}
                placeholder="e.g. 203.0.113.42 — press Enter to add"
                onAdd={(values) => setAllowedIps([...allowedIps, ...values])}
                onRemove={(index) =>
                  setAllowedIps(allowedIps.filter((_, i) => i !== index))
                }
                disabled={UpdateStoreAllowedIpsSettingsIsLoading}
                validate={describeIpProblem}
                normalize={normalizeIp}
                splitPattern={IP_SPLIT_PATTERN}
                duplicateMessage={(ip) => `${ip} is already allowed.`}
                chipClassName="bg-muted font-mono text-foreground"
              />
            )}
          </div>
          <DrawerFooter className="flex-row justify-end">
            <Button variant="outline" onClick={requestClose}>
              Cancel
            </Button>
            <Button
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
          </DrawerFooter>
        </div>
      </DrawerContent>
      <AlertDialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Your changes to the allowed IPs have not been saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setDiscardDialogOpen(false);
                onOpenChange(false);
              }}
            >
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Drawer>
  );
}
