"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFormik } from "formik";
import {
  IconDeviceFloppy,
  IconInfoCircle,
  IconLock,
  IconPhotoPlus,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { LoadingState } from "@/components/custom/loading-state";
import { LocationSelect } from "@/components/custom/location-select";
import { UnsavedChangesDialog } from "@/components/custom/unsaved-changes-dialog";
import { Spinner } from "@/components/ui/spinner";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { companyProfileSchema } from "@/lib/company-profile-schema";
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
] as const;

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
    FetchCountriesIsLoading: countriesFetching,
    FetchCountriesIsSuccess: countriesLoaded,
    FetchCountriesIsError: countriesFailed,
  } = useAppSelector((state) => state.GetTenancyReducer.FetchCountriesState);
  const {
    FetchStatesData: states,
    FetchStatesIsLoading: statesFetching,
    FetchStatesIsSuccess: statesLoaded,
    FetchStatesIsError: statesFailed,
  } = useAppSelector((state) => state.GetTenancyReducer.FetchStatesState);
  const {
    FetchCitiesData: cities,
    FetchCitiesIsLoading: citiesFetching,
    FetchCitiesIsSuccess: citiesLoaded,
    FetchCitiesIsError: citiesFailed,
  } = useAppSelector((state) => state.GetTenancyReducer.FetchCitiesState);

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
      city: companyProfile?.city ?? null,
      state: companyProfile?.state ?? null,
      country: companyProfile?.country ?? null,
    },
    validate: (values) => {
      const result = companyProfileSchema.safeParse(values);
      if (result.success) return {};
      return formikErrorsFromZod(result.error.issues);
    },
    onSubmit: async (values) => {
      const parsedValues = companyProfileSchema.parse(values);
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
      return UpdateCompanyProfile.fulfilled.match(result);
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

  // Loading until a fetch has finished (not just while it is in flight), so the
  // first render, before the effects dispatch, doesn't flash an empty select.
  // A state or city list is only needed once its parent is chosen.
  const countriesLoading =
    countriesFetching || (!countriesLoaded && !countriesFailed);
  const statesLoading =
    formik.values.country !== null &&
    (statesFetching || (!statesLoaded && !statesFailed));
  const citiesLoading =
    formik.values.state !== null &&
    (citiesFetching || (!citiesLoaded && !citiesFailed));

  if (companyLoading && !companyProfile) {
    return <LoadingState />;
  }

  const hasChanges = formik.dirty || hasLogoChange;

  return (
    <div className={cn("flex w-full flex-1 flex-col", className)}>
      <form
        onSubmit={formik.handleSubmit}
        className="flex flex-1 flex-col gap-6"
      >
        <div className="flex flex-col gap-6">
          <div className="grid gap-x-4 gap-y-6 sm:grid-cols-2">
            {/* Set by the platform operator, so shown locked. */}
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="company-name">Company Name</FieldLabel>
              <div className="relative">
                <Input
                  id="company-name"
                  value={companyProfile?.name ?? ""}
                  readOnly
                  aria-readonly
                  className="bg-muted pr-9 text-muted-foreground"
                />
                <IconLock className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </Field>
            {EDITABLE_FIELDS.map((f) => (
              <Field key={f.name}>
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
          </div>

          <Field>
            <FieldLabel htmlFor="street">Street</FieldLabel>
            <Input
              id="street"
              name="street"
              type="text"
              autoComplete="off"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.street}
            />
            {formik.touched.street && formik.errors.street && (
              <FieldError>{formik.errors.street}</FieldError>
            )}
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <LocationSelect
              id="country"
              label="Country"
              value={formik.values.country}
              options={countries}
              onChange={handleCountryChange}
              loading={countriesLoading}
              disabled={!countries.length}
              placeholder="Select country"
              loadingPlaceholder="Loading countries..."
              error={formik.touched.country ? formik.errors.country : undefined}
            />
            <LocationSelect
              id="state"
              label="State"
              value={formik.values.state}
              options={states}
              onChange={handleStateChange}
              loading={statesLoading}
              disabled={!formik.values.country}
              placeholder="Select state"
              loadingPlaceholder="Loading states..."
              error={formik.touched.state ? formik.errors.state : undefined}
            />
            <LocationSelect
              id="city"
              label="City"
              value={formik.values.city}
              options={cities}
              onChange={handleCityChange}
              loading={citiesLoading}
              disabled={!formik.values.state}
              placeholder="Select city"
              loadingPlaceholder="Loading cities..."
              error={formik.touched.city ? formik.errors.city : undefined}
            />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFilePicked}
          />
          {/* The logo: a dashed square until one is picked, then its
              preview, with the actions beside it. */}
          <div className="flex items-center gap-4">
            {shownLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shownLogo}
                alt="Company logo"
                className="size-16 shrink-0 rounded-lg border bg-muted object-contain p-1"
              />
            ) : (
              <button
                type="button"
                onClick={openFilePicker}
                aria-label="Upload logo"
                className="flex size-16 shrink-0 items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
              >
                <IconPhotoPlus className="size-5" />
              </button>
            )}
            <div className="flex min-w-0 flex-col gap-1.5">
              <div>
                <p className="text-sm font-medium">Logo</p>
                <p className="text-xs text-muted-foreground">
                  {logoFile
                    ? `New logo selected: ${logoFile.name}`
                    : removeLogo && companyProfile?.logo
                      ? "Logo will be removed when you save."
                      : "PNG, JPG or SVG. Shown in the app and emails."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openFilePicker}
                >
                  <IconUpload />
                  {shownLogo ? "Change Logo" : "Upload Logo"}
                </Button>
                {shownLogo && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={onRemoveLogo}
                  >
                    <IconTrash />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Save bar: whether anything is waiting, and the button. Pinned to
            the bottom of the page, like the Knowledge add pages. */}
        <div className="sticky bottom-0 z-10 -mx-4 mt-auto -mb-4 flex items-center justify-between gap-3 border-t border-border bg-background px-4 py-3">
          <p className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
            {hasChanges && (
              <>
                <span className="size-2 rounded-full bg-amber-500" />
                Unsaved changes
              </>
            )}
          </p>
          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={companySaving || !hasChanges}
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

      <UnsavedChangesDialog
        isDirty={hasChanges}
        isSaving={companySaving}
        onSave={async () => (await formik.submitForm()) === true}
      />
    </div>
  );
}
