"use client";

import { useMemo, useState } from "react";

import { TablePagination } from "@/components/table-pagination";

interface CustomerItem {
  id: string;
  customerName: string;
  phone: string;
  type: string;
  employeeName: string;
  shopName: string;
  receivedProductName: string;
  receivedProductCode: string;
  amount: number;
  resalePrice: number;
  imeiNumber?: string | null;
  createdAt: string;
}

interface CustomerDirectoryProps {
  customers: CustomerItem[];
  showEmployee: boolean;
}

const currency = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  style: "currency",
});
const PAGE_SIZE = 8;

export function CustomerDirectory({
  customers,
  showEmployee,
}: CustomerDirectoryProps) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesType = typeFilter === "ALL" || customer.type === typeFilter;
      const matchesQuery =
        !normalizedQuery ||
        [
          customer.customerName,
          customer.phone,
          customer.receivedProductName,
          customer.receivedProductCode,
          customer.employeeName,
          customer.shopName,
          customer.imeiNumber ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesType && matchesQuery;
    });
  }, [customers, query, typeFilter]);
  const paginatedCustomers = useMemo(
    () =>
      filteredCustomers.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
      ),
    [currentPage, filteredCustomers]
  );

  return (
    <section className="overflow-hidden rounded-[24px] border border-zinc-200 bg-white">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-zinc-200 px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold">Users</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {filteredCustomers.length} users found
          </p>
        </div>

        <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-[260px_180px]">
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search user, phone, product"
            className="rounded-full border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-950"
          />
          <select
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(event.target.value);
              setCurrentPage(1);
            }}
            className="rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-950"
          >
            <option value="ALL">All users</option>
            <option value="MONEY">Money users</option>
            <option value="EXCHANGE">Exchange users</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px] border-collapse text-left">
          <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-5 py-4">User</th>
              <th className="px-5 py-4">Type</th>
              <th className="px-5 py-4">Received phone</th>
              <th className="px-5 py-4">Amount</th>
              <th className="px-5 py-4">Resale</th>
              <th className="px-5 py-4">IMEI</th>
              {showEmployee ? <th className="px-5 py-4">Employee</th> : null}
              <th className="px-5 py-4">Shop</th>
              <th className="px-5 py-4">Date</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100 text-sm">
            {paginatedCustomers.length > 0 ? (
              paginatedCustomers.map((customer) => (
                <tr key={customer.id} className="transition hover:bg-zinc-50">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-zinc-950">
                      {customer.customerName}
                    </p>
                    <p className="text-xs text-zinc-500">{customer.phone}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
                      {customer.type === "MONEY" ? "Money" : "Exchange"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-zinc-950">
                      {customer.receivedProductName}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {customer.receivedProductCode}
                    </p>
                  </td>
                  <td className="px-5 py-4 font-semibold">
                    {currency.format(customer.amount)}
                  </td>
                  <td className="px-5 py-4 font-semibold">
                    {currency.format(customer.resalePrice)}
                  </td>
                  <td className="px-5 py-4 text-zinc-700">
                    {customer.imeiNumber || "Not added"}
                  </td>
                  {showEmployee ? (
                    <td className="px-5 py-4 text-zinc-700">
                      {customer.employeeName}
                    </td>
                  ) : null}
                  <td className="px-5 py-4 text-zinc-700">
                    {customer.shopName}
                  </td>
                  <td className="px-5 py-4 text-zinc-600">
                    {customer.createdAt}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={showEmployee ? 9 : 8}
                  className="px-5 py-12 text-center text-sm text-zinc-500"
                >
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        currentPage={currentPage}
        pageSize={PAGE_SIZE}
        totalItems={filteredCustomers.length}
        onPageChange={setCurrentPage}
      />
    </section>
  );
}
