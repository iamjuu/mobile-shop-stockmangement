import { revalidatePath } from "next/cache";

import { EmployeeExchangeClient } from "@/features/products/components/EmployeeExchangeClient";
import { generateProductCode } from "@/features/products/utils/product-code";
import { getCurrentUserId } from "@/lib/auth";
import {
  deleteCloudinaryAssets,
  uploadImageFile,
} from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

function isValidImage(file: File) {
  return file.type.startsWith("image/") && file.size <= MAX_IMAGE_SIZE_BYTES;
}

export default async function ExchangePage() {
  const [
    shops,
    categories,
    subcategories,
    products,
  ] = await Promise.all([
    prisma.shop.findMany({
      orderBy: {
        shopName: "asc",
      },
    }),
    prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
    }),
    prisma.subCategory.findMany({
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

  async function createExchange(formData: FormData) {
    "use server";

    const employeeId = await getCurrentUserId();
    const shopId = String(formData.get("shopId") ?? "");
    const soldProductId = String(formData.get("soldProductId") ?? "");
    const receivedProductName = String(
      formData.get("receivedProductName") ?? ""
    ).trim();
    const categoryMode = String(formData.get("categoryMode") ?? "existing");
    const subcategoryMode = String(
      formData.get("subcategoryMode") ?? "existing"
    );
    const categoryIdValue = String(formData.get("categoryId") ?? "");
    const subcategoryIdValue = String(formData.get("subcategoryId") ?? "");
    const newCategoryName = String(formData.get("newCategoryName") ?? "").trim();
    const newSubcategoryName = String(
      formData.get("newSubcategoryName") ?? ""
    ).trim();
    const exchangeValue = Number(formData.get("exchangeValue") ?? 0);
    const receivedPrice = Number(formData.get("receivedPrice") ?? 0);
    const paymentMethodValue = String(formData.get("paymentMethod") ?? "CASH");
    const paymentMethod = paymentMethodValue === "UPI" ? "UPI" : "CASH";
    const condition = String(formData.get("condition") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();
    const receivedImage = formData.get("receivedImage");

    if (
      !shopId ||
      !soldProductId ||
      receivedProductName.length < 2 ||
      exchangeValue < 0 ||
      receivedPrice < 0 ||
      !Number.isFinite(exchangeValue) ||
      !Number.isFinite(receivedPrice)
    ) {
      return {
        success: false,
        message: "Invalid exchange details.",
      };
    }

    if (!isUploadedFile(receivedImage) || !isValidImage(receivedImage)) {
      return {
        success: false,
        message: "Received phone image is required and must be under 2 MB.",
      };
    }

    if (categoryMode === "new" && newCategoryName.length < 2) {
      return {
        success: false,
        message: "Enter a valid category name.",
      };
    }

    if (subcategoryMode === "new" && newSubcategoryName.length < 2) {
      return {
        success: false,
        message: "Enter a valid brand name.",
      };
    }

    let imageUpload: {
      secureUrl: string;
      publicId: string;
    } | null = null;

    try {
      const uploadedImage = await uploadImageFile(
        receivedImage,
        "stock-management/exchanges"
      );
      imageUpload = uploadedImage;

      await prisma.$transaction(async (tx) => {
        const soldProduct = await tx.product.findUnique({
          where: {
            id: soldProductId,
          },
        });

        if (
          !soldProduct ||
          soldProduct.shopId !== shopId ||
          soldProduct.stock <= 0 ||
          exchangeValue > soldProduct.price
        ) {
          throw new Error("INVALID_SOLD_PRODUCT");
        }

        let categoryId = categoryIdValue;

        if (categoryMode === "new") {
          const category = await tx.category.create({
            data: {
              name: newCategoryName,
              shopId,
            },
          });

          categoryId = category.id;
        } else {
          const category = await tx.category.findUnique({
            where: {
              id: categoryId,
            },
          });

          if (!category || (category.shopId && category.shopId !== shopId)) {
            throw new Error("INVALID_CATEGORY");
          }
        }

        let subcategoryId = subcategoryIdValue;

        if (subcategoryMode === "new") {
          const subcategory = await tx.subCategory.create({
            data: {
              name: newSubcategoryName,
              categoryId,
            },
          });

          subcategoryId = subcategory.id;
        } else {
          const subcategory = await tx.subCategory.findUnique({
            where: {
              id: subcategoryId,
            },
          });

          if (!subcategory || subcategory.categoryId !== categoryId) {
            throw new Error("INVALID_SUBCATEGORY");
          }
        }

        const receivedProductCode = generateProductCode("EXC");
        const receivedProduct = await tx.product.create({
          data: {
            productCode: receivedProductCode,
            productName: receivedProductName,
            shopId,
            categoryId,
            subcategoryId,
            purchasePrice: exchangeValue,
            price: receivedPrice,
            stock: 1,
            source: "EXCHANGE_THIRD_PARTY",
            imageUrl: uploadedImage.secureUrl,
            mainImageUrl: uploadedImage.secureUrl,
            galleryImageUrls: [],
            description: notes || condition || null,
          },
        });

        await tx.product.update({
          where: {
            id: soldProduct.id,
          },
          data: {
            stock: {
              decrement: 1,
            },
          },
        });

        await tx.exchange.create({
          data: {
            employeeId,
            shopId,
            soldProductId: soldProduct.id,
            receivedProductId: receivedProduct.id,
            soldProductCode: soldProduct.productCode,
            soldProductName: soldProduct.productName,
            soldProductPrice: soldProduct.price,
            receivedProductCode,
            receivedProductName,
            receivedProductPrice: receivedPrice,
            exchangeValue,
            cashBalance: soldProduct.price - exchangeValue,
            paymentMethod,
            condition: condition || null,
            notes: notes || null,
          },
        });
      });
    } catch {
      if (imageUpload) {
        await deleteCloudinaryAssets([imageUpload.publicId]);
      }

      return {
        success: false,
        message: "Exchange could not be completed. Check stock and category details.",
      };
    }

    revalidatePath("/employee/exchange");
    revalidatePath("/employee/exchange-history");
    revalidatePath("/employee/dashboard");
    revalidatePath("/admin/products");
    revalidatePath("/admin/exchanges");
    revalidatePath("/admin/admin-dashboard");

    return {
      success: true,
      message: "Exchange completed successfully.",
    };
  }

  return (
    <EmployeeExchangeClient
      shops={shops.map((shop) => ({
        id: shop.id,
        shopName: shop.shopName,
      }))}
      categories={categories.map((category) => ({
        id: category.id,
        name: category.name,
        shopId: category.shopId,
      }))}
      subcategories={subcategories.map((subcategory) => ({
        id: subcategory.id,
        name: subcategory.name,
        categoryId: subcategory.categoryId,
      }))}
      products={products.map((product) => ({
        id: product.id,
        productCode: product.productCode,
        productName: product.productName,
        shopId: product.shopId,
        shopName: product.shop.shopName,
        categoryName: product.category.name,
        subcategoryName: product.subcategory.name,
        price: product.price,
        stock: product.stock,
        mainImageUrl: product.mainImageUrl ?? product.imageUrl,
      }))}
      action={createExchange}
    />
  );
}
