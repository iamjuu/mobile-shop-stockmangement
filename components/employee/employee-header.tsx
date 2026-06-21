import { redirect } from "next/navigation";

import { clearAuthSession } from "@/lib/auth";
import { MobileScannerButton } from "./mobile-scanner-button";

export function EmployeeHeader() {
  async function logout() {
    "use server";

    await clearAuthSession();
    redirect("/sign-in");
  }

  return (
    <header className="h-16 border-b bg-white px-6 flex items-center justify-between">
      <h1 className="font-semibold">
        Employee Dashboard
      </h1>

      <div className="flex items-center gap-4">
        <MobileScannerButton />

        <form action={logout}>
          <button
            type="submit"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Logout
          </button>
        </form>
      </div>
    </header>
  );
}
