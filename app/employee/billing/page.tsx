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

  async function sellProduct(
    productId: string,
    quantity: number
  ) {
    "use server";

    const employeeId = await getCurrentUserId();
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      include: {
        shop: true,
      },
    });

    if (!product || quantity < 1 || product.stock < quantity) {
      return;
    }

    const purchasePrice = product.purchasePrice ?? 0;
    const totalAmount = product.price * quantity;
    const profit = (product.price - purchasePrice) * quantity;

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
          totalAmount,
          profit,
        },
      }),
    ]);

    revalidatePath("/employee/billing");
    revalidatePath("/employee/dashboard");
    revalidatePath("/employee/sales-history");
    revalidatePath("/admin/admin-dashboard");
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
