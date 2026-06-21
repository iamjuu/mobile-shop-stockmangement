import { redirect } from "next/navigation";

export default function MisspelledDashboardPage() {
  redirect("/admin/admin-dashboard");
}
