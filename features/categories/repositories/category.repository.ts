import { prisma } from "@/lib/prisma";

export class CategoryRepository {
  async findAll() {
    return prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
    });
  }

  async findById(id: string) {
    return prisma.category.findUnique({
      where: { id },
    });
  }

  async create(name: string) {
    return prisma.category.create({
      data: {
        name,
      },
    });
  }

  async update(
    id: string,
    name: string
  ) {
    return prisma.category.update({
      where: { id },
      data: { name },
    });
  }

  async delete(id: string) {
    return prisma.category.delete({
      where: { id },
    });
  }
}