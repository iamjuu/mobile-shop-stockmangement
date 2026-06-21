"use server";

import { ShopService } from "../services/shop.service";

const service = new ShopService();

export async function getShopByIdAction(
  id: string
) {
  return service.getById(id);
}
