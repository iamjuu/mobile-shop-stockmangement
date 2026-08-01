import { revalidatePath } from "next/cache";
import { Users } from "lucide-react";

import {
  EmployeeCreateForm,
  type EmployeeCreateState,
} from "@/features/employees/components/EmployeeCreateForm";
import { EmployeeDirectory } from "@/features/employees/components/EmployeeDirectory";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function EmployeesPage() {
  const [employees, shops] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: "EMPLOYEE",
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.shop.findMany({
      orderBy: {
        shopName: "asc",
      },
    }),
  ]);

  async function createEmployee(
    _state: EmployeeCreateState,
    formData: FormData
  ): Promise<EmployeeCreateState> {
    "use server";

    const shopId = String(formData.get("shopId") ?? "");
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    if (!shopId) {
      return {
        ok: false,
        message: "Choose a shop for this employee.",
      };
    }

    if (!name || !email || password.length < 8) {
      return {
        ok: false,
        message: "Enter employee name, email, and an 8 character password.",
      };
    }

    const [shop, existingUser] = await Promise.all([
      prisma.shop.findUnique({
        where: {
          id: shopId,
        },
      }),
      prisma.user.findUnique({
        where: {
          email,
        },
      }),
    ]);

    if (!shop) {
      return {
        ok: false,
        message: "Selected shop is invalid.",
      };
    }

    if (existingUser) {
      return {
        ok: false,
        message: "An account with this email already exists.",
      };
    }

    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashPassword(password),
        role: "EMPLOYEE",
        shopId: shop.id,
      },
    });

    revalidatePath("/admin/employees");
    revalidatePath("/admin/admin-dashboard");

    return {
      ok: true,
      message: "Employee created successfully.",
    };
  }

  const directoryShops = shops.map((shop) => ({
    id: shop.id,
    shopName: shop.shopName,
  }));
  const shopNamesById = new Map(
    shops.map((shop) => [shop.id, shop.shopName])
  );
  const directoryEmployees = employees.map((employee) => ({
    id: employee.id,
    name: employee.name,
    email: employee.email,
    shopName:
      shopNamesById.get(
        (employee as { shopId?: string | null }).shopId ?? ""
      ) ?? "No shop assigned",
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
              <h1 className="text-3xl font-semibold">Employees</h1>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-zinc-500">
            Create employee accounts for billing and shop operations. Employees
            can sign in only with their assigned shop.
          </p>

          <EmployeeCreateForm
            shops={directoryShops}
            action={createEmployee}
          />
        </section>

        <EmployeeDirectory employees={directoryEmployees} />
      </div>
    </div>
  );
}
