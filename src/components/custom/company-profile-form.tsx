"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFormik } from "formik";
import {
  IconDeviceFloppy,
  IconPencil,
  IconPhoto,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";

import { InfoIcon } from "@/components/custom/info-icon";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { LoadingState } from "@/components/custom/loading-state";
import { Spinner } from "@/components/ui/spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import z from "zod";
import { applyServerFieldErrors, formikErrorsFromZod } from "@/lib/form-errors";
import {
  FetchCompanyProfile,
  FetchCities,
  FetchCountries,
  FetchStates,
  UpdateCompanyProfile,
} from "@/redux/api-slice/tenancy-slice";

const EDITABLE_FIELDS = [
  { name: "email", label: "Company Email", type: "email" },
  { name: "phone", label: "Phone", type: "text" },
  { name: "street", label: "Street", type: "text" },
] as const;

const validationSchema = z.object({
  email: z
    .string()
    .min(1, "Company email is required.")
    .email("Enter a valid email address."),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[+\d()[\]\s\-]+$/.test(val),
      "Phone may only contain digits, spaces, +, -, (, ).",
    )
    .refine((val) => {
      if (!val) return true;

      const digitCount = val.replace(/\D/g, "").length;
      return digitCount >= 7 && digitCount <= 15;
    }, "Enter a valid phone number."),
  city: z.number().int().positive().nullable(),
  street: z.string().optional(),
  state: z.number().int().positive().nullable(),
  country: z.number().int().positive().nullable(),
});

export default function CompanyProfileForm({
  className,
}: {
  className?: string;
}) {
  const dispatch = useAppDispatch();
  const { companyProfile, companyLoading, companySaving } = useAppSelector(
    (state) => state.GetTenancyReducer,
  );
  const {
    FetchCountriesData: countries,
    FetchCountriesIsLoading: countriesLoading,
  } = useAppSelector((state) => state.GetTenancyReducer.FetchCountriesState);
  const { FetchStatesData: states, FetchStatesIsLoading: statesLoading } =
    useAppSelector((state) => state.GetTenancyReducer.FetchStatesState);
  const { FetchCitiesData: cities, FetchCitiesIsLoading: citiesLoading } =
    useAppSelector((state) => state.GetTenancyReducer.FetchCitiesState);

  // Logo is staged and applied on Save: a new File to upload, or `removeLogo`
  // to clear the saved one.
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    dispatch(FetchCompanyProfile());
    dispatch(FetchCountries());
  }, [dispatch]);

  // Object-URL preview for a newly-picked file. Created in render and revoked in
  // an effect cleanup (avoids calling setState inside an effect).
  const filePreview = useMemo(
    () => (logoFile ? URL.createObjectURL(logoFile) : null),
    [logoFile],
  );
  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  // What to display: new pick → its preview; removed → nothing; else saved logo.
  const shownLogo =
    filePreview ?? (removeLogo ? null : (companyProfile?.logo ?? null));
  const hasLogoChange =
    Boolean(logoFile) || Boolean(removeLogo && companyProfile?.logo);

  const openFilePicker = () => fileInputRef.current?.click();

  const onFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      setLogoFile(file);
      setRemoveLogo(false);
    }
    e.target.value = ""; // allow re-selecting the same file
  };

  const onRemoveLogo = () => {
    setLogoFile(null);
    setRemoveLogo(true);
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      email: companyProfile?.email ?? "",
      phone: companyProfile?.phone ?? "",
      street: companyProfile?.street ?? "",
      city: companyProfile?.city?.id ?? null,
      state: companyProfile?.state?.id ?? null,
      country: companyProfile?.country?.id ?? null,
    },
    validate: (values) => {
      const result = validationSchema.safeParse(values);
      if (result.success) return {};
      return formikErrorsFromZod(result.error.issues);
    },
    onSubmit: async (values) => {
      const parsedValues = validationSchema.parse(values);
      const result = await dispatch(
        UpdateCompanyProfile({
          ...parsedValues,
          logo: logoFile ?? (removeLogo ? null : undefined),
        }),
      );
      if (UpdateCompanyProfile.fulfilled.match(result)) {
        setLogoFile(null);
        setRemoveLogo(false);
      }
      if (UpdateCompanyProfile.rejected.match(result)) {
        applyServerFieldErrors(formik, result.payload);
      }
    },
  });

  // A selected country determines the states that can be selected.
  useEffect(() => {
    if (formik.values.country === null) return;

    dispatch(FetchStates(formik.values.country));
  }, [dispatch, formik.values.country]);

  // A selected state determines the cities that can be selected.
  useEffect(() => {
    if (formik.values.state === null) return;

    dispatch(FetchCities(formik.values.state));
  }, [dispatch, formik.values.state]);

  // Radix Select hands back strings, so convert to numbers once here.
  const handleCountryChange = (country: string) => {
    // A state or city from the previous country is no longer valid.
    formik.setValues({
      ...formik.values,
      country: Number(country),
      state: null,
      city: null,
    });
  };

  const handleStateChange = (state: string) => {
    // A city from the previous state is no longer valid.
    formik.setValues({ ...formik.values, state: Number(state), city: null });
  };

  const handleCityChange = (city: string) => {
    formik.setFieldValue("city", Number(city));
  };

  if (companyLoading && !companyProfile) {
    return <LoadingState />;
  }

  return (
    <div className={cn("w-full", className)}>
      <form onSubmit={formik.handleSubmit} className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Company Identity
              <InfoIcon text="The company name and code are set by the platform operator and can't be edited here. Contact them if either needs to change." />
            </CardTitle>
            <CardDescription>
              Your company&apos;s logo, name, and code.
            </CardDescription>
            {companyProfile && (
              <CardAction>
                <Badge
                  variant={companyProfile.is_active ? "default" : "destructive"}
                >
                  {companyProfile.is_active ? "Active" : "Inactive"}
                </Badge>
              </CardAction>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <Field>
              <FieldLabel>Logo</FieldLabel>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFilePicked}
              />
              <div>
                {shownLogo ? (
                  <div className="relative h-24 w-24">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={shownLogo}
                      alt="Company logo"
                      className="h-24 w-24 rounded-md border bg-muted object-contain p-1"
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          aria-label="Edit logo"
                          className="absolute -right-2 -top-2 size-7 rounded-full shadow"
                        >
                          <IconPencil className="size-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={onRemoveLogo}>
                          <IconTrash />
                          Remove logo
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={openFilePicker}>
                          <IconPhoto />
                          Upload image
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={openFilePicker}
                    aria-label="Upload logo"
                    className="flex h-24 w-24 items-center justify-center rounded-md border-2 border-dashed text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
                  >
                    <IconPlus className="size-6" />
                  </button>
                )}
                {logoFile && (
                  <p className="text-xs text-muted-foreground">
                    New logo selected: {logoFile.name}
                  </p>
                )}
                {removeLogo && companyProfile?.logo && (
                  <p className="text-xs text-muted-foreground">
                    Logo will be removed when you save.
                  </p>
                )}
              </div>
            </Field>

            {/* Read-only identity: plain text, not disabled inputs — these
                values are informational and cannot be edited here. */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Typography variant="muted" as="span">
                  Company Name
                </Typography>
                <Typography variant="small" as="span" className="text-base">
                  {companyProfile?.name || "—"}
                </Typography>
              </div>
              <div className="flex flex-col gap-1.5">
                <Typography variant="muted" as="span">
                  Company Code
                </Typography>
                <Typography
                  variant="small"
                  as="span"
                  className="font-mono text-base"
                >
                  {companyProfile?.schema_name || "—"}
                </Typography>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Contact &amp; Address
              <InfoIcon text="How your company can be reached, and its registered address." />
            </CardTitle>
            <CardDescription>
              Contact details and registered address.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {EDITABLE_FIELDS.map((f) => (
                <Field
                  key={f.name}
                  className={f.name === "street" ? "sm:col-span-2" : undefined}
                >
                  <FieldLabel htmlFor={f.name}>{f.label}</FieldLabel>
                  <Input
                    id={f.name}
                    name={f.name}
                    type={f.type}
                    autoComplete="off"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values[f.name]}
                  />
                  {formik.touched[f.name] && formik.errors[f.name] && (
                    <FieldError>{formik.errors[f.name]}</FieldError>
                  )}
                </Field>
              ))}
              <Field>
                <FieldLabel htmlFor="country">Country</FieldLabel>
                <Select
                  value={formik.values.country?.toString() ?? ""}
                  onValueChange={handleCountryChange}
                  disabled={countriesLoading || !countries.length}
                >
                  <SelectTrigger id="country" className="w-full">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.id} value={String(country.id)}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="state">State</FieldLabel>
                <Select
                  value={formik.values.state?.toString() ?? ""}
                  onValueChange={handleStateChange}
                  disabled={!formik.values.country || statesLoading}
                >
                  <SelectTrigger id="state" className="w-full">
                    <SelectValue
                      placeholder={
                        statesLoading ? "Loading states..." : "Select state"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((state) => (
                      <SelectItem key={state.id} value={String(state.id)}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="city">City</FieldLabel>
                <Select
                  value={formik.values.city?.toString() ?? ""}
                  onValueChange={handleCityChange}
                  disabled={!formik.values.state || citiesLoading}
                >
                  <SelectTrigger id="city" className="w-full">
                    <SelectValue
                      placeholder={
                        citiesLoading ? "Loading cities..." : "Select city"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={String(city.id)}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-start border-t border-border py-3">
          <Button
            type="submit"
            size="lg"
            disabled={companySaving || (!formik.dirty && !hasLogoChange)}
          >
            {companySaving ? (
              <>
                <Spinner data-icon="inline-start" />
                Saving...
              </>
            ) : (
              <>
                <IconDeviceFloppy />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}