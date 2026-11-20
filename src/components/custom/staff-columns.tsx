"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  IconArrowDown,
  IconArrowUp,
  IconDotsVertical,
  IconKey,
  IconUserCheck,
  IconUserCog,
  IconUserOff,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CustomerAvatar } from "@/components/custom/customer-avatar";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import { ROLE_LABELS } from "@/lib/staff-roles";
import type { StaffRole } from "@/lib/tenant-types";
import { cn } from "@/lib/utils";
import type { StaffMember } from "@/redux/api-slice/tenancy-slice";

export type StaffRowActions = {
  /** Whether this user may change the member (role, password, status). */
  canManage: (staff: StaffMember) => boolean;
  onChangeRole: (staff: StaffMember) => void;
  onResetPassword: (staff: StaffMember) => void;
  onToggleActive: (staff: StaffMember) => void;
};

export const fullName = (s: StaffMember) =>
  `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || "—";

/** The role's name as a plain pill: no icon, no tint. */
export function StaffRoleBadge({ role }: { role: StaffRole }) {
  return (
    <Badge variant="outline" className="rounded-full font-normal">
      {ROLE_LABELS[role] ?? role}
    </Badge>
  );
}

/** Active or not, as a pill with a dot. */
export function StaffStatusBadge({ active }: { active: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 rounded-full font-normal",
        BADGE_TONE_STYLES[active ? "success" : "danger"],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}

/** Avatar, then the name over the email. */
export function StaffMemberCell({ staff }: { staff: StaffMember }) {
  const name = fullName(staff);
  return (
    <div className="flex min-w-0 items-center gap-3">
      <CustomerAvatar name={name === "—" ? staff.email : name} size="size-8" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{staff.email}</p>
      </div>
    </div>
  );
}

/** The ⋮ menu; nothing for a member this user may not change. */
export function StaffRowMenu({
  staff,
  actions,
}: {
  staff: StaffMember;
  actions: StaffRowActions;
}) {
  if (!actions.canManage(staff)) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${fullName(staff)}`}
        >
          <IconDotsVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onSelect={() => actions.onChangeRole(staff)}>
          <IconUserCog />
          Change Role
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => actions.onResetPassword(staff)}>
          <IconKey />
          Reset Password
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => actions.onToggleActive(staff)}>
          {staff.is_active ? (
            <>
              <IconUserOff />
              Deactivate
            </>
          ) : (
            <>
              <IconUserCheck />
              Activate
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function getStaffColumns(
  actions: StaffRowActions,
): ColumnDef<StaffMember>[] {
  return [
    {
      id: "member",
      accessorFn: fullName,
      // Case-insensitive, so "kunal tyagi" sorts with "Kunal".
      sortingFn: "text",
      header: ({ column }) => (
        <button
          type="button"
          className="inline-flex items-center gap-1 hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Member
          {column.getIsSorted() === "desc" ? (
            <IconArrowUp className="size-3" />
          ) : (
            <IconArrowDown className="size-3" />
          )}
        </button>
      ),
      cell: ({ row }) => <StaffMemberCell staff={row.original} />,
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => <StaffRoleBadge role={row.original.role} />,
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => <StaffStatusBadge active={row.original.is_active} />,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <StaffRowMenu staff={row.original} actions={actions} />
        </div>
      ),
    },
  ];
}
