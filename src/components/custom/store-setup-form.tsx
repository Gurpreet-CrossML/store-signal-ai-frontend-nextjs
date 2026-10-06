"use client";

import Image from "next/image";
import { useFormik } from "formik";
import { toast } from "sonner";
import z from "zod";
import {
  IconArrowRight,
  IconKey,
  IconLock,
  IconWorld,
} from "@tabler/icons-react";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { StartShopifyOauth } from "@/redux/api-slice/onboarding-slice";

import { STORE_PLATFORMS, type StorePlatform } from "@/lib/config";
import { applyServerFieldErrors, formikErrorsFromZod } from "@/lib/form-errors";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";

const validationSchema = z
  .object({
    platform: z.enum(["shopify", "magento"]),
    store_url: z.string().trim(),
    client_id: z.string().trim(),
    client_secret: z.string().trim(),
  })
  .superRefine((values, ctx) => {
    if (!/^https:\/\/[^\s/]+\.[^\s/]+/i.test(values.store_url)) {
      ctx.addIssue({
        code: "custom",
        path: ["store_url"],
        message: "Enter the full store URL, starting with https://",
      });
    }
    if (values.platform === "shopify") {
      for (const field of ["client_id", "client_secret"] as const) {
        if (!values[field]) {
          ctx.addIssue({ code: "custom", path: [field], message: "Required" });
        }
      }
    }
  });

type StoreSetupValues = z.infer<typeof validationSchema>;

export function StoreSetupForm({
  redirectToSetting = false,
}: {
  /** Pass true when the form is opened from Settings → Stores, so Shopify
   * returns the user there instead of the onboarding page. */
  redirectToSetting?: boolean;
}) {
  const dispatch = useAppDispatch();
  const { StartShopifyOauthIsLoading } = useAppSelector(
    (state) => state.GetOnboardingReducer.StartShopifyOauthState,
  );

  const formik = useFormik<StoreSetupValues>({
    initialValues: {
      platform: "shopify",
      store_url: "",
      client_id: "",
      client_secret: "",
    },
    validate: (values) => {
      const result = validationSchema.safeParse(values);
      if (result.success) return {};
      return formikErrorsFromZod(result.error.issues);
    },
    onSubmit: async (values) => {
      if (values.platform !== "shopify") {
        // TODO: Magento connect once the backend shares its contract.
        toast.info("Connecting Magento stores isn't available yet");
        return;
      }
      const result = await dispatch(
        StartShopifyOauth({
          storeUrl: values.store_url.trim(),
          clientId: values.client_id.trim(),
          clientSecret: values.client_secret.trim(),
          redirectToSetting,
        }),
      );
      if (StartShopifyOauth.fulfilled.match(result)) {
        // Full-page hop to Shopify's consent screen; it sends the browser
        // back here with the OAuth params and the drawer finishes the flow.
        window.location.assign(result.payload.authorize_url);
      } else {
        applyServerFieldErrors(formik, result.payload);
      }
    },
  });

  const isShopify = formik.values.platform === "shopify";
  const isConnecting = formik.isSubmitting || StartShopifyOauthIsLoading;
  const invalid = (field: keyof StoreSetupValues) =>
    formik.touched[field] && !!formik.errors[field];

  return (
    <form className="flex flex-col gap-6" onSubmit={formik.handleSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel>Platform</FieldLabel>
          <RadioGroup
            value={formik.values.platform}
            onValueChange={(value) =>
              formik.setFieldValue("platform", value as StorePlatform)
            }
            className="grid-cols-1 sm:grid-cols-2"
          >
            {STORE_PLATFORMS.map((platform) => (
              <FieldLabel
                key={platform.value}
                htmlFor={`platform-${platform.value}`}
                className="cursor-pointer"
              >
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle className="flex items-center gap-2">
                      <Image
                        src={platform.icon}
                        alt=""
                        width={24}
                        height={24}
                        className="size-6 object-contain"
                      />
                      {platform.label}
                    </FieldTitle>
                    <FieldDescription>{platform.description}</FieldDescription>
                  </FieldContent>
                  <RadioGroupItem
                    value={platform.value}
                    id={`platform-${platform.value}`}
                  />
                </Field>
              </FieldLabel>
            ))}
          </RadioGroup>
        </Field>
        <Field data-invalid={invalid("store_url")}>
          <FieldLabel htmlFor="store_url">Store URL</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <IconWorld />
            </InputGroupAddon>
            <InputGroupInput
              id="store_url"
              name="store_url"
              type="url"
              placeholder="https://www.your-store.com"
              autoComplete="off"
              aria-invalid={invalid("store_url")}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.store_url}
            />
          </InputGroup>
          {invalid("store_url") ? (
            <Typography variant="small" className="text-destructive">
              {formik.errors.store_url}
            </Typography>
          ) : (
            <FieldDescription>
              {isShopify
                ? "Your store's address, e.g. https://www.your-store.com, including https://."
                : "The full address of your Magento storefront, including https://."}
            </FieldDescription>
          )}
        </Field>
        {isShopify &&
          (
            [
              [
                "client_id",
                "Client ID",
                IconKey,
                "text",
                "e.g. 1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d",
              ],
              [
                "client_secret",
                "Client secret",
                IconLock,
                "password",
                "e.g. shpss_xxxxxxxxxxxxxxxx",
              ],
            ] as const
          ).map(([field, label, Icon, type, placeholder]) => (
            <Field key={field} data-invalid={invalid(field)}>
              <FieldLabel htmlFor={field}>{label}</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <Icon />
                </InputGroupAddon>
                <InputGroupInput
                  id={field}
                  name={field}
                  type={type}
                  placeholder={placeholder}
                  autoComplete="off"
                  aria-invalid={invalid(field)}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values[field]}
                />
              </InputGroup>
              {invalid(field) ? (
                <Typography variant="small" className="text-destructive">
                  {formik.errors[field]}
                </Typography>
              ) : (
                <FieldDescription>
                  From your StoreSignal Shopify app&apos;s settings.
                </FieldDescription>
              )}
            </Field>
          ))}
        <Field>
          <Button
            type="submit"
            size="lg"
            className="relative"
            disabled={isConnecting}
          >
            {isConnecting && <Spinner data-icon="inline-start" />}
            {isConnecting ? "Redirecting to Shopify..." : "Connect & Authorize"}
            {!isConnecting && <IconArrowRight className="absolute right-4" />}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
