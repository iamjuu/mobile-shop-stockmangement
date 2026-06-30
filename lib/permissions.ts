export enum Role {
  ADMIN = "ADMIN",
  EMPLOYEE = "EMPLOYEE",
}

export const ADMIN_ROUTES = [
  "/admin/admin-dashboard",
  "/admin/shops",
  "/admin/products",
  "/admin/exchanges",
  "/admin/users",
  "/admin/categories",
  "/admin/subcategories",
  "/admin/employees",
  "/admin/reports",
  "/admin/inventory",
];

export const EMPLOYEE_ROUTES = [
  "/employee/dashboard",
  "/employee/billing",
  "/employee/product-catalog",
  "/employee/exchange",
  "/employee/exchange-history",
  "/employee/users",
  "/employee/sales-history",
];
