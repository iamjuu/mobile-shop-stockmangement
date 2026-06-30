import { PackageSearch } from "lucide-react";
import { revalidatePath } from "next/cache";

import { ProductCatalog } from "@/features/products/components/ProductCatalog";
import { prisma } from "@/lib/prisma";

export default async function ProductCatalogPage() {
  const [categories, products] = await Promise.all([
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

console.log("========== PRODUCTS ==========");
console.log(products);
console.log("Products Count:", products.length);

products.forEach((product) => {
  console.log({
    id: product.id,
    productName: product.productName,
    productCode: product.productCode,
    stock: product.stock,
    deletedAt: product.deletedAt,
  });
});

console.log("========== CATEGORIES ==========");
console.log(categories);

  async function updateProduct(
    productId: string,
    data: {
      productName: string;
      purchasePrice: number;
      price: number;
      stock: number;
      description?: string;
    }
  ) {
    "use server";

    const productName = data.productName.trim();

    if (
      !productId ||
      productName.length < 2 ||
      data.purchasePrice < 0 ||
      data.price < 0 ||
      data.stock < 0
    ) {
      return {
        ok: false,
        message: "Invalid product details.",
      };
    }

    await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        productName,
        purchasePrice: data.purchasePrice,
        price: data.price,
        stock: Math.trunc(data.stock),
        description: data.description?.trim() || null,
      },
    });

    revalidatePath("/admin/product-catalog");
    revalidatePath("/admin/products");
    revalidatePath("/admin/admin-dashboard");
    revalidatePath("/employee/billing");
    revalidatePath("/employee/product-catalog");

    return {
      ok: true,
      message: "Product updated successfully.",
    };
  }

async function deleteProduct(productId: string) {
  "use server";

  if (!productId) {
    return {
      ok: false,
      message: "Invalid product.",
    };
  }

  try {
    const [saleCount, exchangeCount] = await Promise.all([
      prisma.sale.count({
        where: {
          productId,
        },
      }),
      prisma.exchange.count({
        where: {
          OR: [
            { soldProductId: productId },
            { receivedProductId: productId },
          ],
        },
      }),
    ]);

    if (saleCount > 0 || exchangeCount > 0) {
      // Soft delete if the product has history
      await prisma.product.update({
        where: {
          id: productId,
        },
        data: {
          deletedAt: new Date(),
          stock: 0,
        },
      });
    } else {
      // No history → permanently delete
      await prisma.product.delete({
        where: {
          id: productId,
        },
      });
    }

    revalidatePath("/admin/product-catalog");
    revalidatePath("/admin/products");
    revalidatePath("/admin/admin-dashboard");
    revalidatePath("/employee/billing");
    revalidatePath("/employee/product-catalog");

    return {
      ok: true,
      message:
        saleCount > 0 || exchangeCount > 0
          ? "Product archived successfully."
          : "Product deleted successfully.",
    };
  } catch (error) {
    console.error(error);

    return {
      ok: false,
      message: "Product could not be deleted.",
    };
  }
}

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
        updateAction={updateProduct}
        deleteAction={deleteProduct}
      />
    </div>
  );
}
