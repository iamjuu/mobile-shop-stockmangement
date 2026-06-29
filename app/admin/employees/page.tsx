import { revalidatePath } from "next/cache";
import { Users } from "lucide-react";

import { PendingSubmitButton } from "@/components/pending-submit-button";
import { EmployeeDirectory } from "@/features/employees/components/EmployeeDirectory";
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

  const directoryEmployees = employees.map((employee) => ({
    id: employee.id,
    name: employee.name,
    email: employee.email,
    createdAt: employee.createdAt.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  }));

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

            <PendingSubmitButton
              pendingLabel="Creating employee..."
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            >
              Create Employee
            </PendingSubmitButton>
          </form>
        </section>

        <EmployeeDirectory employees={directoryEmployees} />
      </div>
    </div>
  );
}
