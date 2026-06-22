import { getDb } from "@/lib/tenant-context";
import { store } from "@/lib/drizzle/schema";
import { storeCodeScope } from "@/db/access";
import { asc } from "drizzle-orm";

/**
 * Port of Django `StoreListAPIView.get_queryset`:
 *   Store.objects.all().order_by("name")
 * serialized with StoreListSerializer fields (id, name, code).
 *
 * Scoped (F3): staff only see the stores granted to them; admins/superuser see
 * all stores in the active tenant.
 */
export async function list_stores() {
  const db = getDb();
  const scope = storeCodeScope(store.code);
  const query = db
    .select({
      id: store.id,
      name: store.name,
      code: store.code,
    })
    .from(store);
  return (scope ? query.where(scope) : query).orderBy(asc(store.name));
}
