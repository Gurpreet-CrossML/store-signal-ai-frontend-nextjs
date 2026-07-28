"use client";

import { useEffect, useState } from "react";
import { IconUser } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FetchStaff, type StaffMember } from "@/redux/api-slice/tenancy-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

const staffName = (staff: StaffMember) => {
  const name = `${staff.first_name} ${staff.last_name}`.trim();
  return name || staff.email;
};

export function AssignStaffDropdown() {
  const dispatch = useAppDispatch();
  const { staff, staffLoading } = useAppSelector(
    (state) => state.GetTenancyReducer,
  );
  const [selectedStaffId, setSelectedStaffId] = useState("");

  useEffect(() => {
    dispatch(FetchStaff());
  }, [dispatch]);

  const activeStaff = staff.filter((member) => member.is_active);
  const selectedStaff = activeStaff.find(
    (member) => String(member.id) === selectedStaffId,
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="bg-white">
          <IconUser className="size-4" />
          {selectedStaff ? staffName(selectedStaff) : "Assign"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-50" align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Assign to staff</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={selectedStaffId}
            onValueChange={setSelectedStaffId}
          >
            {staffLoading ? (
              <DropdownMenuRadioItem value="loading" disabled>
                Loading staff...
              </DropdownMenuRadioItem>
            ) : activeStaff.length ? (
              activeStaff.map((member) => (
                <DropdownMenuRadioItem
                  key={member.id}
                  value={String(member.id)}
                >
                  {staffName(member)}
                </DropdownMenuRadioItem>
              ))
            ) : (
              <DropdownMenuRadioItem value="empty" disabled>
                No active staff found
              </DropdownMenuRadioItem>
            )}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
