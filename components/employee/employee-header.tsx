import { redirect } from "next/navigation";

import { PendingSubmitButton } from "@/components/pending-submit-button";
import { clearAuthSession } from "@/lib/auth";
import { MobileScannerButton } from "./mobile-scanner-button";

export function EmployeeHeader({
  userName,
}: {
  userName: string;
}) {
  async function logout() {
    "use server";

    await clearAuthSession();
    redirect("/sign-in");
  }

  return (
    <div className="border-b border-zinc-200 bg-white/60 px-3 py-3 sm:p-[10px]">
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-500">
            Employee Workspace
          </p>
          <h1 className="truncate text-xl font-semibold">
            {userName}
          </h1>
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-3 sm:flex sm:items-center">
          <MobileScannerButton />

          <form action={logout}>
            <PendingSubmitButton
              pendingLabel="Logging out..."
              className="inline-flex h-full items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:bg-zinc-100 sm:py-2"
            >
              Logout
            </PendingSubmitButton>
          </form>
        </div>
      </div>
    </div>
  );
}
