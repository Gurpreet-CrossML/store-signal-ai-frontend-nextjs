"use client";

import { useEffect } from "react";
import { useFormik } from "formik";
import z from "zod";
import { IconUserPlus } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { formikErrorsFromZod, applyServerFieldErrors } from "@/lib/form-errors";
import { CreateStaff } from "@/redux/api-slice/tenancy-slice";
import { ASSIGNABLE_ROLES, ROLE_LABELS } from "@/lib/staff-roles";
import { InfoIcon } from "@/components/custom/info-icon";

const validationSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required"),
  last_name: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Enter a valid email"),
  // The select offers only valid roles, and the server checks it again.
  role: z.string().min(1, "Choose a role"),
});

type AssignableRole = (typeof ASSIGNABLE_ROLES)[number]["value"];

type StaffFormValues = {
  first_name: string;
  last_name: string;
  email: string;
  role: AssignableRole | "";
};

type StaffFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export default function StaffForm({
  open,
  onOpenChange,
  onSaved,
}: StaffFormProps) {
  const dispatch = useAppDispatch();
  const { staffSaving } = useAppSelector((state) => state.GetTenancyReducer);

  const formik = useFormik<StaffFormValues>({
    initialValues: { first_name: "", last_name: "", email: "", role: "" },
    validate: (values) => {
      const result = validationSchema.safeParse(values);
      if (result.success) return {};
      return formikErrorsFromZod(result.error.issues);
    },
    onSubmit: async (values) => {
      // `validate` has already rejected an empty role.
      const result = await dispatch(
        CreateStaff({
          ...values,
          role: values.role as AssignableRole,
        }),
      );
      if (CreateStaff.fulfilled.match(result)) {
        onSaved();
        onOpenChange(false);
        return;
      }
      // Keeps the sheet open on "that email already has an account", with
      // the message under the email field rather than in a toast that
      // disappears while they are still reading the form.
      applyServerFieldErrors(formik, result.payload);
    },
  });

  useEffect(() => {
    if (open) formik.resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Add Staff User</SheetTitle>
          <SheetDescription>
            Create a staff account for your company. A temporary password is
            auto-generated and emailed to them. Their role decides what they can
            do, in every store.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={formik.handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <FieldGroup className="flex-1 overflow-y-auto px-4">
            {(
              [
                { name: "first_name", label: "First Name", type: "text" },
                { name: "last_name", label: "Last Name", type: "text" },
                { name: "email", label: "Email", type: "email" },
              ] as const
            ).map((f) => (
              <Field key={f.name}>
                <FieldLabel htmlFor={f.name}>{f.label}</FieldLabel>
                <Input
                  id={f.name}
                  name={f.name}
                  type={f.type}
                  autoComplete="off"
                  aria-invalid={Boolean(
                    formik.touched[f.name] && formik.errors[f.name],
                  )}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values[f.name]}
                />
                {formik.touched[f.name] && formik.errors[f.name] && (
                  <p className="text-xs text-destructive">
                    {formik.errors[f.name]}
                  </p>
                )}
              </Field>
            ))}
            <Field>
              <div className="flex items-center gap-1.5">
                <FieldLabel htmlFor="role">Role</FieldLabel>
                <InfoIcon
                  text={
                    <ul className="flex max-w-xs flex-col gap-1">
                      {ASSIGNABLE_ROLES.map((role) => (
                        <li key={role.value}>
                          <span className="font-semibold">
                            {ROLE_LABELS[role.value]}:
                          </span>{" "}
                          {role.description}
                        </li>
                      ))}
                    </ul>
                  }
                />
              </div>
              <Select
                value={formik.values.role}
                onValueChange={(value) => {
                  formik.setFieldValue("role", value);
                  formik.setFieldTouched("role", true, false);
                }}
              >
                <SelectTrigger
                  id="role"
                  className="w-full"
                  aria-invalid={Boolean(
                    formik.touched.role && formik.errors.role,
                  )}
                >
                  <SelectValue placeholder="Choose a role" />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNABLE_ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {ROLE_LABELS[role.value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formik.values.role && (
                <p className="text-xs text-muted-foreground">
                  {
                    ASSIGNABLE_ROLES.find((r) => r.value === formik.values.role)
                      ?.description
                  }
                </p>
              )}
              {formik.touched.role && formik.errors.role && (
                <p className="text-xs text-destructive">{formik.errors.role}</p>
              )}
            </Field>
          </FieldGroup>

          <SheetFooter>
            <Button type="submit" disabled={staffSaving || !formik.dirty}>
              {staffSaving ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Creating...
                </>
              ) : (
                <>
                  <IconUserPlus />
                  Create Staff
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={staffSaving}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
