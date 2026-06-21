import { Tags } from "lucide-react";
import { revalidatePath } from "next/cache";

import { createCategoryAction } from "@/features/categories/actions/create-category";
import { CategoryDirectory } from "@/features/categories/components/CategoryDirectory";
import { CategoryService } from "@/features/categories/services/category.service";
import { ShopService } from "@/features/shops/services/shop.service";
import { prisma } from "@/lib/prisma";

export default async function CategoriesPage() {
  const categoryService = new CategoryService();
  const shopService = new ShopService();
  const [
    categories,
    shops,
  ] = await Promise.all([
    categoryService.getAll(),
    shopService.getAll(),
  ]);

  async function createCategory(formData: FormData) {
    "use server";

    const name = String(formData.get("name") ?? "").trim();
    const shopIdValue = String(formData.get("shopId") ?? "");
    const shopId = shopIdValue === "all" ? null : shopIdValue;

    if (!name) {
      return;
    }

    await createCategoryAction(
      name,
      shopId
    );
  }

  async function updateCategory(
    categoryId: string,
    data: {
      name: string;
      shopId?: string | null;
    }
  ) {
    "use server";

    const name = data.name.trim();

    if (!categoryId || name.length < 2) {
      return {
        ok: false,
        message: "Invalid category details.",
      };
    }

    await prisma.category.update({
      where: {
        id: categoryId,
      },
      data: {
        name,
        shopId: data.shopId || null,
      },
    });

    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    revalidatePath("/employee/billing");

    return {
      ok: true,
      message: "Category updated successfully.",
    };
  }

  const directoryCategories = categories.map((category) => ({
    id: category.id,
    name: category.name,
    shopId: category.shopId,
    shopName: category.shop?.shopName,
    createdAt: category.createdAt.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  }));
  const directoryShops = shops.map((shop) => ({
    id: shop.id,
    shopName: shop.shopName,
  }));

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
        <section className="rounded-[24px] border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-950 text-white">
              <Tags className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">
                Product setup
              </p>
              <h1 className="text-3xl font-semibold">
                Categories
              </h1>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-zinc-500">
            Create top-level product groups such as groceries, electronics,
            clothing, or medicines. Products and subcategories will be linked
            under these categories. Choose All shops for shared categories, or
            select one shop for a branch-specific category.
          </p>

          <form
            action={createCategory}
            className="mt-6 space-y-4"
          >
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Category name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Example: Electronics"
                className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
              />
            </div>

            <div>
              <label
                htmlFor="shopId"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Shop
              </label>
              <select
                id="shopId"
                name="shopId"
                defaultValue="all"
                className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
              >
                <option value="all">
                  All shops
                </option>
                {shops.map((shop) => (
                  <option
                    key={shop.id}
                    value={shop.id}
                  >
                    {shop.shopName}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Create Category
            </button>
          </form>
        </section>

        <CategoryDirectory
          categories={directoryCategories}
          shops={directoryShops}
          updateAction={updateCategory}
        />
      </div>
    </div>
  );
}
