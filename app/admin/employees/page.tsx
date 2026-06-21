import { revalidatePath } from "next/cache";
import { Users } from "lucide-react";

import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function EmployeesPage() {
  const employees = await prisma.user.findMany({
    where: {
      role: "EMPLOYEE",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  async function createEmployee(formData: FormData) {
    "use server";

    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    if (!name || !email || password.length < 8) {
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return;
    }

    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashPassword(password),
        role: "EMPLOYEE",
      },
    });

    revalidatePath("/admin/employees");
    revalidatePath("/admin/admin-dashboard");
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
        <section className="rounded-[24px] border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-950 text-white">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">
                Staff access
              </p>
              <h1 className="text-3xl font-semibold">
                Employees
              </h1>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-zinc-500">
            Create employee accounts for billing and shop operations. Employees
            can sign in and access the employee workspace.
          </p>

          <form
            action={createEmployee}
            className="mt-6 space-y-4"
          >
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Employee name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Example: Rahul Kumar"
                className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="employee@example.com"
                className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Temporary password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                minLength={8}
                required
                placeholder="Minimum 8 characters"
                className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Create Employee
            </button>
          </form>
        </section>

        <section className="overflow-hidden rounded-[24px] border border-zinc-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold">
                Employee directory
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                {employees.length} employees configured
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-5 py-4">
                    Employee
                  </th>
                  <th className="px-5 py-4">
                    Email
                  </th>
                  <th className="px-5 py-4">
                    Created
                  </th>
                  <th className="px-5 py-4 text-right">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-100 text-sm">
                {employees.length > 0 ? (
                  employees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="transition hover:bg-zinc-50"
                    >
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
                        {employee.createdAt.toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
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
        </section>
      </div>
    </div>
  );
}
