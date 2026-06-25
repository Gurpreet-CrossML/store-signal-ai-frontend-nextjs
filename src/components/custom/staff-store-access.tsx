"use client";

import { useEffect } from "react";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  FetchStoreAccess,
  SetStoreAccess,
  type StaffMember,
  type StoreAccessLevel,
} from "@/redux/api-slice/tenancy-slice";

type StaffStoreAccessProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffMember | null;
};

export default function StaffStoreAccess({
  open,
  onOpenChange,
  staff,
}: StaffStoreAccessProps) {
  const dispatch = useAppDispatch();
  const { storeAccess, storeAccessLoading, storeAccessSavingCode } =
    useAppSelector((state) => state.GetTenancyReducer);

  useEffect(() => {
    if (open && staff) dispatch(FetchStoreAccess(staff.id));
  }, [open, staff, dispatch]);

  const stores = storeAccess?.stores ?? [];

  const handleChange = (storeCode: string, level: StoreAccessLevel) => {
    if (!staff) return;
    dispatch(SetStoreAccess({ userId: staff.id, storeCode, level }));
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-2xl">
          <DrawerHeader>
            <DrawerTitle>Store access</DrawerTitle>
            <DrawerDescription>
              Choose what {staff?.email} can do for each store. Changes save
              immediately.
            </DrawerDescription>
          </DrawerHeader>

          <div className="max-h-[55vh] overflow-y-auto px-4 pb-2">
            {storeAccessLoading && !storeAccess ? (
              <div className="flex items-center justify-center py-12">
                <Spinner />
              </div>
            ) : stores.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>No stores</EmptyTitle>
                  <EmptyDescription>
                    There are no stores in your company yet.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              stores.map((store) => (
                <div
                  key={store.store_code}
                  className="flex items-center justify-between gap-4 border-b py-3 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{store.store_name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {store.store_code}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {storeAccessSavingCode === store.store_code && (
                      <Spinner className="size-4" />
                    )}
                    <Select
                      value={store.level}
                      onValueChange={(level) =>
                        handleChange(
                          store.store_code,
                          level as StoreAccessLevel,
                        )
                      }
                      disabled={storeAccessSavingCode === store.store_code}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no_access">No access</SelectItem>
                        <SelectItem value="view">View</SelectItem>
                        <SelectItem value="manage">Manage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))
            )}
          </div>

          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Done</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
