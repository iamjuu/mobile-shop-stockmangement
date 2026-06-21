import { Package } from "lucide-react";
import { revalidatePath } from "next/cache";

import { CategoryService } from "@/features/categories/services/category.service";
import { ProductCreateForm } from "@/features/products/components/ProductCreateForm";
import { ProductDirectory } from "@/features/products/components/ProductDirectory";
import { productSchema } from "@/features/products/schemas/product.schema";
import { ProductService } from "@/features/products/services/product.service";
import { ShopService } from "@/features/shops/services/shop.service";
import { SubCategoryService } from "@/features/subcategories/services/subcategory.service";
import { prisma } from "@/lib/prisma";

export default async function ProductsPage() {
  const shopService = new ShopService();
  const categoryService = new CategoryService();
  const subCategoryService = new SubCategoryService();
  const productService = new ProductService();

  const [
    shops,
    categories,
    subcategories,
    products,
  ] = await Promise.all([
    shopService.getAll(),
    categoryService.getAll(),
    subCategoryService.getAll(),
    productService.getAll(),
  ]);

  async function createProduct(formData: FormData) {
    "use server";

    const parsed = productSchema.safeParse({
      productName: formData.get("productName"),
      shopId: formData.get("shopId"),
      categoryId: formData.get("categoryId"),
      subcategoryId: formData.get("subcategoryId"),
      purchasePrice: formData.get("purchasePrice"),
      price: formData.get("price"),
      stock: formData.get("stock"),
      description: String(formData.get("description") ?? "").trim() || undefined,
    });

    if (!parsed.success) {
      return;
    }

    const [
      shop,
      category,
      subcategory,
    ] = await Promise.all([
      prisma.shop.findUnique({
        where: {
          id: parsed.data.shopId,
        },
      }),
      prisma.category.findUnique({
        where: {
          id: parsed.data.categoryId,
        },
      }),
      prisma.subCategory.findUnique({
        where: {
          id: parsed.data.subcategoryId,
        },
      }),
    ]);

    if (!shop || !category || !subcategory) {
      return;
    }

    if (category.shopId && category.shopId !== shop.id) {
      return;
    }

    if (subcategory.categoryId !== category.id) {
      return;
    }

    const service = new ProductService();
    await service.create(parsed.data);

    revalidatePath("/admin/products");
    revalidatePath("/admin/admin-dashboard");
  }

  const formShops = shops.map((shop) => ({
    id: shop.id,
    shopName: shop.shopName,
  }));
  const formCategories = categories.map((category) => ({
    id: category.id,
    name: category.name,
    shopId: category.shopId,
    shop: category.shop
      ? {
          shopName: category.shop.shopName,
        }
      : null,
  }));
  const formSubcategories = subcategories.map((subcategory) => ({
    id: subcategory.id,
    name: subcategory.name,
    categoryId: subcategory.categoryId,
  }));
  const directoryProducts = products.map((product) => ({
    id: product.id,
    productCode: product.productCode,
    productName: product.productName,
    shopName: product.shop.shopName,
    categoryName: product.category.name,
    subcategoryName: product.subcategory.name,
    purchasePrice: product.purchasePrice,
    price: product.price,
    stock: product.stock,
    description: product.description,
  }));

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[430px_1fr]">
        <section className="rounded-[24px] border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-950 text-white">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">
                Inventory setup
              </p>
              <h1 className="text-3xl font-semibold">
                Products
              </h1>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-zinc-500">
            Add products by selecting the shop first. Categories are filtered
            by the shop, and subcategories are filtered by the selected category.
          </p>

          <ProductCreateForm
            shops={formShops}
            categories={formCategories}
            subcategories={formSubcategories}
            action={createProduct}
          />
        </section>

        <ProductDirectory products={directoryProducts} />
      </div>
    </div>
  );
}
