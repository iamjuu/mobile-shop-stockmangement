import { PackageSearch } from "lucide-react";

import { ProductCatalog } from "@/features/products/components/ProductCatalog";
import { activeProductWhere } from "@/lib/product-filters";
import { prisma } from "@/lib/prisma";

export default async function EmployeeProductCatalogPage() {
  const [
    categories,
    products,
  ] = await Promise.all([
    prisma.category.findMany({
      include: {
        shop: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.product.findMany({
      where: activeProductWhere,
      include: {
        shop: true,
        category: true,
        subcategory: true,
      },
      orderBy: {
        productName: "asc",
      },
    }),
  ]);

  return (
    <div className="space-y-5">
      <section className="rounded-[24px] border border-zinc-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-950 text-white">
            <PackageSearch className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">
              Product catalog
            </p>
            <h1 className="text-3xl font-semibold">Product</h1>
          </div>
        </div>
      </section>

      <ProductCatalog
        categories={categories.map((category) => ({
          id: category.id,
          name: category.name,
          shopName: category.shop?.shopName ?? "All shops",
          productCount: category._count.products,
        }))}
        products={products.map((product) => ({
          id: product.id,
          productCode: product.productCode,
          productName: product.productName,
          categoryId: product.categoryId,
          categoryName: product.category.name,
          subcategoryId: product.subcategoryId,
          shopName: product.shop.shopName,
          brandName: product.subcategory.name,
          purchasePrice: product.purchasePrice,
          price: product.price,
          stock: product.stock,
          source: product.source ?? "REGULAR",
          imeiNumber: product.imeiNumber,
          mainImageUrl: product.mainImageUrl ?? product.imageUrl,
          galleryImageUrls: product.galleryImageUrls,
          description: product.description,
        }))}
      />
    </div>
  );
}
