import { prisma } from "@/lib/prisma";

export class SubCategoryRepository {
  async findAll() {
    return prisma.subCategory.findMany({
      include: {
        category: true,
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