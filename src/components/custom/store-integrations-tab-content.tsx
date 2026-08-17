"use client";

import {
  ConnectStoreIntegration,
  DisconnectStoreIntegration,
  FetchIntegrations,
  FetchStoreIntegrations,
  type Integration,
  type IntegrationAttribute,
} from "@/redux/api-slice/integrations-slice";
import { IconPlugConnected } from "@tabler/icons-react";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { applyServerFieldErrors } from "@/lib/form-errors";
import { useEffect, useState } from "react";
import { useFormik } from "formik";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback } from "../ui/avatar";
import Image from "next/image";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Field, FieldLabel } from "../ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { LoadingState } from "@/components/custom/loading-state";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "../ui/spinner";

// Attributes vary per integration, so form values are keyed by attribute `code`.
type IntegrationFormValues = Record<string, string>;

// Build the initial Formik values from whatever attributes the integration
// defines — every attribute starts as an empty string.
function buildInitialValues(
  attributes: IntegrationAttribute[],
): IntegrationFormValues {
  return Object.fromEntries(attributes.map((attr) => [attr.code, ""]));
}

// Native <input type> to use for a text-like attribute.
function inputTypeFor(type: IntegrationAttribute["type"]): string {
  if (type === "password") return "password";
  if (type === "url") return "url";
  return "text";
}

export function IntegrationConnectionModal({
  children,
  integration,
  storeCode,
}: {
  children: React.ReactNode;
  integration: Integration;
  storeCode: string;
}) {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);

  const { ConnectStoreIntegrationIsLoading } = useAppSelector(
    (state) => state.GetIntegrationReducer.ConnectStoreIntegrationState,
  );

  // Attributes come back ordered from the API; sort defensively so the form
  // renders deterministically regardless of payload order.
  const attributes = [...integration.attributes].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );

  const formik = useFormik<IntegrationFormValues>({
    enableReinitialize: true,
    initialValues: buildInitialValues(attributes),
    validate: (values) => {
      const errors: Record<string, string> = {};
      for (const attr of attributes) {
        if (attr.is_required && !values[attr.code]?.trim()) {
          errors[attr.code] = `${attr.display_name} is required`;
        }
      }
      return errors;
    },
    onSubmit: async (values) => {
      // Shape the dynamic values into the backend payload:
      //   { store_code, integration, attribute: [{ key, value }, ...] }
      const attribute = attributes.map((attr) => ({
        key: attr.code,
        value: values[attr.code]?.trim() ?? "",
      }));

      const result = await dispatch(
        ConnectStoreIntegration({
          store_code: storeCode,
          integration: integration.id,
          attribute,
        }),
      );

      if (ConnectStoreIntegration.fulfilled.match(result)) {
        // Refresh the connected list so the card flips to "active".
        dispatch(FetchStoreIntegrations(storeCode));
        setOpen(false);
        return;
      }
      // Credentials are only ever wrong according to the server, so its
      // verdict has to land on the field it rejected — the dialog stays
      // open with the message under that input.
      applyServerFieldErrors(formik, result.payload);
    },
  });

  // Reset the form whenever the dialog (re)opens so stale input never lingers.
  useEffect(() => {
    if (open) formik.resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, integration.id]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-106.25 w-1/2! lg:max-w-1/2!">
        <DialogHeader>
          <DialogTitle>Connect to {integration.name}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={formik.handleSubmit}
          className="flex flex-col justify-center items-start gap-4"
        >
          {integration.steps_for_creds && (
            <div className="border p-2 bg-primary/5 w-full">
              <div
                className="editor-container__editor flex flex-col gap-2"
                dangerouslySetInnerHTML={{
                  __html: integration.steps_for_creds,
                }}
              />
            </div>
          )}

          <div className="flex flex-col justify-center items-start w-full gap-4">
            {attributes.map((attribute) => {
              const error =
                formik.touched[attribute.code] && formik.errors[attribute.code];

              return (
                <Field key={attribute.code} className="gap-1 w-full">
                  <FieldLabel htmlFor={attribute.code}>
                    {attribute.display_name}
                  </FieldLabel>

                  {attribute.type === "select" ? (
                    <Select
                      value={formik.values[attribute.code] ?? ""}
                      onValueChange={(value) => {
                        formik.setFieldValue(attribute.code, value);
                        formik.setFieldTouched(attribute.code, true, false);
                      }}
                    >
                      <SelectTrigger
                        id={attribute.code}
                        className="w-full"
                        aria-invalid={Boolean(error)}
                      >
                        <SelectValue placeholder={attribute.display_name} />
                      </SelectTrigger>
                      <SelectContent>
                        {(attribute.options ?? []).map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={attribute.code}
                      name={attribute.code}
                      type={inputTypeFor(attribute.type)}
                      placeholder={
                        attribute.placeholder ?? attribute.display_name
                      }
                      autoComplete="off"
                      aria-invalid={Boolean(error)}
                      value={formik.values[attribute.code] ?? ""}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                  )}

                  {error && (
                    <p className="text-xs text-destructive">
                      {formik.errors[attribute.code]}
                    </p>
                  )}
                </Field>
              );
            })}
          </div>

          <DialogFooter className="w-full">
            <Button
              type="submit"
              disabled={ConnectStoreIntegrationIsLoading || !storeCode}
            >
              {ConnectStoreIntegrationIsLoading ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={ConnectStoreIntegrationIsLoading}
              >
                Cancel
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DisconnectConfirmDialog({
  children,
  integration,
  storeIntegrationId,
  storeCode,
}: {
  children: React.ReactNode;
  integration: Integration;
  storeIntegrationId: number;
  storeCode: string;
}) {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);

  const { DisconnectStoreIntegrationIsLoading } = useAppSelector(
    (state) => state.GetIntegrationReducer.DisconnectStoreIntegrationState,
  );

  const handleDisconnect = async () => {
    const result = await dispatch(
      DisconnectStoreIntegration({
        store_code: storeCode,
        id: storeIntegrationId,
      }),
    );

    if (DisconnectStoreIntegration.fulfilled.match(result)) {
      // Refresh the connected list so the card flips back to "inactive".
      dispatch(FetchStoreIntegrations(storeCode));
      setOpen(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Disconnect {integration.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Disconnecting will remove this integration&apos;s saved connection
            and credentials for this store. This may affect some workflows in
            your Store Signal chatbot that rely on it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={DisconnectStoreIntegrationIsLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            // Keep the dialog open while the request is in flight; we
            // close it manually on success.
            onClick={(e) => {
              e.preventDefault();
              handleDisconnect();
            }}
            disabled={DisconnectStoreIntegrationIsLoading}
          >
            {DisconnectStoreIntegrationIsLoading ? (
              <>
                <Spinner data-icon="inline-start" />
                Disconnecting...
              </>
            ) : (
              "Disconnect"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function IntegrationCard({
  integration,
  storeCode,
  storeIntegrationId,
}: {
  integration: Integration;
  storeCode: string;
  // The StoreIntegration object id when connected; undefined when not.
  storeIntegrationId?: number;
}) {
  const isConnected = storeIntegrationId != null;
  const toggle = (
    <Switch
      id={`connection-${integration.id}`}
      checked={isConnected}
      disabled={!storeCode}
    />
  );

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between gap-2">
          {integration.logo ? (
            <Image
              src={integration.logo}
              alt={integration.name}
              width={45}
              height={45}
              className="size-8"
            />
          ) : (
            <Avatar size="lg">
              <AvatarFallback>{integration.name.charAt(0)}</AvatarFallback>
            </Avatar>
          )}
          {storeIntegrationId != null ? (
            <DisconnectConfirmDialog
              integration={integration}
              storeIntegrationId={storeIntegrationId}
              storeCode={storeCode}
            >
              {toggle}
            </DisconnectConfirmDialog>
          ) : (
            <IntegrationConnectionModal
              integration={integration}
              storeCode={storeCode}
            >
              {toggle}
            </IntegrationConnectionModal>
          )}
        </div>

        <CardTitle className="flex items-center justify-between gap-2">
          {integration.name}
          <Badge>{integration.category.name}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p>{integration.description}</p>
      </CardContent>
    </Card>
  );
}

export default function StoreIntegrationsTabContent() {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );

  const { FetchIntegrationsListData, FetchIntegrationsIsLoading } =
    useAppSelector(
      (state) => state.GetIntegrationReducer.FetchIntegrationsState,
    );

  const { FetchStoreIntegrationsListData, FetchStoreIntegrationsIsLoading } =
    useAppSelector(
      (state) => state.GetIntegrationReducer.FetchStoreIntegrationsState,
    );

  useEffect(() => {
    if (storeCode) {
      dispatch(FetchIntegrations());
      dispatch(FetchStoreIntegrations(storeCode));
    }
  }, [storeCode, dispatch]);

  if (FetchIntegrationsIsLoading || FetchStoreIntegrationsIsLoading) {
    return <LoadingState className="w-full" />;
  }

  // A store with nothing to connect rendered an empty grid, which reads as
  // a screen that failed to load rather than one with nothing in it.
  if (FetchIntegrationsListData.length === 0) {
    return (
      <Empty className="w-full">
        <EmptyHeader>
          <EmptyMedia>
            <IconPlugConnected />
          </EmptyMedia>
          <EmptyTitle>No Integrations Available</EmptyTitle>
          <EmptyDescription>
            There is nothing to connect to this store yet. New platforms appear
            here as they are added.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {FetchIntegrationsListData.map((integration) => (
        <IntegrationCard
          key={integration.id}
          integration={integration}
          storeCode={storeCode}
          // The connected record's own id (StoreIntegration pk),
          // used to disconnect; undefined when not connected.
          storeIntegrationId={
            FetchStoreIntegrationsListData.find(
              (connectedIntegration) =>
                connectedIntegration.integration === integration.id,
            )?.id
          }
        />
      ))}
    </div>
  );
}
