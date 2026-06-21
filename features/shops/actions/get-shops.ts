"use server";

import { ShopService } from "../services/shop.service";

const service = new ShopService();

export async function getShopsAction() {
  return service.getAll();
}
