import { revalidatePath } from "next/cache";

import { EmployeeBillingClient } from "@/features/products/components/EmployeeBillingClient";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function BillingPage() {
  const [
    shops,
    products,
  ] = await Promise.all([
    prisma.shop.findMany({
      orderBy: {
        shopName: "asc",
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

  async function sellProduct(formData: FormData) {
    "use server";

    const employeeId = await getCurrentUserId();
    const productId = String(formData.get("productId") ?? "");
    const quantity = Math.trunc(Number(formData.get("quantity") ?? 0));
    const discount = Math.max(0, Number(formData.get("discount") ?? 0) || 0);
    const proofNumber = String(formData.get("proofNumber") ?? "").trim();

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      include: {
        shop: true,
      },
    });
    const subtotal = product ? product.price * quantity : 0;

    if (
      !product ||
      quantity < 1 ||
      product.stock < quantity ||
      discount > subtotal
    ) {
      return {
        success: false,
      };
    }

    const purchasePrice = product.purchasePrice ?? 0;
    const totalAmount = subtotal - discount;
    const profit = (product.price - purchasePrice) * quantity - discount;

    try {
      await prisma.$transaction([
        prisma.product.update({
          where: {
            id: product.id,
          },
          data: {
            stock: {
              decrement: quantity,
            },
          },
        }),
        prisma.sale.create({
          data: {
            employeeId,
            productId: product.id,
            shopId: product.shopId,
            productCode: product.productCode,
            productName: product.productName,
            quantity,
            unitPrice: product.price,
            purchasePrice,
            discount,
            totalAmount,
            profit,
            proofType: proofNumber || null,
          },
        }),
      ]);
    } catch {
      return {
        success: false,
      };
    }

    revalidatePath("/employee/billing");
    revalidatePath("/employee/dashboard");
    revalidatePath("/employee/sales-history");
    revalidatePath("/admin/admin-dashboard");

    return {
      success: true,
    };
  }

  const billingShops = shops.map((shop) => ({
    id: shop.id,
    shopName: shop.shopName,
  }));
  const billingProducts = products.map((product) => ({
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
    description: product.description,
  }));

  return (
    <EmployeeBillingClient
      shops={billingShops}
      products={billingProducts}
      saleAction={sellProduct}
    />
  );
}
