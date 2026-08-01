import { PackageSearch } from "lucide-react";
import { revalidatePath } from "next/cache";

import { ProductCatalog } from "@/features/products/components/ProductCatalog";
import { generateProductCode } from "@/features/products/utils/product-code";
import { archiveAndDeleteProduct } from "@/lib/product-archive";
import { activeProductWhere } from "@/lib/product-filters";
import { prisma } from "@/lib/prisma";

function normalizeProductName(productName: string) {
  return productName.trim().replace(/\s+/g, " ").toLowerCase();
}

export default async function ProductCatalogPage() {
  const [categories, products, subcategories, shops] = await Promise.all([
    prisma.category.findMany({
      include: {
        shop: true,
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
    prisma.subCategory.findMany({
      orderBy: {
        name: "asc",
      },
    }),
    prisma.shop.findMany({
      orderBy: {
        shopName: "asc",
      },
    }),
  ]);

  console.log("========== ADMIN PRODUCT CATALOG ==========");
  console.log("Categories:", categories.length);
  console.log(
    categories.map((category) => ({
      id: category.id,
      name: category.name,
      shopName: category.shop?.shopName ?? "All shops",
    }))
  );
  console.log("Products:", products.length);
  console.log(
    products.map((product) => ({
      id: product.id,
      productName: product.productName,
      productCode: product.productCode,
      categoryId: product.categoryId,
      categoryName: product.category.name,
      shopName: product.shop.shopName,
      brandName: product.subcategory.name,
      stock: product.stock,
      deletedAt: product.deletedAt,
    }))
  );

  async function updateProduct(
    productId: string,
    data: {
      productName: string;
      shopIds: string[];
      subcategoryId: string;
      purchasePrice: number;
      price: number;
      stock: number;
      description?: string;
    }
  ) {
    "use server";

    const productName = data.productName.trim();
    const selectedShopIds = Array.from(new Set(data.shopIds.filter(Boolean)));

    if (
      !productId ||
      selectedShopIds.length === 0 ||
      !data.subcategoryId ||
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

    const [product, subcategory] = await Promise.all([
      prisma.product.findUnique({
        where: {
          id: productId,
        },
        select: {
          productCode: true,
          productName: true,
          shopId: true,
          categoryId: true,
          source: true,
          imageUrl: true,
          mainImageUrl: true,
          galleryImageUrls: true,
          imeiNumber: true,
        },
      }),
      prisma.subCategory.findUnique({
        where: {
          id: data.subcategoryId,
        },
        select: {
          categoryId: true,
        },
      }),
    ]);

    if (
      !product ||
      product.source === "EXCHANGE_THIRD_PARTY" ||
      !subcategory ||
      subcategory.categoryId !== product.categoryId
    ) {
      return {
        ok: false,
        message: "Invalid brand for this product category.",
      };
    }

    const [category, targetShops] = await Promise.all([
      prisma.category.findUnique({
        where: {
          id: product.categoryId,
        },
        select: {
          shopId: true,
        },
      }),
      prisma.shop.findMany({
        where: {
          id: {
            in: selectedShopIds,
          },
        },
        select: {
          id: true,
          shopName: true,
        },
      }),
    ]);

    if (!category || targetShops.length !== selectedShopIds.length) {
      return {
        ok: false,
        message: "One or more selected shops are invalid.",
      };
    }

    if (selectedShopIds.length > 1 && category.shopId) {
      return {
        ok: false,
        message: "Use an All shops category before adding this product to multiple shops.",
      };
    }

    const primaryShopId = selectedShopIds.includes(product.shopId)
      ? product.shopId
      : selectedShopIds[0];

    if (category.shopId && category.shopId !== primaryShopId) {
      return {
        ok: false,
        message: "This category is not available for the selected shop.",
      };
    }

    const matchingProducts = await prisma.product.findMany({
      where: {
        ...activeProductWhere,
        source: "REGULAR",
        categoryId: product.categoryId,
        subcategoryId: data.subcategoryId,
        shopId: {
          in: selectedShopIds,
        },
      },
      select: {
        id: true,
        productName: true,
        productCode: true,
        shopId: true,
      },
    });
    const normalizedProductName = normalizeProductName(productName);
    const productsToUpdate = matchingProducts.filter(
      (matchingProduct) =>
        matchingProduct.id === productId ||
        normalizeProductName(matchingProduct.productName) ===
          normalizedProductName
    );
    const conflictingProduct = matchingProducts.find(
      (matchingProduct) =>
        matchingProduct.id !== productId &&
        normalizeProductName(matchingProduct.productName) ===
          normalizedProductName &&
        !selectedShopIds.includes(matchingProduct.shopId)
    );

    if (conflictingProduct) {
      const duplicateShop = targetShops.find(
        (shop) => shop.id === conflictingProduct.shopId
      );

      return {
        ok: false,
        message: `Another product already has this name in ${
          duplicateShop?.shopName ?? "that shop"
        } (${conflictingProduct.productCode}).`,
      };
    }

    const coveredShopIds = new Set([
      primaryShopId,
      ...productsToUpdate.map((matchingProduct) => matchingProduct.shopId),
    ]);
    const shopsToCreate = selectedShopIds.filter(
      (shopId) => !coveredShopIds.has(shopId)
    );
    const productUpdateData = {
      productName,
      subcategoryId: data.subcategoryId,
      purchasePrice: data.purchasePrice,
      price: data.price,
      stock: Math.trunc(data.stock),
      description: data.description?.trim() || null,
    };

    await prisma.$transaction(
      async (tx) => {
        await tx.product.update({
          where: {
            id: productId,
          },
          data: {
            ...productUpdateData,
            shopId: primaryShopId,
          },
        });

        for (const matchingProduct of productsToUpdate) {
          if (matchingProduct.id === productId) {
            continue;
          }

          await tx.product.update({
            where: {
              id: matchingProduct.id,
            },
            data: productUpdateData,
          });
        }

        for (const shopId of shopsToCreate) {
          await tx.product.create({
            data: {
              productCode: generateProductCode(),
              ...productUpdateData,
              shopId,
              categoryId: product.categoryId,
              source: "REGULAR",
              imageUrl: product.imageUrl,
              mainImageUrl: product.mainImageUrl,
              galleryImageUrls: product.galleryImageUrls,
              imeiNumber: product.imeiNumber,
            },
          });
        }
      },
      {
        maxWait: 5000,
        timeout: 10000,
      }
    );

    revalidatePath("/admin/product-catalog");
    revalidatePath("/admin/products");
    revalidatePath("/admin/admin-dashboard");
    revalidatePath("/employee/billing");
    revalidatePath("/employee/product-catalog");

    return {
      ok: true,
      message:
        shopsToCreate.length > 0
          ? `Product updated and added to ${shopsToCreate.length} more shops.`
          : "Product updated successfully.",
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
    const result = await archiveAndDeleteProduct(productId);

    if (!result.ok) {
      return result;
    }

    revalidatePath("/admin/product-catalog");
    revalidatePath("/admin/products");
    revalidatePath("/admin/admin-dashboard");
    revalidatePath("/employee/billing");
    revalidatePath("/employee/product-catalog");

    return {
      ok: true,
      message: result.message,
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
        key={[
          ...categories.map((category) => category.id),
          ...products.map((product) => product.id),
        ].join("|")}
        categories={categories.map((category) => ({
          id: category.id,
          name: category.name,
          shopName: category.shop?.shopName ?? "All shops",
          productCount: products.filter(
            (product) => product.categoryId === category.id
          ).length,
        }))}
        subcategories={subcategories.map((subcategory) => ({
          id: subcategory.id,
          name: subcategory.name,
          categoryId: subcategory.categoryId,
        }))}
        shops={shops.map((shop) => ({
          id: shop.id,
          shopName: shop.shopName,
        }))}
        products={products.map((product) => ({
          id: product.id,
          productCode: product.productCode,
          productName: product.productName,
          categoryId: product.categoryId,
          categoryName: product.category.name,
          subcategoryId: product.subcategoryId,
          shopId: product.shopId,
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
