import {
  LayoutDashboard,
  Receipt,
  History,
  RefreshCcw,
  Users,
  PackageSearch,
  Wrench,
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
    title: "Product",
    href: "/employee/product-catalog",
    icon: PackageSearch,
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
    title: "Users",
    href: "/employee/users",
    icon: Users,
  },
  {
    title: "Services",
    href: "/employee/services",
    icon: Wrench,
  },
  {
    title: "Sales History",
    href: "/employee/sales-history",
    icon: History,
  },
];
