import { Boxes } from "lucide-react";
import { revalidatePath } from "next/cache";

import { PendingSubmitButton } from "@/components/pending-submit-button";
import { CategoryService } from "@/features/categories/services/category.service";
import { BrandCategoryPicker } from "@/features/subcategories/components/BrandCategoryPicker";
import { BrandDirectory } from "@/features/subcategories/components/BrandDirectory";
import { SubCategoryService } from "@/features/subcategories/services/subcategory.service";
import { prisma } from "@/lib/prisma";

export default async function SubcategoriesPage() {
  const categoryService = new CategoryService();
  const subCategoryService = new SubCategoryService();
  const [
    categories,
    subcategories,
  ] = await Promise.all([
    categoryService.getAll(),
    subCategoryService.getAll(),
  ]);

  async function createSubcategory(formData: FormData) {
    "use server";

    const name = String(formData.get("name") ?? "").trim();
    const categoryScope = String(formData.get("categoryScope") ?? "");
    const selectedCategoryIds = formData
      .getAll("categoryIds")
      .map((value) => String(value));

    if (!name) {
      return;
    }

    const service = new SubCategoryService();
    const categoryIds =
      categoryScope === "all"
        ? (
            await prisma.category.findMany({
              select: {
                id: true,
              },
            })
          ).map((category) => category.id)
        : selectedCategoryIds;

    if (categoryIds.length === 0) {
      return;
    }

    await Promise.all(
      categoryIds.map((categoryId) => service.create(name, categoryId))
    );

    revalidatePath("/admin/subcategories");
  }

  async function updateSubcategory(
    subcategoryIds: string[],
    data: {
      name: string;
      categoryIds: string[];
    }
  ) {
    "use server";

    const name = data.name.trim();
    const categoryIds = [...new Set(data.categoryIds)];

    if (
      subcategoryIds.length === 0 ||
      name.length < 2 ||
      categoryIds.length === 0
    ) {
      return {
        ok: false,
        message: "Invalid brand details.",
      };
    }

    const currentRecords = await prisma.subCategory.findMany({
      where: {
        id: {
          in: subcategoryIds,
        },
      },
    });

    if (currentRecords.length === 0) {
      return {
        ok: false,
        message: "Brand not found.",
      };
    }

    const currentCategoryIds = currentRecords.map(
      (record) => record.categoryId
    );
    const categoriesToAdd = categoryIds.filter(
      (categoryId) => !currentCategoryIds.includes(categoryId)
    );
    const categoriesToRemove = currentCategoryIds.filter(
      (categoryId) => !categoryIds.includes(categoryId)
    );
    const recordsToRemove = currentRecords.filter((record) =>
      categoriesToRemove.includes(record.categoryId)
    );

    for (const record of recordsToRemove) {
      const productCount = await prisma.product.count({
        where: {
          subcategoryId: record.id,
        },
      });

      if (productCount > 0) {
        return {
          ok: false,
          message:
            "Brand is used by products in a removed category and cannot be updated.",
        };
      }
    }

    const service = new SubCategoryService();
    const recordsToKeep = currentRecords.filter((record) =>
      categoryIds.includes(record.categoryId)
    );

    await Promise.all([
      ...recordsToKeep.map((record) =>
        prisma.subCategory.update({
          where: {
            id: record.id,
          },
          data: {
            name,
          },
        })
      ),
      ...categoriesToAdd.map((categoryId) =>
        service.create(name, categoryId)
      ),
      ...recordsToRemove.map((record) =>
        prisma.subCategory.delete({
          where: {
            id: record.id,
          },
        })
      ),
    ]);

    revalidatePath("/admin/subcategories");
    revalidatePath("/admin/products");
    revalidatePath("/admin/product-catalog");
    revalidatePath("/employee/product-catalog");
    revalidatePath("/employee/exchange");

    return {
      ok: true,
      message: "Brand updated successfully.",
    };
  }

  async function deleteSubcategory(subcategoryIds: string[]) {
    "use server";

    if (subcategoryIds.length === 0) {
      return {
        ok: false,
        message: "Invalid brand.",
      };
    }

    for (const subcategoryId of subcategoryIds) {
      const productCount = await prisma.product.count({
        where: {
          subcategoryId,
        },
      });

      if (productCount > 0) {
        return {
          ok: false,
          message: "Brand is used by products and cannot be deleted.",
        };
      }
    }

    await prisma.subCategory.deleteMany({
      where: {
        id: {
          in: subcategoryIds,
        },
      },
    });

    revalidatePath("/admin/subcategories");
    revalidatePath("/admin/products");
    revalidatePath("/admin/product-catalog");
    revalidatePath("/employee/product-catalog");
    revalidatePath("/employee/exchange");

    return {
      ok: true,
      message: "Brand deleted successfully.",
    };
  }

  const totalCategoryCount = categories.length;
  const groupedBrands = new Map<
    string,
    {
      ids: string[];
      name: string;
      categories: {
        id: string;
        name: string;
        shopName: string;
      }[];
      createdAt: Date;
    }
  >();

  for (const subcategory of subcategories) {
    const groupKey = subcategory.name.trim().toLowerCase();
    const category = {
      id: subcategory.categoryId,
      name: subcategory.category.name,
      shopName: subcategory.category.shop?.shopName ?? "All shops",
    };
    const existingGroup = groupedBrands.get(groupKey);

    if (existingGroup) {
      existingGroup.ids.push(subcategory.id);
      existingGroup.categories.push(category);

      if (subcategory.createdAt < existingGroup.createdAt) {
        existingGroup.createdAt = subcategory.createdAt;
      }
    } else {
      groupedBrands.set(groupKey, {
        ids: [subcategory.id],
        name: subcategory.name,
        categories: [category],
        createdAt: subcategory.createdAt,
      });
    }
  }

  const directoryBrands = Array.from(groupedBrands.values())
    .map((group) => {
    const uniqueCategories = Array.from(
      new Map(group.categories.map((category) => [category.id, category])).values()
    );
    const uniqueShops = [
      ...new Set(uniqueCategories.map((category) => category.shopName)),
    ];

    return {
      ids: group.ids,
      name: group.name,
      categories: uniqueCategories,
      isAllCategories:
        totalCategoryCount > 0 &&
        uniqueCategories.length === totalCategoryCount,
      shopName:
        uniqueShops.length === 1
          ? uniqueShops[0]
          : `${uniqueShops[0]} +${uniqueShops.length - 1}`,
      createdAt: group.createdAt.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    };
  })
    .sort((left, right) => left.name.localeCompare(right.name));

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
        <section className="rounded-[24px] border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-950 text-white">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">
                Product setup
              </p>
              <h1 className="text-3xl font-semibold">
                Brands
              </h1>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-zinc-500">
            Create brands under a category. For example, under
            Electronics you can add Mobiles, Laptops, Chargers, or Accessories.
          </p>

          <form
            action={createSubcategory}
            className="mt-6 space-y-4"
          >
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Brand name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Example: Mobiles"
                className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
              />
            </div>

            <div>
              <label
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Category
              </label>
              <BrandCategoryPicker
                categories={categories.map((category) => ({
                  id: category.id,
                  name: category.name,
                  shopName: category.shop?.shopName ?? "All shops",
                }))}
              />
            </div>

            <PendingSubmitButton
              disabled={categories.length === 0}
              pendingLabel="Creating brand..."
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            >
              Create Brand
            </PendingSubmitButton>

            {categories.length === 0 ? (
              <p className="text-sm text-red-600">
                Create a category before adding brands.
              </p>
            ) : null}
          </form>
        </section>

        <BrandDirectory
          brands={directoryBrands}
          categories={categories.map((category) => ({
            id: category.id,
            name: category.name,
            shopName: category.shop?.shopName ?? "All shops",
          }))}
          totalCategoryCount={totalCategoryCount}
          updateAction={updateSubcategory}
          deleteAction={deleteSubcategory}
        />
      </div>
    </div>
  );
}
