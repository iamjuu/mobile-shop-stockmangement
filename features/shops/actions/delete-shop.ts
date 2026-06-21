"use server";

import { revalidatePath } from "next/cache";

import { ShopService } from "../services/shop.service";

const service = new ShopService();

export async function deleteShopAction(
  id: string
) {
  await service.delete(id);

  revalidatePath("/admin/shops");
}
