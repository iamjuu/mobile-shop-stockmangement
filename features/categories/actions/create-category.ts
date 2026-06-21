"use server";

import { revalidatePath } from "next/cache";

import { CategoryService } from "../services/category.service";

const service =
  new CategoryService();

export async function createCategoryAction(
  name: string,
  shopId?: string | null
) {
  await service.create(
    name,
    shopId
  );

  revalidatePath("/admin/categories");
}
