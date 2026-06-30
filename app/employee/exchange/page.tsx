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
const PROOF_TYPES = new Set(["AADHAAR", "LICENSE"]);

function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

function isValidImage(file: File) {
  return file.type.startsWith("image/") && file.size <= MAX_IMAGE_SIZE_BYTES;
}

function isOptionalValidImage(value: FormDataEntryValue | null) {
  return !isUploadedFile(value) || isValidImage(value);
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
      where: {
        deletedAt: null,
      },
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
    const employee = await prisma.user.findUnique({
      where: {
        id: employeeId,
      },
    });
    const shopId = String(formData.get("shopId") ?? "");
    const dealTypeValue = String(formData.get("dealType") ?? "EXCHANGE");
    const dealType = dealTypeValue === "MONEY" ? "MONEY" : "EXCHANGE";
    const soldProductId = String(formData.get("soldProductId") ?? "");
    const customerName = String(formData.get("customerName") ?? "").trim();
    const customerPhone = String(formData.get("customerPhone") ?? "").trim();
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
    const imeiNumber = String(formData.get("imeiNumber") ?? "").trim();
    const proofType = String(formData.get("proofType") ?? "");
    const receivedImage = formData.get("receivedImage");
    const deviceImageOne = formData.get("deviceImageOne");
    const deviceImageTwo = formData.get("deviceImageTwo");
    const proofFront = formData.get("proofFront");
    const proofBack = formData.get("proofBack");

    if (
      !employee ||
      !shopId ||
      (dealType === "EXCHANGE" && !soldProductId) ||
      customerName.length < 2 ||
      customerPhone.length < 5 ||
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

    if (!isUploadedFile(deviceImageOne) || !isValidImage(deviceImageOne)) {
      return {
        success: false,
        message: "Device image 1 is required and must be under 2 MB.",
      };
    }

    if (!isOptionalValidImage(deviceImageTwo)) {
      return {
        success: false,
        message: "Device image 2 must be an image under 2 MB.",
      };
    }

    if (
      !PROOF_TYPES.has(proofType) ||
      !isUploadedFile(proofFront) ||
      !isUploadedFile(proofBack) ||
      !isValidImage(proofFront) ||
      !isValidImage(proofBack)
    ) {
      return {
        success: false,
        message: "Proof type, front image, and back image are required.",
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

    const uploadedImages: Array<{
      secureUrl: string;
      publicId: string;
    }> = [];

    try {
      const uploadedImage = await uploadImageFile(
        receivedImage,
        "stock-management/exchanges"
      );
      uploadedImages.push(uploadedImage);

      const uploadedDeviceImageOne = await uploadImageFile(
        deviceImageOne,
        "stock-management/exchanges"
      );
      uploadedImages.push(uploadedDeviceImageOne);

      const uploadedDeviceImageTwo = isUploadedFile(deviceImageTwo)
        ? await uploadImageFile(deviceImageTwo, "stock-management/exchanges")
        : null;

      if (uploadedDeviceImageTwo) {
        uploadedImages.push(uploadedDeviceImageTwo);
      }

      const uploadedProofFront = await uploadImageFile(
        proofFront,
        "stock-management/exchange-proofs"
      );
      uploadedImages.push(uploadedProofFront);

      const uploadedProofBack = await uploadImageFile(
        proofBack,
        "stock-management/exchange-proofs"
      );
      uploadedImages.push(uploadedProofBack);

      await prisma.$transaction(async (tx) => {
        let soldProduct:
          | {
              id: string;
              productCode: string;
              productName: string;
              price: number;
              stock: number;
              shopId: string;
            }
          | null = null;

        if (dealType === "EXCHANGE") {
          soldProduct = await tx.product.findUnique({
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
        }

        let categoryId = categoryIdValue;
        let categoryName = "";

        if (categoryMode === "new") {
          const category = await tx.category.create({
            data: {
              name: newCategoryName,
              shopId,
            },
          });

          categoryId = category.id;
          categoryName = category.name;
        } else {
          const category = await tx.category.findUnique({
            where: {
              id: categoryId,
            },
          });

          if (!category || (category.shopId && category.shopId !== shopId)) {
            throw new Error("INVALID_CATEGORY");
          }

          categoryName = category.name;
        }

        if (categoryName.trim().toLowerCase() === "mobile" && !imeiNumber) {
          throw new Error("MISSING_IMEI");
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
            galleryImageUrls: [
              uploadedDeviceImageOne.secureUrl,
              ...(uploadedDeviceImageTwo
                ? [uploadedDeviceImageTwo.secureUrl]
                : []),
            ],
            imeiNumber: imeiNumber || null,
            description: notes || condition || null,
          },
        });

        let exchangeId: string | null = null;

        if (dealType === "EXCHANGE" && soldProduct) {
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

          const exchange = await tx.exchange.create({
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
              receivedProductImeiNumber: imeiNumber || null,
              proofType,
              proofFrontImageUrl: uploadedProofFront.secureUrl,
              proofBackImageUrl: uploadedProofBack.secureUrl,
              proofFrontPublicId: uploadedProofFront.publicId,
              proofBackPublicId: uploadedProofBack.publicId,
              condition: condition || null,
              notes: notes || null,
            },
          });

          exchangeId = exchange.id;
        }

        const shop = await tx.shop.findUnique({
          where: {
            id: shopId,
          },
        });

        if (!shop) {
          throw new Error("INVALID_SHOP");
        }

        await tx.customer.create({
          data: {
            customerName,
            phone: customerPhone,
            type: dealType,
            employeeId,
            employeeName: employee.name,
            employeeEmail: employee.email,
            shopId,
            shopName: shop.shopName,
            receivedProductId: receivedProduct.id,
            receivedProductCode,
            receivedProductName,
            exchangeId,
            amount: exchangeValue,
            resalePrice: receivedPrice,
            imeiNumber: imeiNumber || null,
            proofType,
            proofFrontImageUrl: uploadedProofFront.secureUrl,
            proofBackImageUrl: uploadedProofBack.secureUrl,
          },
        });
      });
    } catch {
      await deleteCloudinaryAssets(
        uploadedImages.map((image) => image.publicId)
      );

      return {
        success: false,
        message: "Exchange could not be completed. Check stock and category details.",
      };
    }

    revalidatePath("/employee/exchange");
    revalidatePath("/employee/exchange-history");
    revalidatePath("/employee/users");
    revalidatePath("/employee/dashboard");
    revalidatePath("/admin/products");
    revalidatePath("/admin/exchanges");
    revalidatePath("/admin/users");
    revalidatePath("/admin/admin-dashboard");

    return {
      success: true,
      message:
        dealType === "MONEY"
          ? "Money user saved successfully."
          : "Exchange completed successfully.",
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
