import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Store,
  Tags,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

const currency = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  style: "currency",
});

export default async function ShopDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    productsPage?: string | string[];
  }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const shop = await prisma.shop.findUnique({
    where: {
      id,
    },
    include: {
      products: {
        include: {
          category: true,
          subcategory: true,
        },
        orderBy: {
          productName: "asc",
        },
      },
      categories: {
        include: {
          subcategories: true,
        },
        orderBy: {
          name: "asc",
        },
      },
    },
  });

  if (!shop) {
    notFound();
  }

  const categorySummary = new Map<
    string,
    {
      name: string;
      products: number;
      stock: number;
      value: number;
    }
  >();
  const brandSummary = new Map<
    string,
    {
      name: string;
      categoryName: string;
      products: number;
      stock: number;
      value: number;
    }
  >();

  shop.products.forEach((product) => {
    const category = categorySummary.get(product.categoryId);

    categorySummary.set(product.categoryId, {
      name: product.category.name,
      products: (category?.products ?? 0) + 1,
      stock: (category?.stock ?? 0) + product.stock,
      value: (category?.value ?? 0) + product.price * product.stock,
    });

    const brand = brandSummary.get(product.subcategoryId);

    brandSummary.set(product.subcategoryId, {
      name: product.subcategory.name,
      categoryName: product.category.name,
      products: (brand?.products ?? 0) + 1,
      stock: (brand?.stock ?? 0) + product.stock,
      value: (brand?.value ?? 0) + product.price * product.stock,
    });
  });

  const totalStock = shop.products.reduce(
    (sum, product) => sum + product.stock,
    0
  );
  const productsPerPage = 7;
  const rawProductsPage = Array.isArray(query?.productsPage)
    ? query.productsPage[0]
    : query?.productsPage;
  const requestedProductsPage = Number.parseInt(rawProductsPage ?? "1", 10);
  const totalProductPages = Math.max(
    1,
    Math.ceil(shop.products.length / productsPerPage)
  );
  const currentProductsPage = Number.isFinite(requestedProductsPage)
    ? Math.min(Math.max(requestedProductsPage, 1), totalProductPages)
    : 1;
  const paginatedProducts = shop.products.slice(
    (currentProductsPage - 1) * productsPerPage,
    currentProductsPage * productsPerPage
  );
  const productPageHref = (page: number) =>
    `/admin/shops/${id}?productsPage=${page}`;

  return (
    <div className="space-y-5">
      <section className="rounded-[24px] border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-950 text-white">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">
                About this shop
              </p>
              <h1 className="text-3xl font-semibold">{shop.shopName}</h1>
            </div>
          </div>

          <Link
            href="/admin/shops"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Shops
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["Products", shop.products.length],
          ["Stock Units", totalStock],
          ["Categories", categorySummary.size],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-[24px] border border-zinc-200 bg-white p-5"
          >
            <p className="text-sm font-medium text-zinc-500">{label}</p>
            <p className="mt-3 text-3xl font-semibold">{value}</p>
          </div>
        ))}
      </section>

      <TableCard title="Shop details" subtitle="Branch information">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <tbody className="divide-y divide-zinc-100">
            {[
              ["Shop name", shop.shopName],
              ["Shop code", shop.shopCode],
              ["Phone", shop.phone || "Not added"],
              ["Address", shop.address || "Not added"],
              ["Description", shop.description || "Not added"],
            ].map(([label, value]) => (
              <tr key={label}>
                <th className="w-56 bg-zinc-50 px-5 py-4 font-semibold text-zinc-600">
                  {label}
                </th>
                <td className="px-5 py-4 font-medium text-zinc-950">
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      <TableCard
        title="Available products"
        subtitle="Products currently linked to this shop"
        icon={<Boxes className="h-5 w-5" />}
      >
        <table className="w-full min-w-[980px] border-collapse text-left">
          <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-5 py-4">Product</th>
              <th className="px-5 py-4">Category</th>
              <th className="px-5 py-4">Brand</th>
              <th className="px-5 py-4">Price</th>
              <th className="px-5 py-4">Stock</th>
              <th className="px-5 py-4">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 text-sm">
            {shop.products.length > 0 ? (
              paginatedProducts.map((product) => (
                <tr key={product.id} className="transition hover:bg-zinc-50">
                  <td className="px-5 py-4">
                    <p className="font-medium text-zinc-950">
                      {product.productName}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {product.productCode}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-zinc-700">
                    {product.category.name}
                  </td>
                  <td className="px-5 py-4 text-zinc-700">
                    {product.subcategory.name}
                  </td>
                  <td className="px-5 py-4 font-semibold">
                    {currency.format(product.price)}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        product.stock <= 0
                          ? "bg-red-50 text-red-700"
                          : product.stock <= 5
                          ? "bg-amber-50 text-amber-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {product.stock} units
                    </span>
                  </td>
                  <td className="px-5 py-4 text-zinc-700">
                    {product.source === "EXCHANGE_THIRD_PARTY"
                      ? "Exchange"
                      : "Regular"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center text-sm text-zinc-500"
                >
                  No products found for this shop.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {shop.products.length > productsPerPage ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 px-5 py-4 text-sm">
            <p className="text-zinc-500">
              Showing {(currentProductsPage - 1) * productsPerPage + 1}-
              {Math.min(
                currentProductsPage * productsPerPage,
                shop.products.length
              )}{" "}
              of {shop.products.length} products
            </p>
            <div className="flex items-center gap-2">
              <PaginationLink
                href={productPageHref(currentProductsPage - 1)}
                disabled={currentProductsPage === 1}
                label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </PaginationLink>
              {Array.from({ length: totalProductPages }).map((_, index) => {
                const page = index + 1;

                return (
                  <PaginationLink
                    key={page}
                    href={productPageHref(page)}
                    active={page === currentProductsPage}
                    label={`Page ${page}`}
                  >
                    {page}
                  </PaginationLink>
                );
              })}
              <PaginationLink
                href={productPageHref(currentProductsPage + 1)}
                disabled={currentProductsPage === totalProductPages}
                label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </PaginationLink>
            </div>
          </div>
        ) : null}
      </TableCard>

      <div className="grid gap-5 xl:grid-cols-2">
        <TableCard
          title="Category summary"
          subtitle="Available products by category"
          icon={<Tags className="h-5 w-5" />}
        >
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Added Product</th>
                <th className="px-5 py-4">Balance</th>
                <th className="px-5 py-4">Stock Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-sm">
              {Array.from(categorySummary.values()).map((category) => (
                <tr key={category.name}>
                  <td className="px-5 py-4 font-medium">{category.name}</td>
                  <td className="px-5 py-4">
                    <AddedProductCount count={category.products} />
                  </td>
                  <td className="px-5 py-4">
                    <SummaryBalance quantity={category.stock} />
                  </td>
                  <td className="px-5 py-4 font-semibold">
                    {currency.format(category.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>

        <TableCard
          title="Brand summary"
          subtitle="Brands available in this shop"
          icon={<Boxes className="h-5 w-5" />}
        >
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-5 py-4">Brand</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Added Product</th>
                <th className="px-5 py-4">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-sm">
              {Array.from(brandSummary.values()).map((brand) => (
                <tr key={`${brand.categoryName}-${brand.name}`}>
                  <td className="px-5 py-4 font-medium">{brand.name}</td>
                  <td className="px-5 py-4 text-zinc-700">
                    {brand.categoryName}
                  </td>
                  <td className="px-5 py-4">
                    <AddedProductCount count={brand.products} />
                  </td>
                  <td className="px-5 py-4">
                    <SummaryBalance quantity={brand.stock} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      </div>
    </div>
  );
}

function TableCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-zinc-200 bg-white">
      <div className="flex items-center justify-between gap-4 border-b border-zinc-200 px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
        </div>
        {icon ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-700">
            {icon}
          </div>
        ) : null}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

function SummaryBalance({ quantity }: { quantity: number }) {
  if (quantity <= 0) {
    return (
      <span className="font-semibold text-red-700">
        Out of stock
      </span>
    );
  }

  return <span>{quantity} units</span>;
}

function AddedProductCount({ count }: { count: number }) {
  return (
    <span>
      {count} {count === 1 ? "product" : "products"}
    </span>
  );
}

function PaginationLink({
  href,
  active = false,
  disabled = false,
  label,
  children,
}: {
  href: string;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const className = `inline-flex h-9 min-w-9 items-center justify-center rounded-full border px-3 font-semibold transition ${
    active
      ? "border-zinc-950 bg-zinc-950 text-white"
      : "border-zinc-300 text-zinc-700 hover:bg-zinc-50"
  } ${
    disabled
      ? "pointer-events-none border-zinc-200 text-zinc-300 hover:bg-transparent"
      : ""
  }`;

  if (disabled) {
    return (
      <span aria-label={label} className={className}>
        {children}
      </span>
    );
  }

  return (
    <Link href={href} aria-label={label} className={className}>
      {children}
    </Link>
  );
}
