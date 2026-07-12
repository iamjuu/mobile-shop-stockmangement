import { Tags } from "lucide-react";
import { revalidatePath } from "next/cache";

import {
  CategoryCreateForm,
  type CategoryCreateState,
} from "@/features/categories/components/CategoryCreateForm";
import { CategoryDirectory } from "@/features/categories/components/CategoryDirectory";
import { CategoryService } from "@/features/categories/services/category.service";
import { ShopService } from "@/features/shops/services/shop.service";
import { prisma } from "@/lib/prisma";

function normalizeCategoryName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

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

  async function createCategory(
    _state: CategoryCreateState,
    formData: FormData
  ): Promise<CategoryCreateState> {
    "use server";

    const name = String(formData.get("name") ?? "")
      .trim()
      .replace(/\s+/g, " ");
    const shopScope = String(formData.get("shopScope") ?? "all");
    const selectedShopIds = Array.from(
      new Set(
        formData
          .getAll("shopIds")
          .map((shopId) => String(shopId))
          .filter(Boolean)
      )
    );

    if (name.length < 2) {
      return {
        ok: false,
        message: "Enter a category name with at least 2 characters.",
      };
    }

    const targetShopIds =
      shopScope === "all" ? [null] : selectedShopIds;

    if (targetShopIds.length === 0) {
      return {
        ok: false,
        message: "Select All shops or at least one shop.",
      };
    }

    if (shopScope !== "all") {
      const validShopCount = await prisma.shop.count({
        where: {
          id: {
            in: selectedShopIds,
          },
        },
      });

      if (validShopCount !== selectedShopIds.length) {
        return {
          ok: false,
          message: "One or more selected shops are invalid.",
        };
      }
    }

    const existingCategories = await prisma.category.findMany({
      where: {
        OR: targetShopIds.map((shopId) => ({
          shopId,
        })),
      },
      include: {
        shop: true,
      },
    });
    const normalizedName = normalizeCategoryName(name);
    const duplicateCategory = existingCategories.find(
      (category) => normalizeCategoryName(category.name) === normalizedName
    );

    if (duplicateCategory) {
      return {
        ok: false,
        message: `Category already exists for ${
          duplicateCategory.shop?.shopName ?? "All shops"
        }.`,
      };
    }

    await prisma.category.createMany({
      data: targetShopIds.map((shopId) => ({
        name,
        shopId,
      })),
    });

    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    revalidatePath("/employee/billing");

    return {
      ok: true,
      message:
        targetShopIds.length === 1
          ? "Category created successfully."
          : `${targetShopIds.length} categories created successfully.`,
    };
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
            clothing, or medicines. Products and brands will be linked
            under these categories. Choose All shops for shared categories, or
            select one shop for a branch-specific category.
          </p>

          <CategoryCreateForm
            shops={directoryShops}
            action={createCategory}
          />
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
