import { prisma } from "@/lib/prisma";

import type { ShopFormValues } from "../components/ShopForm";

export class ShopRepository {
  findAll() {
    return prisma.shop.findMany({
      orderBy: {
        shopName: "asc",
      },
    });
  }

  findById(id: string) {
    return prisma.shop.findUnique({
      where: { id },
    });
  }

  create(data: ShopFormValues) {
    return prisma.shop.create({
      data,
    });
  }

  update(
    id: string,
    data: ShopFormValues
  ) {
    return prisma.shop.update({
      where: { id },
      data,
    });
  }

  delete(id: string) {
    return prisma.shop.delete({
      where: { id },
    });
  }
}
