"use server";

import { revalidatePath } from "next/cache";

import type { ShopFormValues } from "../components/ShopForm";
import { ShopService } from "../services/shop.service";

const service = new ShopService();

export async function updateShopAction({
  id,
  ...data
}: ShopFormValues & { id: string }) {
  await service.update(id, data);

  revalidatePath("/admin/shops");
}
