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
    <div className="border-b border-zinc-200 bg-white/60 p-[10px]">
      <div className="flex w-full items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-500">
            Employee Workspace
          </p>
          <h1 className="text-xl font-semibold">
            {userName}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <MobileScannerButton />

          <form action={logout}>
            <PendingSubmitButton
              pendingLabel="Logging out..."
              className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:bg-zinc-100"
            >
              Logout
            </PendingSubmitButton>
          </form>
        </div>
      </div>
    </div>
  );
}
