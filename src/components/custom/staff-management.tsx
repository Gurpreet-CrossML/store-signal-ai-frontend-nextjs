"use client";

import { useEffect, useMemo, useState } from "react";
import { IconPlus, IconSearch, IconX } from "@tabler/icons-react";
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
  UpdateStaff,
  type StaffMember,
} from "@/redux/api-slice/tenancy-slice";
import StaffForm from "@/components/custom/staff-form";
import { ASSIGNABLE_ROLES, ROLE_LABELS } from "@/lib/staff-roles";
import type { StaffRole } from "@/lib/tenant-types";
import { StaffDataTable } from "@/components/custom/staff-data-table";
import { getStaffColumns } from "@/components/custom/staff-columns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingState } from "@/components/custom/loading-state";
import { cn } from "@/lib/utils";

export default function StaffManagement({
  className,
  contentClassName,
}: {
  className?: string;
  contentClassName?: string;
}) {
  const dispatch = useAppDispatch();
  const { staff, staffLoading } = useAppSelector(
    (state) => state.GetTenancyReducer,
  );

  const [formOpen, setFormOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<StaffMember | null>(null);
  const [toggleTarget, setToggleTarget] = useState<StaffMember | null>(null);
  const [roleTarget, setRoleTarget] = useState<StaffMember | null>(null);
  // The role picked in the change-role dialog, before it is saved.
  const [roleDraft, setRoleDraft] = useState<StaffRole | "">("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const hasActiveFilters =
    search !== "" || roleFilter !== "all" || statusFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("all");
    setStatusFilter("all");
  };

  // Staff lists are small (one company), so filtering client-side is fine.
  const filteredStaff = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (staff ?? []).filter((member) => {
      if (member.is_staff) return;
      if (roleFilter !== "all" && member.role !== roleFilter) return false;
      if (
        statusFilter !== "all" &&
        member.is_active !== (statusFilter === "active")
      )
        return false;
      if (!query) return true;
      return [member.first_name, member.last_name, member.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [staff, search, roleFilter, statusFilter]);

  useEffect(() => {
    dispatch(FetchStaff());
  }, [dispatch]);

  const columns = useMemo(
    () =>
      getStaffColumns({
        onChangeRole: (member) => {
          setRoleTarget(member);
          setRoleDraft(member.role);
        },
        onResetPassword: setResetTarget,
        onToggleActive: setToggleTarget,
      }),
    [],
  );

  if (staffLoading && !staff) {
    return <LoadingState />;
  }

  return (
    <div className={cn("flex w-full flex-col gap-4", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email…"
            className="pl-8"
            aria-label="Search staff"
          />
        </div>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger aria-label="Filter by role" className="w-fit">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {ASSIGNABLE_ROLES.map((role) => (
              <SelectItem key={role.value} value={role.value}>
                {ROLE_LABELS[role.value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger aria-label="Filter by status" className="w-fit">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={clearFilters}
          >
            <IconX />
            Clear
          </Button>
        )}

        <Button className="ml-auto" onClick={() => setFormOpen(true)}>
          <IconPlus />
          Add Staff
        </Button>
      </div>

      <div className={contentClassName}>
        <StaffDataTable
          columns={columns}
          data={filteredStaff}
          isLoading={staffLoading}
        />
      </div>

      <StaffForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={() => dispatch(FetchStaff())}
      />

      {/* Change role */}
      <AlertDialog
        open={Boolean(roleTarget)}
        onOpenChange={(o) => !o && setRoleTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change role</AlertDialogTitle>
            <AlertDialogDescription>
              Choose what {roleTarget?.email} can do. The role applies to every
              store and takes effect within a minute.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2">
            <Select
              value={roleDraft}
              onValueChange={(value) => setRoleDraft(value as StaffRole)}
            >
              <SelectTrigger aria-label="Role" className="w-full">
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
            <p className="text-xs text-muted-foreground">
              {ASSIGNABLE_ROLES.find((r) => r.value === roleDraft)?.description}
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!roleDraft || roleDraft === roleTarget?.role}
              onClick={() => {
                if (roleTarget && roleDraft)
                  dispatch(UpdateStaff({ id: roleTarget.id, role: roleDraft }));
                setRoleTarget(null);
              }}
            >
              Save role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                    UpdateStaff({
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
    </div>
  );
}
