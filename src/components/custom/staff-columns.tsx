"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  IconBuildingStore,
  IconDotsVertical,
  IconKey,
  IconUserCheck,
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
import type { StaffMember } from "@/redux/api-slice/tenancy-slice";

export type StaffRowActions = {
  onStoreAccess: (staff: StaffMember) => void;
  onResetPassword: (staff: StaffMember) => void;
  onToggleActive: (staff: StaffMember) => void;
};

const fullName = (s: StaffMember) =>
  `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || "—";

export function getStaffColumns(
  actions: StaffRowActions,
): ColumnDef<StaffMember>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {fullName(row.original)}
        </span>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.email}</span>
      ),
    },
    {
      accessorKey: "is_staff",
      header: "Role",
      cell: ({ row }) => (
        <Badge variant={row.original.is_staff ? "default" : "secondary"}>
          {row.original.is_staff ? "Admin" : "Staff"}
        </Badge>
      ),
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? "outline" : "destructive"}>
          {row.original.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const s = row.original;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <IconDotsVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => actions.onStoreAccess(s)}>
                  <IconBuildingStore />
                  Store access
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => actions.onResetPassword(s)}>
                  <IconKey />
                  Reset password
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => actions.onToggleActive(s)}>
                  {s.is_active ? (
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
          </div>
        );
      },
    },
  ];
}
