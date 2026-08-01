import Link from "next/link";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const currency = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  maximumFractionDigits: 0,
  style: "currency",
});

const formatter = new Intl.NumberFormat("en-IN");
const pageSize = 5;

type SearchParams = Record<string, string | string[] | undefined>;
type ProfitTab =
  | "overview"
  | "normal"
  | "exchange"
  | "purchases"
  | "resale"
  | "services";
type PageInfo = {
  endItem: number;
  safePage: number;
  startItem: number;
  totalPages: number;
};
type SaleRow = Prisma.SaleGetPayload<{
  include: {
    employee: true;
    product: true;
    shop: true;
  };
}>;
type ExchangeRow = Prisma.ExchangeGetPayload<{
  include: {
    employee: true;
    receivedProduct: true;
    shop: true;
    soldProduct: true;
  };
}>;
type CustomerRow = Prisma.CustomerGetPayload<Record<string, never>>;
type ServiceRow = Prisma.ServiceComplaintGetPayload<Record<string, never>>;

const profitTabs: Array<{
  key: ProfitTab;
  title: string;
  description: string;
}> = [
  {
    key: "overview",
    title: "Overview",
    description: "All profit sources",
  },
  {
    key: "normal",
    title: "Normal sales",
    description: "New product sold for cash",
  },
  {
    key: "exchange",
    title: "Exchange",
    description: "New phone sold with old phone",
  },
  {
    key: "purchases",
    title: "Old phones bought",
    description: "Phones bought for resale",
  },
  {
    key: "resale",
    title: "Old phones sold",
    description: "Resale profit after selling",
  },
  {
    key: "services",
    title: "Services",
    description: "Repairs and custom service income",
  },
];

function readParam(searchParams: SearchParams, key: string) {
  const value = searchParams[key];

  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function readTab(value: string): ProfitTab {
  return profitTabs.some((tab) => tab.key === value)
    ? (value as ProfitTab)
    : "overview";
}

function makeProfitHref({
  page = 1,
  productId = "",
  tab,
}: {
  page?: number;
  productId?: string;
  tab: ProfitTab;
}) {
  const params = new URLSearchParams();

  if (tab !== "overview") {
    params.set("tab", tab);
  }

  if (productId && (tab === "normal" || tab === "resale")) {
    params.set("productId", productId);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return query ? `/admin/profit?${query}` : "/admin/profit";
}

function paginate<T>(rows: T[], page: number) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;

  return {
    endItem: rows.length === 0 ? 0 : Math.min(startIndex + pageSize, rows.length),
    rows: rows.slice(startIndex, startIndex + pageSize),
    safePage,
    startItem: rows.length === 0 ? 0 : startIndex + 1,
    totalPages,
  };
}

function sumBy<T>(rows: T[], getValue: (row: T) => number) {
  return rows.reduce((sum, row) => sum + getValue(row), 0);
}

function MoneyStat({
  label,
  tone = "default",
  value,
}: {
  label: string;
  tone?: "default" | "good" | "warn";
  value: number;
}) {
  const toneClass =
    tone === "good"
      ? "text-emerald-700"
      : tone === "warn"
        ? "text-amber-700"
        : "text-zinc-950";

  return (
    <div className="rounded-lg border border-zinc-200 p-4">
      <p className="text-xs font-medium uppercase text-zinc-500">{label}</p>
      <p className={`mt-2 text-xl font-semibold ${toneClass}`}>
        {currency.format(value)}
      </p>
    </div>
  );
}

function CountStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4">
      <p className="text-xs font-medium uppercase text-zinc-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-zinc-950">
        {formatter.format(value)}
      </p>
    </div>
  );
}

function Pagination({
  page,
  productId,
  tab,
  totalItems,
  totalPages,
}: {
  page: number;
  productId?: string;
  tab: ProfitTab;
  totalItems: number;
  totalPages: number;
}) {
  if (totalItems <= pageSize) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 px-5 py-4 text-sm">
      <p className="text-zinc-500">
        Page {formatter.format(page)} of {formatter.format(totalPages)}
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link
            href={makeProfitHref({
              page: page - 1,
              productId,
              tab,
            })}
            className="rounded-lg border border-zinc-300 px-4 py-2 font-medium text-zinc-800 hover:bg-zinc-50"
          >
            Previous
          </Link>
        ) : (
          <span className="rounded-lg border border-zinc-200 px-4 py-2 font-medium text-zinc-300">
            Previous
          </span>
        )}

        {page < totalPages ? (
          <Link
            href={makeProfitHref({
              page: page + 1,
              productId,
              tab,
            })}
            className="rounded-lg border border-zinc-300 px-4 py-2 font-medium text-zinc-800 hover:bg-zinc-50"
          >
            Next
          </Link>
        ) : (
          <span className="rounded-lg border border-zinc-200 px-4 py-2 font-medium text-zinc-300">
            Next
          </span>
        )}
      </div>
    </div>
  );
}

export default async function ProfitPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const activeTab = readTab(readParam(params, "tab"));
  const selectedProductId = readParam(params, "productId");
  const pageParam = Number(readParam(params, "page"));
  const currentPage =
    Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

  const [sales, exchanges, moneyCustomers, services] = await Promise.all([
    prisma.sale.findMany({
      include: {
        employee: true,
        product: true,
        shop: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.exchange.findMany({
      include: {
        employee: true,
        receivedProduct: true,
        shop: true,
        soldProduct: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.customer.findMany({
      where: {
        type: "MONEY",
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.serviceComplaint.findMany({
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  const productOptions = Array.from(
    sales
      .reduce((products, sale) => {
        if (!products.has(sale.productId)) {
          products.set(sale.productId, sale);
        }

        return products;
      }, new Map<string, (typeof sales)[number]>())
      .values()
  ).sort((first, second) => first.productName.localeCompare(second.productName));

  const selectedProduct = selectedProductId
    ? productOptions.find((product) => product.productId === selectedProductId)
    : null;
  const filteredSales = selectedProductId
    ? sales.filter((sale) => sale.productId === selectedProductId)
    : sales;
  const normalSales = filteredSales.filter(
    (sale) => sale.product?.source !== "EXCHANGE_THIRD_PARTY"
  );
  const resaleSales = filteredSales.filter(
    (sale) => sale.product?.source === "EXCHANGE_THIRD_PARTY"
  );

  const normalProfit = sumBy(normalSales, (sale) => sale.profit);
  const normalRevenue = sumBy(normalSales, (sale) => sale.totalAmount);
  const normalCost = sumBy(
    normalSales,
    (sale) => (sale.purchasePrice ?? 0) * sale.quantity
  );
  const normalDiscount = sumBy(normalSales, (sale) => sale.discount);
  const resaleProfit = sumBy(resaleSales, (sale) => sale.profit);
  const resaleRevenue = sumBy(resaleSales, (sale) => sale.totalAmount);
  const resaleCost = sumBy(
    resaleSales,
    (sale) => (sale.purchasePrice ?? 0) * sale.quantity
  );
  const exchangeSalesValue = sumBy(
    exchanges,
    (exchange) => exchange.soldProductPrice
  );
  const exchangeSoldCost = sumBy(
    exchanges,
    (exchange) => exchange.soldProduct?.purchasePrice ?? 0
  );
  const exchangeProfit = exchangeSalesValue - exchangeSoldCost;
  const exchangeCashReceived = sumBy(
    exchanges,
    (exchange) => exchange.cashBalance
  );
  const exchangeOldPhoneValue = sumBy(
    exchanges,
    (exchange) => exchange.exchangeValue
  );
  const purchaseInvestment = sumBy(
    moneyCustomers,
    (customer) => customer.amount
  );
  const serviceProfit = sumBy(services, (service) => service.servicePrice);
  const realizedProfit =
    normalProfit + exchangeProfit + resaleProfit + serviceProfit;

  const paginatedNormal = paginate(normalSales, currentPage);
  const paginatedExchange = paginate(exchanges, currentPage);
  const paginatedPurchases = paginate(moneyCustomers, currentPage);
  const paginatedResale = paginate(resaleSales, currentPage);
  const paginatedServices = paginate(services, currentPage);
  const selectedSales = activeTab === "resale" ? resaleSales : normalSales;
  const selectedPagination =
    activeTab === "exchange"
      ? paginatedExchange
      : activeTab === "purchases"
        ? paginatedPurchases
        : activeTab === "resale"
          ? paginatedResale
          : activeTab === "services"
            ? paginatedServices
            : paginatedNormal;

  return (
    <div className="space-y-5">
      <section className="rounded-[18px] border border-zinc-200 bg-white p-5">
        <p className="text-sm font-medium text-zinc-500">
          Complete profit report
        </p>
        <h1 className="mt-1 text-3xl font-semibold text-zinc-950">Profit</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600">
          Profit is split into confirmed sales, exchange deals, old phones sold
          again, and service income.
        </p>
      </section>

      <div className="grid gap-5 xl:grid-cols-[260px_1fr]">
        <aside className="rounded-[18px] border border-zinc-200 bg-white p-3 xl:sticky xl:top-5 xl:self-start">
          <nav className="space-y-2">
            {profitTabs.map((tab) => {
              const isActive = activeTab === tab.key;

              return (
                <Link
                  key={tab.key}
                  href={makeProfitHref({
                    productId: selectedProductId,
                    tab: tab.key,
                  })}
                  className={`block rounded-lg px-4 py-3 text-sm transition ${
                    isActive
                      ? "bg-zinc-950 text-white"
                      : "text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  <span className="font-semibold">{tab.title}</span>
                  <span
                    className={`mt-1 block text-xs ${
                      isActive ? "text-zinc-300" : "text-zinc-500"
                    }`}
                  >
                    {tab.description}
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="space-y-5">
          {(activeTab === "normal" || activeTab === "resale") && (
            <section className="rounded-[18px] border border-zinc-200 bg-white p-5">
              <form
                action="/admin/profit"
                className="flex flex-col gap-3 md:flex-row md:items-end"
              >
                <input type="hidden" name="tab" value={activeTab} />
                <input type="hidden" name="page" value="1" />
                <div className="flex-1">
                  <label
                    htmlFor="productId"
                    className="mb-2 block text-sm font-medium text-zinc-700"
                  >
                    Filter product
                  </label>
                  <select
                    id="productId"
                    name="productId"
                    defaultValue={selectedProductId}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-zinc-950"
                  >
                    <option value="">All products</option>
                    {productOptions.map((product) => (
                      <option key={product.productId} value={product.productId}>
                        {product.productName} ({product.productCode}) -
                        Purchase {currency.format(product.purchasePrice ?? 0)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="rounded-lg bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
                  >
                    Apply
                  </button>
                  {selectedProductId ? (
                    <Link
                      href={makeProfitHref({ tab: activeTab })}
                      className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-100"
                    >
                      Clear
                    </Link>
                  ) : null}
                </div>
              </form>
            </section>
          )}

          {activeTab === "overview" && (
            <section className="rounded-[18px] border border-zinc-200 bg-white p-5">
              <div>
                <p className="text-sm font-medium text-zinc-500">
                  Confirmed profit
                </p>
                <p className="mt-2 text-4xl font-semibold text-emerald-700">
                  {currency.format(realizedProfit)}
                </p>
                <p className="mt-3 text-sm text-zinc-600">
                  Confirmed profit means profit from phones already sold.
                </p>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <MoneyStat
                  label="Normal sale profit"
                  tone="good"
                  value={normalProfit}
                />
                <MoneyStat
                  label="Exchange profit"
                  tone="good"
                  value={exchangeProfit}
                />
                <MoneyStat
                  label="Old phone sale profit"
                  tone="good"
                  value={resaleProfit}
                />
                <MoneyStat
                  label="Service income"
                  tone="good"
                  value={serviceProfit}
                />
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <MoneyStat
                  label="Cash received in exchange"
                  value={exchangeCashReceived}
                />
                <MoneyStat
                  label="Old phone value"
                  value={exchangeOldPhoneValue}
                />
                <MoneyStat
                  label="Old phones bought cost"
                  value={purchaseInvestment}
                />
                <CountStat label="Services" value={services.length} />
              </div>

              <div className="mt-5 rounded-lg bg-zinc-50 px-4 py-3 text-sm leading-6 text-zinc-600">
                <p className="font-medium text-zinc-800">
                  Simple meaning:
                </p>
                <p className="mt-2">
                  Normal sale: customer pays cash for a new phone. Profit is
                  selling amount minus your cost.
                </p>
                <p>
                  Exchange: customer gives an old phone and some cash for a new
                  phone. Profit here is only for the new phone. The old phone
                  becomes stock.
                </p>
                <p>
                  Old phone sale: when that old phone is sold again, its profit
                  is counted in old phone sale profit.
                </p>
                <p>
                  Services: repair or custom service price is counted as service
                  income.
                </p>
              </div>
            </section>
          )}

          {activeTab === "normal" && (
            <>
              <section className="rounded-[18px] border border-zinc-200 bg-white p-5">
                <p className="text-sm font-medium text-zinc-500">
                  Showing normal sales for
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-zinc-950">
                  {selectedProduct
                    ? `${selectedProduct.productName} (${selectedProduct.productCode})`
                    : "All normal products"}
                </h2>
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <MoneyStat
                    label="Profit"
                    tone="good"
                    value={normalProfit}
                  />
                  <MoneyStat label="Customer paid" value={normalRevenue} />
                  <MoneyStat label="Your cost" value={normalCost} />
                  <MoneyStat label="Discount" value={normalDiscount} />
                  <CountStat label="Sales" value={normalSales.length} />
                </div>
                <div className="mt-4 rounded-lg bg-zinc-50 px-4 py-3 text-sm leading-6 text-zinc-600">
                  <p>
                    Simple meaning: customer paid is the final bill amount after
                    discount.
                  </p>
                  <p className="mt-2 font-medium text-zinc-800">
                    Example: selling price ₹20,000, your cost ₹15,000, discount
                    ₹1,000. Customer paid ₹19,000. Profit ₹4,000.
                  </p>
                  <p className="mt-2">
                    Formula: profit = customer paid - your cost.
                  </p>
                </div>
              </section>
              <SalesTable
                pageInfo={paginatedNormal}
                productId={selectedProductId}
                rows={paginatedNormal.rows}
                tab="normal"
                totalItems={normalSales.length}
              />
            </>
          )}

          {activeTab === "exchange" && (
            <>
              <section className="rounded-[18px] border border-zinc-200 bg-white p-5">
                <h2 className="text-2xl font-semibold text-zinc-950">
                  Exchange sales
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  Customer gives an old phone and pays some cash for a new
                  phone. This tab counts profit from the new phone only.
                </p>
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <MoneyStat
                    label="Profit"
                    tone="good"
                    value={exchangeProfit}
                  />
                  <MoneyStat
                    label="New phone selling price"
                    value={exchangeSalesValue}
                  />
                  <MoneyStat
                    label="New phone cost"
                    value={exchangeSoldCost}
                  />
                  <MoneyStat
                    label="Cash paid by customer"
                    value={exchangeCashReceived}
                  />
                  <MoneyStat
                    label="Old phone stock value"
                    value={exchangeOldPhoneValue}
                  />
                </div>
              </section>
              <ExchangeTable
                pageInfo={paginatedExchange}
                rows={paginatedExchange.rows}
                totalItems={exchanges.length}
              />
            </>
          )}

          {activeTab === "purchases" && (
            <>
              <section className="rounded-[18px] border border-zinc-200 bg-white p-5">
                <h2 className="text-2xl font-semibold text-zinc-950">
                  Old phones bought
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  These phones are stock. Cost is shown here, but profit is
                  counted only after the phone is sold again.
                </p>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <MoneyStat
                    label="Cost paid"
                    value={purchaseInvestment}
                  />
                  <CountStat label="Phones bought" value={moneyCustomers.length} />
                </div>
              </section>
              <PurchaseTable
                pageInfo={paginatedPurchases}
                rows={paginatedPurchases.rows}
                totalItems={moneyCustomers.length}
              />
            </>
          )}

          {activeTab === "resale" && (
            <>
              <section className="rounded-[18px] border border-zinc-200 bg-white p-5">
                <p className="text-sm font-medium text-zinc-500">
                  Showing resale sales for
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-zinc-950">
                  {selectedProduct
                    ? `${selectedProduct.productName} (${selectedProduct.productCode})`
                    : "All bought or exchanged phones"}
                </h2>
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <MoneyStat
                    label="Resale profit"
                    tone="good"
                    value={resaleProfit}
                  />
                  <MoneyStat label="Resale revenue" value={resaleRevenue} />
                  <MoneyStat label="Phone cost" value={resaleCost} />
                  <CountStat label="Sales" value={resaleSales.length} />
                </div>
                <p className="mt-4 rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
                  This is final profit from old phones sold again.
                </p>
              </section>
              <SalesTable
                pageInfo={paginatedResale}
                productId={selectedProductId}
                rows={paginatedResale.rows}
                tab="resale"
                totalItems={resaleSales.length}
              />
            </>
          )}

          {activeTab === "services" && (
            <>
              <section className="rounded-[18px] border border-zinc-200 bg-white p-5">
                <h2 className="text-2xl font-semibold text-zinc-950">
                  Services
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  Display changes, speaker repairs, and other custom service
                  entries are counted as service income.
                </p>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <MoneyStat
                    label="Service income"
                    tone="good"
                    value={serviceProfit}
                  />
                  <CountStat label="Services" value={services.length} />
                </div>
              </section>
              <ServiceTable
                pageInfo={paginatedServices}
                rows={paginatedServices.rows}
                totalItems={services.length}
              />
            </>
          )}

          {activeTab === "overview" ? null : (
            <p className="text-sm text-zinc-500">
              Showing {formatter.format(selectedPagination.startItem)}-
              {formatter.format(selectedPagination.endItem)} of{" "}
              {formatter.format(
                activeTab === "normal" || activeTab === "resale"
                  ? selectedSales.length
                  : activeTab === "exchange"
                    ? exchanges.length
                    : activeTab === "purchases"
                      ? moneyCustomers.length
                      : services.length
              )}
            </p>
          )}
        </main>
      </div>
    </div>
  );
}

function SalesTable({
  pageInfo,
  productId,
  rows,
  tab,
  totalItems,
}: {
  pageInfo: PageInfo;
  productId: string;
  rows: SaleRow[];
  tab: "normal" | "resale";
  totalItems: number;
}) {
  return (
    <section className="rounded-[18px] border border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 p-5">
        <h2 className="text-xl font-semibold text-zinc-950">Sale details</h2>
        <p className="text-sm text-zinc-500">
          Latest 5 sales with purchase rate, selling rate, and profit.
        </p>
      </div>
      <div className="overflow-x-auto">
        {rows.length > 0 ? (
          <table className="w-full min-w-[820px] border-collapse text-left">
            <thead className="bg-zinc-50 text-xs font-semibold uppercase text-zinc-500">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Shop</th>
                <th className="px-5 py-3">Employee</th>
                <th className="px-5 py-3">Purchase rate</th>
                <th className="px-5 py-3">Selling rate</th>
                <th className="px-5 py-3">Qty</th>
                <th className="px-5 py-3">Discount</th>
                <th className="px-5 py-3 text-right">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-sm">
              {rows.map((sale) => (
                <tr key={sale.id}>
                  <td className="px-5 py-4">
                    <p className="font-medium text-zinc-950">
                      {sale.productName}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {sale.productCode}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-zinc-600">
                    {sale.shop.shopName}
                  </td>
                  <td className="px-5 py-4 text-zinc-600">
                    {sale.employee.name}
                  </td>
                  <td className="px-5 py-4 font-medium text-zinc-900">
                    {currency.format(sale.purchasePrice ?? 0)}
                  </td>
                  <td className="px-5 py-4 font-medium text-zinc-900">
                    {currency.format(sale.unitPrice)}
                  </td>
                  <td className="px-5 py-4 text-zinc-600">
                    {formatter.format(sale.quantity)}
                  </td>
                  <td className="px-5 py-4 text-zinc-600">
                    {currency.format(sale.discount)}
                  </td>
                  <td className="px-5 py-4 text-right font-semibold text-emerald-700">
                    {currency.format(sale.profit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState />
        )}
      </div>
      <Pagination
        page={pageInfo.safePage}
        productId={productId}
        tab={tab}
        totalItems={totalItems}
        totalPages={pageInfo.totalPages}
      />
    </section>
  );
}

function ExchangeTable({
  pageInfo,
  rows,
  totalItems,
}: {
  pageInfo: PageInfo;
  rows: ExchangeRow[];
  totalItems: number;
}) {
  return (
    <section className="rounded-[18px] border border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 p-5">
        <h2 className="text-xl font-semibold text-zinc-950">
          Exchange details
        </h2>
        <p className="text-sm text-zinc-500">
          Latest 5 exchange deals.
        </p>
      </div>
      <div className="overflow-x-auto">
        {rows.length > 0 ? (
          <table className="w-full min-w-[1120px] border-collapse text-left">
            <thead className="bg-zinc-50 text-xs font-semibold uppercase text-zinc-500">
              <tr>
                <th className="px-5 py-3">New phone sold</th>
                <th className="px-5 py-3">Old phone taken</th>
                <th className="px-5 py-3">Shop</th>
                <th className="px-5 py-3">Employee</th>
                <th className="px-5 py-3">Selling price</th>
                <th className="px-5 py-3">Cost</th>
                <th className="px-5 py-3">Cash paid</th>
                <th className="px-5 py-3">Old phone value</th>
                <th className="px-5 py-3 text-right">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-sm">
              {rows.map((exchange) => {
                const soldCost = exchange.soldProduct?.purchasePrice ?? 0;
                const profit = exchange.soldProductPrice - soldCost;

                return (
                  <tr key={exchange.id}>
                    <td className="px-5 py-4">
                      <p className="font-medium text-zinc-950">
                        {exchange.soldProductName}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {exchange.soldProductCode}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-zinc-950">
                        {exchange.receivedProductName}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {exchange.receivedProductCode}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-zinc-600">
                      {exchange.shop.shopName}
                    </td>
                    <td className="px-5 py-4 text-zinc-600">
                      {exchange.employee.name}
                    </td>
                    <td className="px-5 py-4 font-medium text-zinc-900">
                      {currency.format(exchange.soldProductPrice)}
                    </td>
                    <td className="px-5 py-4 text-zinc-600">
                      {currency.format(soldCost)}
                    </td>
                    <td className="px-5 py-4 text-zinc-600">
                      {currency.format(exchange.cashBalance)}
                    </td>
                    <td className="px-5 py-4 text-zinc-600">
                      {currency.format(exchange.exchangeValue)}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-emerald-700">
                      {currency.format(profit)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <EmptyState />
        )}
      </div>
      <Pagination
        page={pageInfo.safePage}
        tab="exchange"
        totalItems={totalItems}
        totalPages={pageInfo.totalPages}
      />
    </section>
  );
}

function PurchaseTable({
  pageInfo,
  rows,
  totalItems,
}: {
  pageInfo: PageInfo;
  rows: CustomerRow[];
  totalItems: number;
}) {
  return (
    <section className="rounded-[18px] border border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 p-5">
        <h2 className="text-xl font-semibold text-zinc-950">
          Bought phone details
        </h2>
        <p className="text-sm text-zinc-500">
          Latest 5 old phones bought from customers.
        </p>
      </div>
      <div className="overflow-x-auto">
        {rows.length > 0 ? (
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead className="bg-zinc-50 text-xs font-semibold uppercase text-zinc-500">
              <tr>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Phone bought</th>
                <th className="px-5 py-3">Shop</th>
                <th className="px-5 py-3">Employee</th>
                <th className="px-5 py-3">Paid amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-sm">
              {rows.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-5 py-4">
                    <p className="font-medium text-zinc-950">
                      {customer.customerName}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {customer.phone}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-zinc-950">
                      {customer.receivedProductName}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {customer.receivedProductCode}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-zinc-600">
                    {customer.shopName}
                  </td>
                  <td className="px-5 py-4 text-zinc-600">
                    {customer.employeeName}
                  </td>
                  <td className="px-5 py-4 font-medium text-zinc-900">
                    {currency.format(customer.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState />
        )}
      </div>
      <Pagination
        page={pageInfo.safePage}
        tab="purchases"
        totalItems={totalItems}
        totalPages={pageInfo.totalPages}
      />
    </section>
  );
}

function ServiceTable({
  pageInfo,
  rows,
  totalItems,
}: {
  pageInfo: PageInfo;
  rows: ServiceRow[];
  totalItems: number;
}) {
  return (
    <section className="rounded-[18px] border border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 p-5">
        <h2 className="text-xl font-semibold text-zinc-950">
          Service details
        </h2>
        <p className="text-sm text-zinc-500">
          Latest 5 service records with customer complaint and price.
        </p>
      </div>
      <div className="overflow-x-auto">
        {rows.length > 0 ? (
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead className="bg-zinc-50 text-xs font-semibold uppercase text-zinc-500">
              <tr>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Device</th>
                <th className="px-5 py-3">Complaint</th>
                <th className="px-5 py-3">Notes</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3 text-right">Income</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-sm">
              {rows.map((service) => (
                <tr key={service.id}>
                  <td className="px-5 py-4">
                    <p className="font-medium text-zinc-950">
                      {service.customerName}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {service.phone || "Phone not added"}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-zinc-600">
                    {service.deviceName || "Device not added"}
                  </td>
                  <td className="px-5 py-4 font-medium text-zinc-950">
                    {service.complaint}
                  </td>
                  <td className="max-w-[280px] px-5 py-4 text-zinc-600">
                    <span className="line-clamp-2">
                      {service.notes || "Not added"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-zinc-600">
                    {service.createdAt.toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-5 py-4 text-right font-semibold text-emerald-700">
                    {currency.format(service.servicePrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState />
        )}
      </div>
      <Pagination
        page={pageInfo.safePage}
        tab="services"
        totalItems={totalItems}
        totalPages={pageInfo.totalPages}
      />
    </section>
  );
}

function EmptyState() {
  return (
    <div className="px-5 py-10 text-center">
      <p className="text-sm font-medium text-zinc-950">No records found.</p>
      <p className="mt-2 text-sm text-zinc-500">
        Change the tab or clear the filter.
      </p>
    </div>
  );
}
