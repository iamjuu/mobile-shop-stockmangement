export enum Role {
  ADMIN = "ADMIN",
  EMPLOYEE = "EMPLOYEE",
}

export const ADMIN_ROUTES = [
  "/admin/admin-dashboard",
  "/admin/shops",
  "/admin/products",
  "/admin/exchanges",
  "/admin/categories",
  "/admin/subcategories",
  "/admin/employees",
  "/admin/reports",
  "/admin/inventory",
];

export const EMPLOYEE_ROUTES = [
  "/employee/dashboard",
  "/employee/billing",
  "/employee/exchange",
  "/employee/exchange-history",
  "/employee/sales-history",
];
