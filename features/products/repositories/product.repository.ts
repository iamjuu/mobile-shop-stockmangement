import { prisma } from "@/lib/prisma";

import type {
  ProductFormValues,
} from "../schemas/product.schema";

type ProductCreateData =
  ProductFormValues & {
    productCode: string;
  };

export class ProductRepository {
  async findAll() {
    return prisma.product.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        shop: true,
        category: {
          include: {
            shop: true,
          },
        },
        subcategory: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findByCode(
    productCode: string
  ) {
    return prisma.product.findFirst({
      where: {
        productCode,
        deletedAt: null,
      },
    });
  }

  async create(data: ProductCreateData) {
    return prisma.product.create({
      data,
    });
  }

  async delete(id: string) {
    return prisma.product.delete({
      where: {
        id,
      },
    });
  }
}
