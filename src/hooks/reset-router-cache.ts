"use server";

import { revalidatePath } from "next/cache";

// A server action that revalidates a path makes the client router drop its
// whole prefetch cache — routes as well as page data, which router.refresh()
// leaves alone.
export async function resetRouterCache() {
  revalidatePath("/", "layout");
}
