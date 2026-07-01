import { Package } from "lucide-react";
import { revalidatePath } from "next/cache";

import { CategoryService } from "@/features/categories/services/category.service";
import { ProductCreateForm } from "@/features/products/components/ProductCreateForm";
import { ProductDirectory } from "@/features/products/components/ProductDirectory";
import { productSchema } from "@/features/products/schemas/product.schema";
import { ProductService } from "@/features/products/services/product.service";
import { generateProductCode } from "@/features/products/utils/product-code";
import { ShopService } from "@/features/shops/services/shop.service";
import { SubCategoryService } from "@/features/subcategories/services/subcategory.service";
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

    const shopIdValue = String(formData.get("shopId") ?? "");
    const parsed = productSchema.safeParse({
      productName: formData.get("productName"),
      shopId: shopIdValue === "all" ? shops[0]?.id ?? "" : shopIdValue,
      categoryId: formData.get("categoryId"),
      subcategoryId: formData.get("subcategoryId"),
      purchasePrice: formData.get("purchasePrice"),
      price: formData.get("price"),
      stock: formData.get("stock"),
      description: String(formData.get("description") ?? "").trim() || undefined,
      imeiNumber: String(formData.get("imeiNumber") ?? "").trim() || undefined,
    });

    if (!parsed.success) {
      return;
    }

    const mainImage = formData.get("mainImage");
    const galleryImages = formData
      .getAll("galleryImages")
      .filter(isUploadedFile);

    if (!isUploadedFile(mainImage) || !isValidImage(mainImage)) {
      return;
    }

    if (
      galleryImages.length > 3 ||
      galleryImages.some((file) => !isValidImage(file))
    ) {
      return;
    }

    const [
      category,
      subcategory,
    ] = await Promise.all([
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

    if (!category || !subcategory) {
      return;
    }

    if (subcategory.categoryId !== category.id) {
      return;
    }

    if (category.name.trim().toLowerCase() === "mobile" && !parsed.data.imeiNumber) {
      return;
    }

    if (shopIdValue === "all" && category.name.trim().toLowerCase() === "mobile") {
      return;
    }

    const allShops = await prisma.shop.findMany({
      select: {
        id: true,
      },
    });
    const targetShopIds =
      shopIdValue === "all"
        ? category.shopId
          ? [category.shopId]
          : allShops.map((shop) => shop.id)
        : [shopIdValue];

    if (targetShopIds.length === 0) {
      return;
    }

    const targetShops = await prisma.shop.findMany({
      where: {
        id: {
          in: targetShopIds,
        },
      },
      select: {
        id: true,
      },
    });

    if (targetShops.length !== targetShopIds.length) {
      return;
    }

    for (const targetShop of targetShops) {
      if (category.shopId && category.shopId !== targetShop.id) {
        return;
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

      await Promise.all(
        targetShops.map((targetShop) =>
          service.create({
            ...parsed.data,
            shopId: targetShop.id,
            imageUrl: mainImageUrl,
            mainImageUrl,
            galleryImageUrls,
            imeiNumber: parsed.data.imeiNumber,
          })
        )
      );
    } catch {
      await deleteCloudinaryAssets(
        uploadedImages.map((image) => image.publicId)
      );

      return;
    }

    revalidatePath("/admin/products");
    revalidatePath("/admin/admin-dashboard");
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

    const [
      saleCount,
      exchangeCount,
    ] = await Promise.all([
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

    if (saleCount > 0 || exchangeCount > 0) {
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
      await prisma.product.delete({
        where: {
          id: productId,
        },
      });
    }

    revalidatePath("/admin/products");
    revalidatePath("/admin/product-catalog");
    revalidatePath("/admin/admin-dashboard");
    revalidatePath("/employee/billing");
    revalidatePath("/employee/product-catalog");

    return {
      ok: true,
      message: "Product deleted successfully.",
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

    const newProduct = await prisma.product.create({
      data: {
        productCode: generateProductCode(),
        productName: product.productName,
        shopId: product.shopId,
        categoryId: product.categoryId,
        subcategoryId: product.subcategoryId,
        purchasePrice: product.purchasePrice,
        price: product.price,
        stock: 1,
        source: product.source ?? "REGULAR",
        imageUrl: product.imageUrl,
        mainImageUrl: product.mainImageUrl,
        galleryImageUrls: product.galleryImageUrls,
        imeiNumber: product.imeiNumber,
        description: product.description,
        qrCode: product.qrCode,
        barcode: product.barcode,
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
      message: "Product added successfully.",
      product: {
        id: newProduct.id,
        productCode: newProduct.productCode,
        productName: newProduct.productName,
        source: newProduct.source ?? "REGULAR",
        categoryId: newProduct.categoryId,
        shopName: newProduct.shop.shopName,
        categoryName: newProduct.category.name,
        subcategoryId: newProduct.subcategoryId,
        subcategoryName: newProduct.subcategory.name,
        purchasePrice: newProduct.purchasePrice,
        price: newProduct.price,
        stock: newProduct.stock,
        mainImageUrl: newProduct.mainImageUrl ?? newProduct.imageUrl,
        galleryImageUrls: newProduct.galleryImageUrls,
        description: newProduct.description,
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
