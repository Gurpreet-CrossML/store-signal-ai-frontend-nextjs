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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { CreateStaff } from "@/redux/api-slice/tenancy-slice";

const validationSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required"),
  last_name: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Enter a valid email"),
});

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

  const formik = useFormik({
    initialValues: { first_name: "", last_name: "", email: "" },
    validate: (values) => {
      const result = validationSchema.safeParse(values);
      if (result.success) return {};
      return Object.fromEntries(
        result.error.issues.map((issue) => [
          issue.path.join("."),
          issue.message,
        ]),
      );
    },
    onSubmit: async (values) => {
      const result = await dispatch(CreateStaff(values));
      if (CreateStaff.fulfilled.match(result)) {
        onSaved();
        onOpenChange(false);
      }
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
            auto-generated and emailed to them. Store-level access is granted
            separately.
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
