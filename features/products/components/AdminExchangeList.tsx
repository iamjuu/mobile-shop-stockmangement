"use client";

import { useMemo, useState } from "react";
import { ChevronRight, X } from "lucide-react";
import Image from "next/image";

import { TablePagination } from "@/components/table-pagination";

interface AdminExchangeItem {
  id: string;
  receivedProductName: string;
  receivedProductCode: string;
  receivedProductImageUrl?: string | null;
  receivedCategoryName: string;
  receivedSubcategoryName: string;
  receivedProductPrice: number;
  receivedProductStock: number;
  soldProductName: string;
  soldProductCode: string;
  soldCategoryName: string;
  soldSubcategoryName: string;
  soldProductPrice: number;
  exchangeValue: number;
  cashBalance: number;
  paymentMethod: string;
  employeeName: string;
  employeeEmail: string;
  shopName: string;
  shopCode: string;
  shopPhone: string;
  shopAddress: string;
  condition: string;
  notes: string;
  createdAt: string;
}

interface AdminExchangeListProps {
  exchanges: AdminExchangeItem[];
}

const currency = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  style: "currency",
});
const PAGE_SIZE = 7;

export function AdminExchangeList({ exchanges }: AdminExchangeListProps) {
  const [selectedId, setSelectedId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const selectedExchange = useMemo(
    () => exchanges.find((exchange) => exchange.id === selectedId) ?? null,
    [exchanges, selectedId]
  );
  const paginatedExchanges = useMemo(
    () =>
      exchanges.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [currentPage, exchanges]
  );

  return (
    <section className="overflow-hidden rounded-[24px] border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-5 py-4">
        <h2 className="text-lg font-semibold">Exchange products</h2>
        <p className="mt-1 text-sm text-zinc-500">
          {exchanges.length} exchange products recorded
        </p>
      </div>

      {exchanges.length > 0 ? (
        <div
          className={`grid min-h-[520px] ${
            selectedExchange ? "xl:grid-cols-[minmax(0,1fr)_520px]" : ""
          }`}
        >
          <div
            className={`overflow-x-auto ${
              selectedExchange
                ? "border-b border-zinc-200 xl:border-b-0 xl:border-r"
                : ""
            }`}
          >
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-5 py-4">Exchange Product</th>
                  <th className="px-5 py-4">Resale Price</th>
                  <th className="px-5 py-4">Sold Product</th>
                  <th className="px-5 py-4">Sold Price</th>
                  <th className="px-5 py-4">Shop</th>
                  <th className="px-5 py-4">Balance</th>
                  <th className="px-5 py-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-sm">
                {paginatedExchanges.map((exchange) => {
                  const isSelected = exchange.id === selectedExchange?.id;

                  return (
                    <tr
                      key={exchange.id}
                      className={`transition ${
                        isSelected ? "bg-zinc-100" : "hover:bg-zinc-50"
                      }`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {exchange.receivedProductImageUrl ? (
                            <Image
                              src={exchange.receivedProductImageUrl}
                              alt={exchange.receivedProductName}
                              width={54}
                              height={54}
                              unoptimized
                              className="size-14 rounded-2xl object-cover"
                            />
                          ) : (
                            <div className="flex size-14 items-center justify-center rounded-2xl bg-zinc-950 text-sm font-semibold text-white">
                              {exchange.receivedProductName
                                .slice(0, 1)
                                .toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-zinc-950">
                              {exchange.receivedProductName}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {exchange.receivedProductCode}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-semibold">
                        {currency.format(exchange.receivedProductPrice)}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium">{exchange.soldProductName}</p>
                        <p className="text-xs text-zinc-500">
                          {exchange.soldProductCode}
                        </p>
                      </td>
                      <td className="px-5 py-4 font-semibold">
                        {currency.format(exchange.soldProductPrice)}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium">{exchange.shopName}</p>
                        <p className="text-xs text-zinc-500">
                          {exchange.shopCode}
                        </p>
                      </td>
                      <td className="px-5 py-4 font-semibold text-emerald-700">
                        {currency.format(exchange.cashBalance)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-full border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-white"
                          onClick={() => {
                            setSelectedId(exchange.id);
                          }}
                        >
                          View
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <TablePagination
              currentPage={currentPage}
              pageSize={PAGE_SIZE}
              totalItems={exchanges.length}
              onPageChange={setCurrentPage}
            />
          </div>

          {selectedExchange ? (
            <aside className="bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-zinc-500">
                    Complete exchange details
                  </p>
                  <h3 className="mt-1 text-2xl font-semibold">
                    {selectedExchange.receivedProductName}
                  </h3>
                </div>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 hover:bg-zinc-50"
                  onClick={() => {
                    setSelectedId("");
                  }}
                  aria-label="Close details"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-5 space-y-5">
                <DetailGroup title="Exchange product">
                  <Detail label="Product" value={selectedExchange.receivedProductName} />
                  <Detail label="Code" value={selectedExchange.receivedProductCode} />
                  <Detail
                    label="Category"
                    value={selectedExchange.receivedCategoryName}
                  />
                  <Detail
                    label="Brand"
                    value={selectedExchange.receivedSubcategoryName}
                  />
                  <Detail
                    label="Exchange value"
                    value={currency.format(selectedExchange.exchangeValue)}
                  />
                  <Detail
                    label="Resale price"
                    value={currency.format(selectedExchange.receivedProductPrice)}
                  />
                  <Detail
                    label="Stock"
                    value={`${selectedExchange.receivedProductStock} unit`}
                  />
                  <Detail label="Condition" value={selectedExchange.condition} />
                </DetailGroup>

                <DetailGroup title="Sold product and payment">
                  <Detail label="Sold product" value={selectedExchange.soldProductName} />
                  <Detail label="Sold code" value={selectedExchange.soldProductCode} />
                  <Detail label="Category" value={selectedExchange.soldCategoryName} />
                  <Detail
                    label="Brand"
                    value={selectedExchange.soldSubcategoryName}
                  />
                  <Detail
                    label="Product price"
                    value={currency.format(selectedExchange.soldProductPrice)}
                  />
                  <Detail
                    label="Balance collected"
                    value={currency.format(selectedExchange.cashBalance)}
                  />
                  <Detail
                    label="Payment method"
                    value={selectedExchange.paymentMethod}
                  />
                </DetailGroup>

                <DetailGroup title="Employee and shop">
                  <Detail label="Employee" value={selectedExchange.employeeName} />
                  <Detail label="Employee email" value={selectedExchange.employeeEmail} />
                  <Detail label="Shop" value={selectedExchange.shopName} />
                  <Detail label="Shop code" value={selectedExchange.shopCode} />
                  <Detail label="Shop phone" value={selectedExchange.shopPhone} />
                  <Detail label="Shop address" value={selectedExchange.shopAddress} />
                  <Detail label="Date" value={selectedExchange.createdAt} />
                  <Detail label="Notes" value={selectedExchange.notes} />
                </DetailGroup>
              </div>
            </aside>
          ) : null}
        </div>
      ) : (
        <div className="px-5 py-12 text-center text-sm text-zinc-500">
          No exchange products found.
        </div>
      )}
    </section>
  );
}

function DetailGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-zinc-500">{title}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-zinc-50 px-4 py-3 text-sm">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-1 font-semibold text-zinc-950">{value}</p>
    </div>
  );
}
