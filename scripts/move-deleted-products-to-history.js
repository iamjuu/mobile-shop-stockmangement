/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("node:fs");
const path = require("node:path");

const envPath = path.join(process.cwd(), ".env.local");

if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, "utf8");

  for (const line of envFile.split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, "");

    process.env[key] = process.env[key] ?? value;
  }
}

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const deletedProducts = await prisma.product.findMany({
    where: {
      deletedAt: {
        not: null,
      },
    },
    include: {
      shop: true,
      category: true,
      subcategory: true,
    },
  });

  if (deletedProducts.length === 0) {
    console.log("No deleted products found in Product collection.");
    return;
  }

  for (const product of deletedProducts) {
    const [saleCount, exchangeCount] = await Promise.all([
      prisma.sale.count({
        where: {
          productId: product.id,
        },
      }),
      prisma.exchange.count({
        where: {
          OR: [
            {
              soldProductId: product.id,
            },
            {
              receivedProductId: product.id,
            },
          ],
        },
      }),
    ]);

    const archivedAt = product.deletedAt ?? new Date();
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
      deletedAt: archivedAt.toISOString(),
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
                createdAt: new Date().toISOString(),
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

    console.log(
      `Moved ${product.productCode} (${product.productName}) to ProductHistory.`
    );
  }

  console.log(`Done. Moved ${deletedProducts.length} deleted product(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
