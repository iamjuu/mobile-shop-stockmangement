import { revalidatePath } from "next/cache";

import { CategoryService } from "@/features/categories/services/category.service";
import {
  ProductCreateForm,
  type ProductCreateState,
} from "@/features/products/components/ProductCreateForm";
import { productSchema } from "@/features/products/schemas/product.schema";
import { ProductService } from "@/features/products/services/product.service";
import { ShopService } from "@/features/shops/services/shop.service";
import { SubCategoryService } from "@/features/subcategories/services/subcategory.service";
import {
  deleteCloudinaryAssets,
  uploadImageFile,
} from "@/lib/cloudinary";
import { activeProductWhere } from "@/lib/product-filters";
import { prisma } from "@/lib/prisma";

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

function isValidImage(file: File) {
  return file.type.startsWith("image/") && file.size <= MAX_IMAGE_SIZE_BYTES;
}

function normalizeProductName(productName: string) {
  return productName.trim().replace(/\s+/g, " ").toLowerCase();
}

async function findDuplicateRegularProduct(data: {
  productName: string;
  shopId: string;
  categoryId: string;
  subcategoryId: string;
  excludeProductId?: string;
}) {
  const matchingProducts = await prisma.product.findMany({
    where: {
      ...activeProductWhere,
      source: "REGULAR",
      shopId: data.shopId,
      categoryId: data.categoryId,
      subcategoryId: data.subcategoryId,
      ...(data.excludeProductId
        ? {
            NOT: {
              id: data.excludeProductId,
            },
          }
        : {}),
    },
    select: {
      id: true,
      productName: true,
      productCode: true,
    },
  });
  const normalizedProductName = normalizeProductName(data.productName);

  return (
    matchingProducts.find(
      (product) => normalizeProductName(product.productName) === normalizedProductName,
    ) ?? null
  );
}

export default async function ProductsPage() {
  const shopService = new ShopService();
  const categoryService = new CategoryService();
  const subCategoryService = new SubCategoryService();

  const [
    shops,
    categories,
    subcategories,
  ] = await Promise.all([
    shopService.getAll(),
    categoryService.getAll(),
    subCategoryService.getAll(),
  ]);

  async function createProduct(
    _state: ProductCreateState,
    formData: FormData
  ): Promise<ProductCreateState> {
    "use server";

    const selectedShopIds = Array.from(
      new Set(
        formData
          .getAll("shopIds")
          .map((shopId) => String(shopId))
          .filter(Boolean)
      )
    );
    const primaryShopId = selectedShopIds[0] ?? "";

    if (selectedShopIds.length === 0) {
      return {
        ok: false,
        message: "Choose at least one shop before adding products.",
      };
    }

    const parsed = productSchema.safeParse({
      productName: formData.get("productName"),
      shopId: primaryShopId,
      categoryId: formData.get("categoryId"),
      subcategoryId: formData.get("subcategoryId"),
      purchasePrice: formData.get("purchasePrice"),
      price: formData.get("price"),
      stock: formData.get("stock"),
      description: String(formData.get("description") ?? "").trim() || undefined,
      imeiNumber: String(formData.get("imeiNumber") ?? "").trim() || undefined,
    });

    if (!parsed.success) {
      return {
        ok: false,
        message: "Invalid product details.",
      };
    }

    const mainImage = formData.get("mainImage");
    const galleryImages = formData
      .getAll("galleryImages")
      .filter(isUploadedFile);

    if (!isUploadedFile(mainImage) || !isValidImage(mainImage)) {
      return {
        ok: false,
        message: "Upload a valid main image under 2 MB.",
      };
    }

    if (
      galleryImages.length > 3 ||
      galleryImages.some((file) => !isValidImage(file))
    ) {
      return {
        ok: false,
        message: "Optional images must be images under 2 MB, maximum 3.",
      };
    }

    const category = await prisma.category.findUnique({
      where: {
        id: parsed.data.categoryId,
      },
      select: {
        id: true,
        name: true,
        shopId: true,
      },
    });

    if (!category) {
      return {
        ok: false,
        message: "Invalid category.",
      };
    }

    const targetSubcategory = await prisma.subCategory.findFirst({
      where: {
        id: parsed.data.subcategoryId,
        categoryId: category.id,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!targetSubcategory) {
      return {
        ok: false,
        message: "Invalid brand for this category.",
      };
    }

    if (category.name.trim().toLowerCase() === "mobile" && !parsed.data.imeiNumber) {
      return {
        ok: false,
        message: "IMEI number is required for mobile products.",
      };
    }

    const targetShops = await prisma.shop.findMany({
      where: {
        id: {
          in: selectedShopIds,
        },
      },
      select: {
        id: true,
        shopName: true,
      },
    });

    if (targetShops.length !== selectedShopIds.length) {
      return {
        ok: false,
        message: "One or more selected shops are invalid.",
      };
    }

    if (selectedShopIds.length > 1 && category.shopId) {
      return {
        ok: false,
        message: "Choose an All shops category when adding to multiple shops.",
      };
    }

    if (category.shopId && category.shopId !== primaryShopId) {
      return {
        ok: false,
        message: "This category is not available for the selected shop.",
      };
    }

    for (const targetShop of targetShops) {
      const duplicateProduct = await findDuplicateRegularProduct({
        productName: parsed.data.productName,
        shopId: targetShop.id,
        categoryId: category.id,
        subcategoryId: targetSubcategory.id,
      });

      if (duplicateProduct) {
        return {
          ok: false,
          message: `This product already exists in ${targetShop.shopName} (${duplicateProduct.productCode}). Change the existing product instead of creating another price.`,
        };
      }
    }

    const service = new ProductService();
    const uploadedImages: Array<{
      secureUrl: string;
      publicId: string;
    }> = [];

    try {
      const mainImageUpload = await uploadImageFile(
        mainImage,
        "stock-management/products"
      );
      uploadedImages.push(mainImageUpload);

      for (const galleryImage of galleryImages) {
        const galleryImageUpload = await uploadImageFile(
          galleryImage,
          "stock-management/products"
        );

        uploadedImages.push(galleryImageUpload);
      }

      const mainImageUrl = mainImageUpload.secureUrl;
      const galleryImageUrls = uploadedImages
        .slice(1)
        .map((image) => image.secureUrl);

      const createdProducts = await Promise.all(
        targetShops.map((targetShop) =>
          service.create({
            ...parsed.data,
            productName: parsed.data.productName.trim().replace(/\s+/g, " "),
            shopId: targetShop.id,
            subcategoryId: targetSubcategory.id,
            imageUrl: mainImageUrl,
            mainImageUrl,
            galleryImageUrls,
            imeiNumber: parsed.data.imeiNumber,
          })
        )
      );
      const createdProduct = createdProducts[0];
      const primaryShop =
        targetShops.find((shop) => shop.id === createdProduct.shopId) ??
        targetShops[0];

      revalidatePath("/admin/products");
      revalidatePath("/admin/admin-dashboard");

      return {
        ok: true,
        message:
          createdProducts.length === 1
            ? "Product created successfully."
            : `${createdProducts.length} products created successfully.`,
        product: {
          id: createdProduct.id,
          productCode: createdProduct.productCode,
          productName: createdProduct.productName,
          categoryId: createdProduct.categoryId,
          shopName:
            createdProducts.length === 1
              ? primaryShop.shopName
              : `${primaryShop.shopName} +${createdProducts.length - 1}`,
          categoryName: category.name,
          subcategoryId: createdProduct.subcategoryId,
          subcategoryName: targetSubcategory.name,
          purchasePrice: createdProduct.purchasePrice,
          price: createdProduct.price,
          stock: createdProduct.stock,
          mainImageUrl: createdProduct.mainImageUrl ?? createdProduct.imageUrl,
          galleryImageUrls: createdProduct.galleryImageUrls,
          description: createdProduct.description,
          createdAt: createdProduct.createdAt.toISOString(),
        },
      };
    } catch {
      await deleteCloudinaryAssets(
        uploadedImages.map((image) => image.publicId)
      );

      return {
        ok: false,
        message: "Product could not be created. Try again.",
      };
    }
  }

  async function updateProduct(
    productId: string,
    data: {
      productName: string;
      subcategoryId: string;
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
          shopId: true,
          categoryId: true,
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
      !subcategory ||
      subcategory.categoryId !== product.categoryId
    ) {
      return {
        ok: false,
        message: "Invalid brand for this product category.",
      };
    }

    const duplicateProduct = await findDuplicateRegularProduct({
      productName,
      shopId: product.shopId,
      categoryId: product.categoryId,
      subcategoryId: data.subcategoryId,
      excludeProductId: productId,
    });

    if (duplicateProduct) {
      return {
        ok: false,
        message: `Another product already has this name, shop, category, and brand (${duplicateProduct.productCode}).`,
      };
    }

    await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        productName,
        subcategoryId: data.subcategoryId,
        purchasePrice: data.purchasePrice,
        price: data.price,
        stock: Math.trunc(data.stock),
        description: data.description?.trim() || null,
      },
    });

    revalidatePath("/admin/products");
    revalidatePath("/admin/admin-dashboard");
    revalidatePath("/employee/billing");

    return {
      ok: true,
      message: "Product updated successfully.",
    };
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

  return (
    <div className="space-y-5">
      <ProductCreateForm
        shops={formShops}
        categories={formCategories}
        subcategories={formSubcategories}
        action={createProduct}
        updateAction={updateProduct}
      />
    </div>
  );
}
