import { prisma } from "@/lib/prisma";

export class SubCategoryRepository {
  async findAll() {
    return prisma.subCategory.findMany({
      include: {
        category: {
          include: {
            shop: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  async create(
    name: string,
    categoryId: string
  ) {
    return prisma.subCategory.create({
      data: {
        name,
        categoryId,
      },
    });
  }

  async findByCategory(
    categoryId: string
  ) {
    return prisma.subCategory.findMany({
      where: {
        categoryId,
      },
    });
  }
}
