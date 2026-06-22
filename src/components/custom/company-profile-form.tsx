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

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  FetchCompanyProfile,
  UpdateCompanyProfile,
} from "@/redux/api-slice/tenancy-slice";

const EDITABLE_FIELDS = [
  { name: "email", label: "Company Email", type: "email" },
  { name: "phone", label: "Phone", type: "text" },
  { name: "street", label: "Street", type: "text" },
  { name: "city", label: "City", type: "text" },
  { name: "state", label: "State", type: "text" },
  { name: "country", label: "Country", type: "text" },
] as const;

export default function CompanyProfileForm() {
  const dispatch = useAppDispatch();
  const { companyProfile, companyLoading, companySaving } = useAppSelector(
    (state) => state.GetTenancyReducer,
  );

  // Logo is staged and applied on Save: a new File to upload, or `removeLogo`
  // to clear the saved one.
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    dispatch(FetchCompanyProfile());
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
      city: companyProfile?.city ?? "",
      state: companyProfile?.state ?? "",
      country: companyProfile?.country ?? "",
    },
    onSubmit: async (values) => {
      const result = await dispatch(
        UpdateCompanyProfile({
          ...values,
          logo: logoFile ?? (removeLogo ? null : undefined),
        }),
      );
      if (UpdateCompanyProfile.fulfilled.match(result)) {
        setLogoFile(null);
        setRemoveLogo(false);
      }
    },
  });

  if (companyLoading && !companyProfile) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Profile</CardTitle>
        <CardDescription>
          Update your company&apos;s contact details and address. The company
          name and code are managed by the platform operator.
        </CardDescription>
      </CardHeader>
      <form onSubmit={formik.handleSubmit}>
        <CardContent>
          <FieldGroup>
            {/* Logo (top) */}
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

            {/* Read-only identity */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Company Name</FieldLabel>
                <Input value={companyProfile?.name ?? ""} disabled readOnly />
              </Field>
              <Field>
                <FieldLabel>Company Code</FieldLabel>
                <div className="flex items-center gap-2">
                  <Input
                    value={companyProfile?.schema_name ?? ""}
                    disabled
                    readOnly
                  />
                  {companyProfile && (
                    <Badge
                      variant={
                        companyProfile.is_active ? "default" : "destructive"
                      }
                    >
                      {companyProfile.is_active ? "Active" : "Inactive"}
                    </Badge>
                  )}
                </div>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
                </Field>
              ))}
            </div>
          </FieldGroup>
        </CardContent>
        <CardFooter className="mt-6">
          <Button
            type="submit"
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
        </CardFooter>
      </form>
    </Card>
  );
}
