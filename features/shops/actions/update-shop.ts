"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import type { ShopFormValues } from "../components/ShopForm";
import { ShopService } from "../services/shop.service";

const service = new ShopService();

export async function updateShopAction({
  id,
  ...data
}: ShopFormValues & { id: string }) {
  try {
    await service.update(id, data);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        ok: false,
        message: "Shop code already exists.",
      };
    }

    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Shop could not be updated.",
    };
  }

  revalidatePath("/admin/shops");

  return {
    ok: true,
    message: "Shop updated successfully.",
  };
}
