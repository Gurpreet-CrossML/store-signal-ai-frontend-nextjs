"use client";

import { useEffect, useMemo, useState } from "react";
import { IconUserPlus } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  FetchStaff,
  ResetStaffPassword,
  SetStaffActive,
  type StaffMember,
} from "@/redux/api-slice/tenancy-slice";
import StaffForm from "@/components/custom/staff-form";
import StaffStoreAccess from "@/components/custom/staff-store-access";
import { StaffDataTable } from "@/components/custom/staff-data-table";
import { getStaffColumns } from "@/components/custom/staff-columns";

export default function StaffManagement() {
  const dispatch = useAppDispatch();
  const { staff, staffLoading } = useAppSelector(
    (state) => state.GetTenancyReducer,
  );

  const [formOpen, setFormOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<StaffMember | null>(null);
  const [toggleTarget, setToggleTarget] = useState<StaffMember | null>(null);
  const [accessTarget, setAccessTarget] = useState<StaffMember | null>(null);

  useEffect(() => {
    dispatch(FetchStaff());
  }, [dispatch]);

  const columns = useMemo(
    () =>
      getStaffColumns({
        onStoreAccess: setAccessTarget,
        onResetPassword: setResetTarget,
        onToggleActive: setToggleTarget,
      }),
    [],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff</CardTitle>
        <CardDescription>
          Manage your company&apos;s users. New staff receive an emailed
          temporary password.
        </CardDescription>
        <CardAction>
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <IconUserPlus />
            Add Staff
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <StaffDataTable
          columns={columns}
          data={staff}
          isLoading={staffLoading}
        />
      </CardContent>

      <StaffForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={() => dispatch(FetchStaff())}
      />

      <StaffStoreAccess
        open={Boolean(accessTarget)}
        onOpenChange={(o) => !o && setAccessTarget(null)}
        staff={accessTarget}
      />

      {/* Reset-password confirmation */}
      <AlertDialog
        open={Boolean(resetTarget)}
        onOpenChange={(o) => !o && setResetTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset password?</AlertDialogTitle>
            <AlertDialogDescription>
              A new temporary password will be generated and emailed to{" "}
              {resetTarget?.email}. Their current password will stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (resetTarget)
                  dispatch(
                    ResetStaffPassword({
                      id: resetTarget.id,
                      email: resetTarget.email,
                    }),
                  );
                setResetTarget(null);
              }}
            >
              Reset &amp; email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Activate / deactivate confirmation */}
      <AlertDialog
        open={Boolean(toggleTarget)}
        onOpenChange={(o) => !o && setToggleTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleTarget?.is_active ? "Deactivate" : "Activate"} staff user?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleTarget?.is_active
                ? `${toggleTarget?.email} will no longer be able to sign in.`
                : `${toggleTarget?.email} will be able to sign in again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (toggleTarget)
                  dispatch(
                    SetStaffActive({
                      id: toggleTarget.id,
                      is_active: !toggleTarget.is_active,
                    }),
                  );
                setToggleTarget(null);
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
