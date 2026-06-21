import Link from "next/link";
import { redirect } from "next/navigation";

import { createAuthSession, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

async function signUp(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = formData.get("role") === "ADMIN" ? "ADMIN" : "EMPLOYEE";

  if (!name || !email || !password) {
    redirect("/sign-up?error=All%20fields%20are%20required");
  }

  if (password.length < 8) {
    redirect("/sign-up?error=Password%20must%20be%20at%20least%208%20characters");
  }

  let existingUser;

  try {
    existingUser = await prisma.user.findUnique({
      where: { email },
    });
  } catch {
    redirect("/sign-up?error=Database%20connection%20failed");
  }

  if (existingUser) {
    redirect("/sign-up?error=An%20account%20with%20that%20email%20already%20exists");
  }

  let user;

  try {
    user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashPassword(password),
        role,
      },
    });
  } catch {
    redirect("/sign-up?error=Unable%20to%20create%20account");
  }

  await createAuthSession(user);

  if (user.role === "ADMIN") {
    redirect("/admin/admin-dashboard");
  }

  redirect("/employee/billing");
}

export default async function Page({ searchParams }: PageProps) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-950">Sign up</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Create a local account for the dashboard.
          </p>
        </div>

        {error ? (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <form action={signUp} className="space-y-5">
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-zinc-700"
            >
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
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
              autoComplete="email"
              required
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-zinc-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
            />
          </div>

          <div>
            <label
              htmlFor="role"
              className="mb-2 block text-sm font-medium text-zinc-700"
            >
              Role
            </label>
            <select
              id="role"
              name="role"
              defaultValue="EMPLOYEE"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Sign up
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-zinc-950">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
