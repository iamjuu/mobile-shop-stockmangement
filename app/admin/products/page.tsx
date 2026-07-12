import { Package } from "lucide-react";
import { revalidatePath } from "next/cache";

import { CategoryService } from "@/features/categories/services/category.service";
import {
  ProductCreateForm,
  type ProductCreateState,
} from "@/features/products/components/ProductCreateForm";
import { ProductDirectory } from "@/features/products/components/ProductDirectory";
import { productSchema } from "@/features/products/schemas/product.schema";
import { ProductService } from "@/features/products/services/product.service";
import { ShopService } from "@/features/shops/services/shop.service";
import { SubCategoryService } from "@/features/subcategories/services/subcategory.service";
import {
  deleteCloudinaryAssets,
  uploadImageFile,
} from "@/lib/cloudinary";
import { archiveAndDeleteProduct } from "@/lib/product-archive";
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
  purchasePrice?: number | null;
  price: number;
  excludeProductId?: string;
}) {
  const matchingProducts = await prisma.product.findMany({
    where: {
      ...activeProductWhere,
      source: "REGULAR",
      shopId: data.shopId,
      categoryId: data.categoryId,
      subcategoryId: data.subcategoryId,
      purchasePrice: data.purchasePrice ?? null,
      price: data.price,
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

  async function createProduct(
    _state: ProductCreateState,
    formData: FormData
  ): Promise<ProductCreateState> {
    "use server";

    const shopIdValue = String(formData.get("shopId") ?? "");

    if (!shopIdValue || shopIdValue === "all") {
      return {
        ok: false,
        message: "Choose a shop before adding products.",
      };
    }

    const parsed = productSchema.safeParse({
      productName: formData.get("productName"),
      shopId: shopIdValue,
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

    const [
      category,
    ] = await Promise.all([
      prisma.category.findUnique({
        where: {
          id: parsed.data.categoryId,
        },
      }),
    ]);

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

    const targetShop = await prisma.shop.findFirst({
      where: {
        id: parsed.data.shopId,
      },
      select: {
        id: true,
      },
    });

    if (!targetShop) {
      return {
        ok: false,
        message: "Invalid shop.",
      };
    }

    if (category.shopId && category.shopId !== targetShop.id) {
      return {
        ok: false,
        message: "This category is not available for the selected shop.",
      };
    }

    const duplicateProduct = await findDuplicateRegularProduct({
      productName: parsed.data.productName,
      shopId: targetShop.id,
      categoryId: category.id,
      subcategoryId: targetSubcategory.id,
      purchasePrice: parsed.data.purchasePrice,
      price: parsed.data.price,
    });

    if (duplicateProduct) {
      return {
        ok: false,
        message: `This product already exists (${duplicateProduct.productCode}). Use Add Product to increase stock.`,
      };
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

      await service.create({
        ...parsed.data,
        productName: parsed.data.productName.trim().replace(/\s+/g, " "),
        shopId: targetShop.id,
        subcategoryId: targetSubcategory.id,
        imageUrl: mainImageUrl,
        mainImageUrl,
        galleryImageUrls,
        imeiNumber: parsed.data.imeiNumber,
      });
    } catch {
      await deleteCloudinaryAssets(
        uploadedImages.map((image) => image.publicId)
      );

      return {
        ok: false,
        message: "Product could not be created. Try again.",
      };
    }

    revalidatePath("/admin/products");
    revalidatePath("/admin/admin-dashboard");

    return {
      ok: true,
      message: "Product created successfully.",
    };
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
      purchasePrice: data.purchasePrice,
      price: data.price,
      excludeProductId: productId,
    });

    if (duplicateProduct) {
      return {
        ok: false,
        message: `Another product already has these details (${duplicateProduct.productCode}).`,
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

  async function deleteProduct(productId: string) {
    "use server";

    if (!productId) {
      return {
        ok: false,
        message: "Invalid product.",
      };
    }

    const result = await archiveAndDeleteProduct(productId);

    if (!result.ok) {
      return result;
    }

    revalidatePath("/admin/products");
    revalidatePath("/admin/product-catalog");
    revalidatePath("/admin/admin-dashboard");
    revalidatePath("/employee/billing");
    revalidatePath("/employee/product-catalog");

    return {
      ok: true,
      message: result.message,
    };
  }

  async function duplicateProduct(productId: string) {
    "use server";

    if (!productId) {
      return {
        ok: false,
        message: "Invalid product.",
      };
    }

    const product = await prisma.product.findFirst({
      where: {
        ...activeProductWhere,
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

    if ((product.source ?? "REGULAR") !== "REGULAR") {
      return {
        ok: false,
        message: "Only regular products can be added this way.",
      };
    }

    const updatedProduct = await prisma.product.update({
      where: {
        id: product.id,
      },
      data: {
        stock: {
          increment: 1,
        },
      },
      include: {
        shop: true,
        category: true,
        subcategory: true,
      },
    });

    revalidatePath("/admin/products");
    revalidatePath("/admin/admin-dashboard");
    revalidatePath("/employee/billing");
    revalidatePath("/employee/exchange");

    return {
      ok: true,
      message: "Product stock increased successfully.",
      product: {
        id: updatedProduct.id,
        productCode: updatedProduct.productCode,
        productName: updatedProduct.productName,
        source: updatedProduct.source ?? "REGULAR",
        categoryId: updatedProduct.categoryId,
        shopName: updatedProduct.shop.shopName,
        categoryName: updatedProduct.category.name,
        subcategoryId: updatedProduct.subcategoryId,
        subcategoryName: updatedProduct.subcategory.name,
        purchasePrice: updatedProduct.purchasePrice,
        price: updatedProduct.price,
        stock: updatedProduct.stock,
        mainImageUrl: updatedProduct.mainImageUrl ?? updatedProduct.imageUrl,
        galleryImageUrls: updatedProduct.galleryImageUrls,
        description: updatedProduct.description,
        createdAt: updatedProduct.createdAt,

      },
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
const directoryProducts = products.map((product) => ({
  id: product.id,
  productCode: product.productCode,
  productName: product.productName,
  source: product.source ?? "REGULAR",
  categoryId: product.categoryId,
  shopName: product.shop.shopName,
  categoryName: product.category.name,
  subcategoryId: product.subcategoryId,
  subcategoryName: product.subcategory.name,
  purchasePrice: product.purchasePrice,
  price: product.price,
  stock: product.stock,
  mainImageUrl: product.mainImageUrl ?? product.imageUrl,
  galleryImageUrls: product.galleryImageUrls,
  description: product.description,
  createdAt: product.createdAt, // add this
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
                Add Product
              </h1>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-zinc-500">
            Add products by selecting the shop first. Categories are filtered
            by the shop, and brands are filtered by the selected category.
          </p>

          <ProductCreateForm
            shops={formShops}
            categories={formCategories}
            subcategories={formSubcategories}
            action={createProduct}
          />
        </section>

        <ProductDirectory
          key={directoryProducts.map((product) => product.id).join("|")}
          products={directoryProducts}
          subcategories={formSubcategories}
          updateAction={updateProduct}
          deleteAction={deleteProduct}
          duplicateAction={duplicateProduct}
        />
      </div>
    </div>
  );
}
