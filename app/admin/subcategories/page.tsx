import { Boxes } from "lucide-react";
import { revalidatePath } from "next/cache";

import { CategoryService } from "@/features/categories/services/category.service";
import { SubCategoryService } from "@/features/subcategories/services/subcategory.service";

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
                Subcategories
              </h1>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-zinc-500">
            Create subcategories under a category. For example, under
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
                Subcategory name
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

            <button
              type="submit"
              disabled={categories.length === 0}
              className="w-full rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            >
              Create Subcategory
            </button>

            {categories.length === 0 ? (
              <p className="text-sm text-red-600">
                Create a category before adding subcategories.
              </p>
            ) : null}
          </form>
        </section>

        <section className="overflow-hidden rounded-[24px] border border-zinc-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold">
                Subcategory directory
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                {subcategories.length} subcategories configured
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-5 py-4">
                    Name
                  </th>
                  <th className="px-5 py-4">
                    Category
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
                {subcategories.length > 0 ? (
                  subcategories.map((subcategory) => (
                    <tr
                      key={subcategory.id}
                      className="transition hover:bg-zinc-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-700">
                            {subcategory.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-zinc-950">
                              {subcategory.name}
                            </p>
                            <p className="text-xs text-zinc-500">
                              Product subcategory
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
                          {subcategory.category.name}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-zinc-600">
                        {subcategory.category.shop?.shopName ?? "All shops"}
                      </td>
                      <td className="px-5 py-4 text-zinc-600">
                        {subcategory.createdAt.toLocaleDateString("en-IN", {
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
                      colSpan={5}
                      className="px-5 py-12 text-center text-sm text-zinc-500"
                    >
                      No subcategories found. Add one under an existing category.
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
