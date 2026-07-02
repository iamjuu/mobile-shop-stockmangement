import { prisma } from "@/lib/prisma";

export async function archiveAndDeleteProduct(productId: string) {
  const product = await prisma.product.findUnique({
    where: {
      id: productId,
    },
    include: {
      shop: true,
      category: true,
      subcategory: true,
    },
  });

  if (!product) {
    return {
      ok: false,
      message: "Product not found.",
    };
  }

  const [saleCount, exchangeCount] = await Promise.all([
    prisma.sale.count({
      where: {
        productId,
      },
    }),
    prisma.exchange.count({
      where: {
        OR: [
          {
            soldProductId: productId,
          },
          {
            receivedProductId: productId,
          },
        ],
      },
    }),
  ]);

  const deletedAt = new Date();
  const archiveData = {
    originalProductId: product.id,
    productCode: product.productCode,
    productName: product.productName,
    shopId: product.shopId,
    shopName: product.shop.shopName,
    categoryId: product.categoryId,
    categoryName: product.category.name,
    subcategoryId: product.subcategoryId,
    subcategoryName: product.subcategory.name,
    purchasePrice: product.purchasePrice,
    price: product.price,
    stock: product.stock,
    source: product.source ?? "REGULAR",
    imageUrl: product.imageUrl,
    mainImageUrl: product.mainImageUrl,
    galleryImageUrls: product.galleryImageUrls,
    imeiNumber: product.imeiNumber,
    description: product.description,
    qrCode: product.qrCode,
    barcode: product.barcode,
    saleCount,
    exchangeCount,
    productCreatedAt: product.createdAt.toISOString(),
    productUpdatedAt: product.updatedAt.toISOString(),
    deletedAt: deletedAt.toISOString(),
  };

  await prisma.$transaction([
    prisma.$runCommandRaw({
      update: "ProductHistory",
      updates: [
        {
          q: {
            originalProductId: product.id,
          },
          u: {
            $set: archiveData,
            $setOnInsert: {
              createdAt: deletedAt.toISOString(),
            },
          },
          upsert: true,
        },
      ],
    }),
    prisma.$runCommandRaw({
      delete: "Product",
      deletes: [
        {
          q: {
            _id: {
              $oid: product.id,
            },
          },
          limit: 1,
        },
      ],
    }),
  ]);

  return {
    ok: true,
    message: "Product moved to history successfully.",
  };
}
