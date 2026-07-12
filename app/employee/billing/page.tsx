import { revalidatePath } from "next/cache";

import { EmployeeBillingClient } from "@/features/products/components/EmployeeBillingClient";
import { getCurrentUserId } from "@/lib/auth";
import { activeProductWhere } from "@/lib/product-filters";
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
  ]);

  async function sellProduct(formData: FormData) {
    "use server";

    const employeeId = await getCurrentUserId();
    const productId = String(formData.get("productId") ?? "");
    const quantity = Math.trunc(Number(formData.get("quantity") ?? 0));
    const discount = Math.max(0, Number(formData.get("discount") ?? 0) || 0);
    const proofNumber = String(formData.get("proofNumber") ?? "").trim();

    const [employee, product] = await Promise.all([
      prisma.user.findUnique({
        where: {
          id: employeeId,
        },
      }),
      prisma.product.findUnique({
        where: {
          id: productId,
        },
        include: {
          shop: true,
          category: true,
          subcategory: true,
        },
      }),
    ]);
    const subtotal = product ? product.price * quantity : 0;

    if (
      !employee ||
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
      const [, sale] = await prisma.$transaction([
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

      revalidatePath("/employee/billing");
      revalidatePath("/employee/dashboard");
      revalidatePath("/employee/sales-history");
      revalidatePath("/admin/admin-dashboard");

      return {
        success: true,
        bill: {
          invoiceNo: sale.id,
          date: sale.createdAt.toISOString(),
          employeeName: employee.name,
          employeeEmail: employee.email,
          shopName: product.shop.shopName,
          shopCode: product.shop.shopCode,
          shopAddress: product.shop.address,
          shopPhone: product.shop.phone,
          productCode: product.productCode,
          productName: product.productName,
          categoryName: product.category.name,
          subcategoryName: product.subcategory.name,
          quantity,
          unitPrice: product.price,
          subtotal,
          discount,
          totalAmount,
          proofNumber: proofNumber || null,
        },
      };
    } catch {
      return {
        success: false,
      };
    }
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
    categoryId: product.categoryId,
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
