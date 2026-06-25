import {
  LayoutDashboard,
  Receipt,
  History,
  RefreshCcw,
} from "lucide-react";

export const employeeNavItems = [
  {
    title: "Dashboard",
    href: "/employee/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Billing",
    href: "/employee/billing",
    icon: Receipt,
  },
  {
    title: "Exchange",
    href: "/employee/exchange",
    icon: RefreshCcw,
  },
  {
    title: "Exchange History",
    href: "/employee/exchange-history",
    icon: RefreshCcw,
  },
  {
    title: "Sales History",
    href: "/employee/sales-history",
    icon: History,
  },
];
