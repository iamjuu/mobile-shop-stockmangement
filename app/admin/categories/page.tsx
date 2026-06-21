import { Tags } from "lucide-react";

import { createCategoryAction } from "@/features/categories/actions/create-category";
import { CategoryService } from "@/features/categories/services/category.service";
import { ShopService } from "@/features/shops/services/shop.service";

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

        <section className="overflow-hidden rounded-[24px] border border-zinc-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold">
                Category directory
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                {categories.length} categories configured
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-left">
              <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-5 py-4">
                    Name
                  </th>
                  <th className="px-5 py-4">
                    Shop
                  </th>
                  <th className="px-5 py-4">
                    Created
                  </th>
                  <th className="px-5 py-4 text-right">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-100 text-sm">
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <tr
                      key={category.id}
                      className="transition hover:bg-zinc-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-700">
                            {category.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-zinc-950">
                              {category.name}
                            </p>
                            <p className="text-xs text-zinc-500">
                              Product category
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
                          {category.shop?.shopName ?? "All shops"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-zinc-600">
                        {category.createdAt.toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-12 text-center text-sm text-zinc-500"
                    >
                      No categories found. Create your first category to organize products.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
