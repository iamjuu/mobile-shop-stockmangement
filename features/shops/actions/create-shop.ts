"use server";

import { revalidatePath } from "next/cache";

import type { ShopFormValues } from "../components/ShopForm";
import { ShopService } from "../services/shop.service";

const service = new ShopService();

export async function createShopAction(
  data: ShopFormValues
) {
  await service.create(data);

  revalidatePath("/admin/shops");
}
