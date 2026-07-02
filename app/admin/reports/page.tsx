import Link from "next/link";
import {
  CalendarDays,
  Package,
  RefreshCcw,
  Store,
  TrendingUp,
  Users,
} from "lucide-react";

import { ReportsExportButton } from "@/features/reports/components/ReportsExportButton";
import { activeProductWhere } from "@/lib/product-filters";
import { prisma } from "@/lib/prisma";

const numberFormatter = new Intl.NumberFormat("en-IN");
const currency = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  style: "currency",
});

type SearchParams = Record<string, string | string[] | undefined>;

function readParam(searchParams: SearchParams, key: string) {
  const value = searchParams[key];

  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function getDateRange(searchParams: SearchParams) {
  const date = readParam(searchParams, "date");
  const month = readParam(searchParams, "month");
  const year = readParam(searchParams, "year");

  if (date) {
    const start = new Date(`${date}T00:00:00.000+05:30`);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return {
      date,
      month,
      year,
      label: new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeZone: "Asia/Kolkata",
      }).format(start),
      where: {
        gte: start,
        lt: end,
      },
    };
  }

  if (month) {
    const [yearValue, monthValue] = month.split("-").map(Number);
    const isValidMonth =
      Number.isInteger(yearValue) &&
      Number.isInteger(monthValue) &&
      monthValue >= 1 &&
      monthValue <= 12;

    if (!isValidMonth) {
      return {
        date,
        month: "",
        year,
        label: "All time",
        where: undefined,
      };
    }

    const nextYear = monthValue === 12 ? yearValue + 1 : yearValue;
    const nextMonth = monthValue === 12 ? 1 : monthValue + 1;
    const start = new Date(
      `${yearValue}-${String(monthValue).padStart(2, "0")}-01T00:00:00.000+05:30`
    );
    const end = new Date(
      `${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00.000+05:30`
    );

    return {
      date,
      month,
      year,
      label: new Intl.DateTimeFormat("en-IN", {
        month: "long",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      }).format(start),
      where: {
        gte: start,
        lt: end,
      },
    };
  }

  if (year) {
    const yearValue = Number(year);

    if (!Number.isInteger(yearValue)) {
      return {
        date,
        month,
        year: "",
        label: "All time",
        where: undefined,
      };
    }

    const start = new Date(`${yearValue}-01-01T00:00:00.000+05:30`);
    const end = new Date(`${yearValue + 1}-01-01T00:00:00.000+05:30`);

    return {
      date,
      month,
      year,
      label: `${yearValue}`,
      where: {
        gte: start,
        lt: end,
      },
    };
  }

  return {
    date,
    month,
    year,
    label: "All time",
    where: undefined,
  };
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function makeFileName(label: string) {
  return `stock-report-${label.toLowerCase().replaceAll(" ", "-")}`;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const dateRange = getDateRange(params);
  const createdAtFilter = dateRange.where
    ? {
        createdAt: dateRange.where,
      }
    : {};

  const [
    shops,
    products,
    employees,
    sales,
    exchanges,
    totalStock,
  ] = await Promise.all([
    prisma.shop.findMany({
      where: createdAtFilter,
      include: {
        _count: {
          select: {
            products: true,
            sales: true,
            exchanges: true,
          },
        },
      },
      orderBy: {
        shopName: "asc",
      },
    }),
    prisma.product.findMany({
      where: {
        ...activeProductWhere,
        ...createdAtFilter,
      },
      include: {
        shop: true,
        category: true,
        subcategory: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.user.findMany({
      where: {
        role: "EMPLOYEE",
        ...createdAtFilter,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.sale.findMany({
      where: createdAtFilter,
      include: {
        employee: true,
        shop: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.exchange.findMany({
      where: createdAtFilter,
      include: {
        employee: true,
        shop: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.product.aggregate({
      where: {
        ...activeProductWhere,
        ...createdAtFilter,
      },
      _sum: {
        stock: true,
      },
    }),
  ]);

  const totalSalesAmount = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);
  const totalExchangeBalance = exchanges.reduce(
    (sum, exchange) => sum + exchange.cashBalance,
    0
  );
  const soldQuantity = sales.reduce((sum, sale) => sum + sale.quantity, 0);

  const saleByProduct = new Map<
    string,
    {
      productName: string;
      productCode: string;
      shopName: string;
      quantity: number;
      revenue: number;
      profit: number;
    }
  >();

  sales.forEach((sale) => {
    const existing = saleByProduct.get(sale.productId);

    saleByProduct.set(sale.productId, {
      productName: sale.productName,
      productCode: sale.productCode,
      shopName: sale.shop.shopName,
      quantity: (existing?.quantity ?? 0) + sale.quantity,
      revenue: (existing?.revenue ?? 0) + sale.totalAmount,
      profit: (existing?.profit ?? 0) + sale.profit,
    });
  });

  const highSaleProducts = Array.from(saleByProduct.values())
    .sort((first, second) => second.quantity - first.quantity)
    .slice(0, 6);

  const employeeActivity = new Map<
    string,
    {
      sales: number;
      saleAmount: number;
      exchanges: number;
    }
  >();

  sales.forEach((sale) => {
    const existing = employeeActivity.get(sale.employeeId);

    employeeActivity.set(sale.employeeId, {
      sales: (existing?.sales ?? 0) + 1,
      saleAmount: (existing?.saleAmount ?? 0) + sale.totalAmount,
      exchanges: existing?.exchanges ?? 0,
    });
  });

  exchanges.forEach((exchange) => {
    const existing = employeeActivity.get(exchange.employeeId);

    employeeActivity.set(exchange.employeeId, {
      sales: existing?.sales ?? 0,
      saleAmount: existing?.saleAmount ?? 0,
      exchanges: (existing?.exchanges ?? 0) + 1,
    });
  });

  const stats = [
    {
      label: "Total Shops",
      value: numberFormatter.format(shops.length),
      detail: "Shop records in this filter",
      icon: Store,
    },
    {
      label: "Total Products",
      value: numberFormatter.format(products.length),
      detail: `${numberFormatter.format(totalStock._sum.stock ?? 0)} stock units`,
      icon: Package,
    },
    {
      label: "High Sale Product",
      value: highSaleProducts[0]?.productName ?? "No sales",
      detail: highSaleProducts[0]
        ? `${numberFormatter.format(highSaleProducts[0].quantity)} units sold`
        : "No sales in this filter",
      icon: TrendingUp,
    },
    {
      label: "Employees",
      value: numberFormatter.format(employees.length),
      detail: "Employee accounts",
      icon: Users,
    },
    {
      label: "Exchanges",
      value: numberFormatter.format(exchanges.length),
      detail: `${currency.format(totalExchangeBalance)} cash balance`,
      icon: RefreshCcw,
    },
  ];

  const exportSheets = [
    {
      name: "Summary",
      rows: [
        {
          Filter: dateRange.label,
          Shops: shops.length,
          Products: products.length,
          Stock: totalStock._sum.stock ?? 0,
          Employees: employees.length,
          Sales: sales.length,
          "Sold Quantity": soldQuantity,
          Revenue: totalSalesAmount,
          Profit: totalProfit,
          Exchanges: exchanges.length,
          "Exchange Cash Balance": totalExchangeBalance,
        },
      ],
    },
    {
      name: "Shops",
      rows: shops.map((shop) => ({
        "Shop Name": shop.shopName,
        Code: shop.shopCode,
        Phone: shop.phone ?? "",
        Address: shop.address ?? "",
        Products: shop._count.products,
        Sales: shop._count.sales,
        Exchanges: shop._count.exchanges,
        Created: formatDate(shop.createdAt),
      })),
    },
    {
      name: "Products",
      rows: products.map((product) => ({
        Name: product.productName,
        Code: product.productCode,
        Shop: product.shop.shopName,
        Category: product.category.name,
        Brand: product.subcategory.name,
        Source:
          product.source === "EXCHANGE_THIRD_PARTY"
            ? "Exchange Third Party"
            : "Regular",
        Stock: product.stock,
        "Purchase Price": product.purchasePrice ?? 0,
        "Selling Price": product.price,
        Created: formatDate(product.createdAt),
      })),
    },
    {
      name: "High Sale Products",
      rows: highSaleProducts.map((product) => ({
        Product: product.productName,
        Code: product.productCode,
        Shop: product.shopName,
        Quantity: product.quantity,
        Revenue: product.revenue,
        Profit: product.profit,
      })),
    },
    {
      name: "Employees",
      rows: employees.map((employee) => {
        const activity = employeeActivity.get(employee.id);

        return {
          Name: employee.name,
          Email: employee.email,
          Sales: activity?.sales ?? 0,
          "Sale Amount": activity?.saleAmount ?? 0,
          Exchanges: activity?.exchanges ?? 0,
          Created: formatDate(employee.createdAt),
        };
      }),
    },
    {
      name: "Exchanges",
      rows: exchanges.map((exchange) => ({
        Date: formatDate(exchange.createdAt),
        Employee: exchange.employee.name,
        Shop: exchange.shop.shopName,
        "Sold Product": exchange.soldProductName,
        "Sold Price": exchange.soldProductPrice,
        "Received Product": exchange.receivedProductName,
        "Received Price": exchange.receivedProductPrice,
        "Exchange Value": exchange.exchangeValue,
        "Cash Balance": exchange.cashBalance,
        "Payment Method": exchange.paymentMethod ?? "CASH",
      })),
    },
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-[24px] border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-950 text-white">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">
                Reports overview
              </p>
              <h1 className="text-3xl font-semibold">Reports</h1>
            </div>
          </div>

          <ReportsExportButton
            fileName={makeFileName(dateRange.label)}
            sheets={exportSheets}
          />
        </div>

        <form className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto_auto]">
          <div>
            <label
              htmlFor="date"
              className="mb-2 block text-sm font-medium text-zinc-700"
            >
              Date
            </label>
            <input
              id="date"
              name="date"
              type="date"
              defaultValue={dateRange.date}
              className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-950"
            />
          </div>

          <div>
            <label
              htmlFor="month"
              className="mb-2 block text-sm font-medium text-zinc-700"
            >
              Month
            </label>
            <input
              id="month"
              name="month"
              type="month"
              defaultValue={dateRange.month}
              className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-950"
            />
          </div>

          <div>
            <label
              htmlFor="year"
              className="mb-2 block text-sm font-medium text-zinc-700"
            >
              Year
            </label>
            <input
              id="year"
              name="year"
              type="number"
              min="2000"
              max="2100"
              placeholder="2026"
              defaultValue={dateRange.year}
              className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-950"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Apply Filter
            </button>
          </div>

          <div className="flex items-end">
            <Link
              href="/admin/reports"
              className="inline-flex w-full items-center justify-center rounded-full border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
            >
              Clear
            </Link>
          </div>
        </form>

        <p className="mt-4 text-sm text-zinc-500">
          Showing report data for <span className="font-semibold text-zinc-950">{dateRange.label}</span>.
          Date filter has first priority, then month, then year.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-[24px] border border-zinc-200 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-zinc-500">{stat.label}</p>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-5 break-words text-2xl font-semibold">
                {stat.value}
              </p>
              <p className="mt-2 text-sm text-zinc-500">{stat.detail}</p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ReportCard title="Shop Details" subtitle={`${shops.length} shops`}>
          <DataTable
            emptyText="No shops found for this filter."
            headers={["Shop", "Code", "Phone", "Products", "Sales", "Exchanges"]}
            rows={shops.map((shop) => [
              shop.shopName,
              shop.shopCode,
              shop.phone || "Not added",
              numberFormatter.format(shop._count.products),
              numberFormatter.format(shop._count.sales),
              numberFormatter.format(shop._count.exchanges),
            ])}
          />
        </ReportCard>

        <ReportCard
          title="High Sale Products"
          subtitle={`${highSaleProducts.length} ranked products`}
        >
          <DataTable
            emptyText="No sale records found for this filter."
            headers={["Product", "Code", "Qty", "Revenue", "Profit"]}
            rows={highSaleProducts.map((product) => [
              product.productName,
              product.productCode,
              numberFormatter.format(product.quantity),
              currency.format(product.revenue),
              currency.format(product.profit),
            ])}
          />
        </ReportCard>
      </section>

      <ReportCard title="Total Products List" subtitle={`${products.length} products`}>
        <DataTable
          emptyText="No products found for this filter."
          headers={["Product", "Code", "Shop", "Category", "Brand", "Stock", "Price"]}
          rows={products.map((product) => [
            product.productName,
            product.productCode,
            product.shop.shopName,
            product.category.name,
            product.subcategory.name,
            numberFormatter.format(product.stock),
            currency.format(product.price),
          ])}
        />
      </ReportCard>

      <section className="grid gap-4 xl:grid-cols-2">
        <ReportCard
          title="Employee Details"
          subtitle={`${employees.length} employees`}
        >
          <DataTable
            emptyText="No employees found for this filter."
            headers={["Employee", "Email", "Sales", "Sale Amount", "Exchanges"]}
            rows={employees.map((employee) => {
              const activity = employeeActivity.get(employee.id);

              return [
                employee.name,
                employee.email,
                numberFormatter.format(activity?.sales ?? 0),
                currency.format(activity?.saleAmount ?? 0),
                numberFormatter.format(activity?.exchanges ?? 0),
              ];
            })}
          />
        </ReportCard>

        <ReportCard
          title="Exchange Details"
          subtitle={`${exchanges.length} exchanges`}
        >
          <DataTable
            emptyText="No exchange records found for this filter."
            headers={["Date", "Employee", "Shop", "Sold", "Received", "Balance"]}
            rows={exchanges.map((exchange) => [
              formatDate(exchange.createdAt),
              exchange.employee.name,
              exchange.shop.shopName,
              exchange.soldProductName,
              exchange.receivedProductName,
              currency.format(exchange.cashBalance),
            ])}
          />
        </ReportCard>
      </section>

      <div className="flex justify-end">
        <ReportsExportButton
          fileName={makeFileName(dateRange.label)}
          sheets={exportSheets}
        />
      </div>
    </div>
  );
}

function ReportCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-5 py-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function DataTable({
  headers,
  rows,
  emptyText,
}: {
  headers: string[];
  rows: (string | number)[][];
  emptyText: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left">
        <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="px-5 py-4"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-zinc-100 text-sm">
          {rows.length > 0 ? (
            rows.map((row, index) => (
              <tr
                key={index}
                className="transition hover:bg-zinc-50"
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={`${index}-${cellIndex}`}
                    className="px-5 py-4 text-zinc-700"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={headers.length}
                className="px-5 py-12 text-center text-sm text-zinc-500"
              >
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
