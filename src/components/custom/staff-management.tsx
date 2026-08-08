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
  SetStaffActive,
  type StaffMember,
} from "@/redux/api-slice/tenancy-slice";
import StaffForm from "@/components/custom/staff-form";
import StaffStoreAccess from "@/components/custom/staff-store-access";
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
  const [accessTarget, setAccessTarget] = useState<StaffMember | null>(null);
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
      if (roleFilter !== "all" && member.is_staff !== (roleFilter === "admin"))
        return false;
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
        onStoreAccess: setAccessTarget,
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
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
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
    </div>
  );
}
