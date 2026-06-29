"use client";

import { useMemo, useState } from "react";

import { TablePagination } from "@/components/table-pagination";

interface EmployeeItem {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface EmployeeDirectoryProps {
  employees: EmployeeItem[];
}

const PAGE_SIZE = 7;

export function EmployeeDirectory({ employees }: EmployeeDirectoryProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const paginatedEmployees = useMemo(
    () =>
      employees.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [currentPage, employees]
  );

  return (
    <section className="overflow-hidden rounded-[24px] border border-zinc-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold">Employee directory</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {employees.length} employees configured
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-5 py-4">Employee</th>
              <th className="px-5 py-4">Email</th>
              <th className="px-5 py-4">Created</th>
              <th className="px-5 py-4 text-right">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100 text-sm">
            {employees.length > 0 ? (
              paginatedEmployees.map((employee) => (
                <tr key={employee.id} className="transition hover:bg-zinc-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-950 text-sm font-semibold text-white">
                        {employee.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-zinc-950">
                          {employee.name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          Billing employee
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-zinc-700">
                    {employee.email}
                  </td>
                  <td className="px-5 py-4 text-zinc-600">
                    {employee.createdAt}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Active
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="px-5 py-12 text-center text-sm text-zinc-500"
                >
                  No employees found. Create an employee account for billing access.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        currentPage={currentPage}
        pageSize={PAGE_SIZE}
        totalItems={employees.length}
        onPageChange={setCurrentPage}
      />
    </section>
  );
}
