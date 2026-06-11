import { db } from "@/lib/db";
import { store } from "@/lib/drizzle/schema";
import { asc } from "drizzle-orm";

/**
 * Port of Django `StoreListAPIView.get_queryset`:
 *   Store.objects.all().order_by("name")
 * serialized with StoreListSerializer fields (id, name, code).
 */
export async function list_stores() {
    return db
        .select({
            id: store.id,
            name: store.name,
            code: store.code,
        })
        .from(store)
        .orderBy(asc(store.name));
}
