"use server";

import { revalidatePath } from "next/cache";

import type {
  ProductFormValues,
} from "../schemas/product.schema";
import { ProductService } from "../services/product.service";

const service =
  new ProductService();

export async function createProductAction(
  data: ProductFormValues
) {
  await service.create(data);

  revalidatePath("/admin/products");
}
