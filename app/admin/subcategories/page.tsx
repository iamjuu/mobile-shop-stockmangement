import { Boxes } from "lucide-react";
import { revalidatePath } from "next/cache";

import { PendingSubmitButton } from "@/components/pending-submit-button";
import { CategoryService } from "@/features/categories/services/category.service";
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
    const categoryId = String(formData.get("categoryId") ?? "");

    if (!name || !categoryId) {
      return;
    }

    const service = new SubCategoryService();
    await service.create(
      name,
      categoryId
    );

    revalidatePath("/admin/subcategories");
  }

  async function updateSubcategory(
    brandId: string,
    data: {
      name: string;
      categoryId: string;
    }
  ) {
    "use server";

    const name = data.name.trim();

    if (!brandId || name.length < 2 || !data.categoryId) {
      return {
        ok: false,
        message: "Invalid brand details.",
      };
    }

    const category = await prisma.category.findUnique({
      where: {
        id: data.categoryId,
      },
    });

    if (!category) {
      return {
        ok: false,
        message: "Category not found.",
      };
    }

    await prisma.subCategory.update({
      where: {
        id: brandId,
      },
      data: {
        name,
        categoryId: data.categoryId,
      },
    });

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

  async function deleteSubcategory(brandId: string) {
    "use server";

    if (!brandId) {
      return {
        ok: false,
        message: "Invalid brand.",
      };
    }

    const productCount = await prisma.product.count({
      where: {
        subcategoryId: brandId,
      },
    });

    if (productCount > 0) {
      return {
        ok: false,
        message: "Brand is used by products and cannot be deleted.",
      };
    }

    await prisma.subCategory.delete({
      where: {
        id: brandId,
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

  const directoryBrands = subcategories.map((subcategory) => ({
    id: subcategory.id,
    name: subcategory.name,
    categoryId: subcategory.categoryId,
    categoryName: subcategory.category.name,
    shopName: subcategory.category.shop?.shopName ?? "All shops",
    createdAt: subcategory.createdAt.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  }));

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
                htmlFor="categoryId"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Category
              </label>
              <select
                id="categoryId"
                name="categoryId"
                required
                defaultValue=""
                className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
              >
                <option
                  value=""
                  disabled
                >
                  Select category
                </option>
                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name} - {category.shop?.shopName ?? "All shops"}
                  </option>
                ))}
              </select>
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
          updateAction={updateSubcategory}
          deleteAction={deleteSubcategory}
        />
      </div>
    </div>
  );
}
