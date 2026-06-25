import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  Package,
  RefreshCcw,
  ReceiptText,
  Store,
  Tags,
  TrendingUp,
  Users,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

const formatter = new Intl.NumberFormat("en-IN");

export default async function DashboardPage() {
  const [
    totalShops,
    totalProducts,
    totalEmployees,
    totalCategories,
    totalExchanges,
    totalStockResult,
    lowStockItems,
    shops,
    availableStockProducts,
  ] = await Promise.all([
    prisma.shop.count(),
    prisma.product.count(),
    prisma.user.count({
      where: {
        role: "EMPLOYEE",
      },
    }),
    prisma.category.count(),
    prisma.exchange.count(),
    prisma.product.aggregate({
      _sum: {
        stock: true,
      },
    }),
    prisma.product.findMany({
      where: {
        stock: {
          lte: 5,
        },
      },
      include: {
        shop: true,
      },
      orderBy: {
        stock: "asc",
      },
      take: 4,
    }),
    prisma.shop.findMany({
      orderBy: {
        shopName: "asc",
      },
      take: 6,
    }),
    prisma.product.findMany({
      include: {
        shop: true,
      },
      orderBy: {
        stock: "desc",
      },
      take: 6,
    }),
  ]);

  const totalStock = totalStockResult._sum.stock ?? 0;

  const stats = [
    {
      label: "Shops",
      value: formatter.format(totalShops),
      detail: "Active store locations",
      icon: Store,
    },
    {
      label: "Products",
      value: formatter.format(totalProducts),
      detail: "Items in catalog",
      icon: Package,
    },
    {
      label: "Stock Units",
      value: formatter.format(totalStock),
      detail: "Available inventory",
      icon: Boxes,
    },
    {
      label: "Employees",
      value: formatter.format(totalEmployees),
      detail: "Billing users",
      icon: Users,
    },
    {
      label: "Exchange",
      value: formatter.format(totalExchanges),
      detail: "Completed exchanges",
      icon: RefreshCcw,
    },
  ];

  const setupItems = [
    {
      label: "Create shop records",
      done: totalShops > 0,
    },
    {
      label: "Add product categories",
      done: totalCategories > 0,
    },
    {
      label: "Add products and stock",
      done: totalProducts > 0,
    },
    {
      label: "Invite billing employees",
      done: totalEmployees > 0,
    },
  ];
  const completedSetup = setupItems.filter((item) => item.done).length;
  const setupPercent = Math.round((completedSetup / setupItems.length) * 100);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white">
        <div className="grid gap-6 p-[10px] lg:grid-cols-[1fr_360px]">
          <div className="flex min-h-[280px] flex-col justify-between rounded-[24px] bg-zinc-950 p-7 text-white">
            <div>
              <p className="text-sm font-medium text-zinc-300">
                Welcome back
              </p>
              <h2 className="mt-3 max-w-2xl text-4xl font-semibold tracking-normal sm:text-5xl">
                Keep every shop stocked and every sale ready.
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-6 text-zinc-300">
                Track branches, products, category setup, employee access, and
                low-stock alerts from one admin workspace.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/admin/shops/create"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-zinc-950"
              >
                Add Shop
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/admin/products"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-3 text-sm font-semibold text-white"
              >
                Manage Products
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="rounded-[24px] bg-[#fff4bf] p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-600">
                  Setup progress
                </p>
                <p className="mt-2 text-5xl font-semibold">
                  {setupPercent}%
                </p>
              </div>
              <Tags className="h-8 w-8 text-zinc-800" />
            </div>

            <div className="mt-8 space-y-3">
              {setupItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-full bg-white/70 px-4 py-3 text-sm"
                >
                  <span>{item.label}</span>
                  <span
                    className={`h-3 w-3 rounded-full ${
                      item.done ? "bg-emerald-500" : "bg-zinc-300"
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-[24px] border border-zinc-200 bg-white p-6"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-500">
                  {stat.label}
                </p>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-5 text-4xl font-semibold">{stat.value}</p>
              <p className="mt-2 text-sm text-zinc-500">{stat.detail}</p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-[24px] border border-zinc-200 bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold">Shops</h3>
              <p className="mt-1 text-sm text-zinc-500">
                Active store list
              </p>
            </div>
            <Store className="h-7 w-7 text-zinc-700" />
          </div>

          <div className="mt-6 space-y-3">
            {shops.length > 0 ? (
              shops.map((shop) => (
                <div
                  key={shop.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-zinc-50 px-4 py-4"
                >
                  <div>
                    <p className="font-medium text-zinc-950">
                      {shop.shopName}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {shop.phone || "Phone not added"}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                    {shop.shopCode}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">
                No shops found.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[24px] border border-zinc-200 bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold">High sale products</h3>
              <p className="mt-1 text-sm text-zinc-500">
                Will use billing data
              </p>
            </div>
            <TrendingUp className="h-7 w-7 text-zinc-700" />
          </div>

          <div className="mt-6 rounded-2xl bg-zinc-50 px-4 py-8 text-center">
            <p className="text-sm font-medium text-zinc-950">
              Sales tracking comes next
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              After the billing phase, this card will rank products by quantity
              sold and revenue.
            </p>
          </div>
        </div>

        <div className="rounded-[24px] border border-zinc-200 bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold">Available stock</h3>
              <p className="mt-1 text-sm text-zinc-500">
                Product names with current units
              </p>
            </div>
            <Boxes className="h-7 w-7 text-zinc-700" />
          </div>

          <div className="mt-6 space-y-3">
            {availableStockProducts.length > 0 ? (
              availableStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-zinc-50 px-4 py-4"
                >
                  <div>
                    <p className="font-medium text-zinc-950">
                      {product.productName}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {product.shop.shopName}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      product.stock <= 5
                        ? "bg-amber-50 text-amber-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {product.stock} units
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">
                No products found.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="rounded-[24px] border border-zinc-200 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold">Inventory health</h3>
              <p className="mt-1 text-sm text-zinc-500">
                Products with five or fewer stock units need attention.
              </p>
            </div>
            <Link
              href="/admin/inventory"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium"
            >
              Open Inventory
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 grid gap-3">
            {lowStockItems.length > 0 ? (
              lowStockItems.map((product) => (
                <div
                  key={product.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-zinc-50 px-4 py-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{product.productName}</p>
                      <p className="text-sm text-zinc-500">
                        {product.shop.shopName} - {product.productCode}
                      </p>
                    </div>
                  </div>
                  <p className="rounded-full bg-white px-4 py-2 text-sm font-semibold">
                    {product.stock} left
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">
                No low-stock products found.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[24px] bg-zinc-950 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-semibold">Quick actions</h3>
              <p className="mt-1 text-sm text-zinc-400">
                Common admin tasks
              </p>
            </div>
            <ReceiptText className="h-7 w-7 text-[#ffdc5d]" />
          </div>

          <div className="mt-6 space-y-3">
            {[
              ["Add new shop", "/admin/shops/create"],
              ["Review categories", "/admin/categories"],
              ["Manage employees", "/admin/employees"],
              ["View reports", "/admin/reports"],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-4 text-sm font-medium hover:bg-white/15"
              >
                {label}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
