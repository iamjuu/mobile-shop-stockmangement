import { CategoryService } from "@/features/categories/services/category.service";

export default async function CategoriesPage() {
  const service =
    new CategoryService();

  const categories =
    await service.getAll();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        Categories
      </h1>

      <div className="space-y-3">
        {categories.map(
          (category) => (
            <div
              key={category.id}
              className="border p-4 rounded"
            >
              {category.name}
            </div>
          )
        )}
      </div>
    </div>
  );
}