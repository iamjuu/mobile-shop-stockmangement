import { prisma } from "@/lib/prisma";

export default async function ProductPage({
  params,
}: {
  params: Promise<{
    productCode: string;
  }>;
}) {
  const { productCode } =
    await params;

  const product =
    await prisma.product.findUnique({
      where: {
        productCode,
      },
      include: {
        shop: true,
        category: true,
        subcategory: true,
      },
    });

  if (!product) {
    return (
      <div>
        Product not found
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-10">
      <h1 className="text-4xl font-bold">
        {product.productName}
      </h1>

      <p>
        Code:
        {product.productCode}
      </p>

      <p>
        Shop:
        {product.shop.shopName}
      </p>

      <p>
        Category:
        {product.category.name}
      </p>

      <p>
        Brand:
        {
          product.subcategory
            .name
        }
      </p>

      <p>
        ₹{product.price}
      </p>
    </div>
  );
}