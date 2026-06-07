export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">
        Dashboard
      </h1>

      <div className="grid grid-cols-4 gap-4 mt-8">
        <div className="border rounded-xl p-5">
          <p>Total Shops</p>
          <h2 className="text-2xl font-bold">
            0
          </h2>
        </div>

        <div className="border rounded-xl p-5">
          <p>Total Products</p>
          <h2 className="text-2xl font-bold">
            0
          </h2>
        </div>

        <div className="border rounded-xl p-5">
          <p>Total Employees</p>
          <h2 className="text-2xl font-bold">
            0
          </h2>
        </div>

        <div className="border rounded-xl p-5">
          <p>Total Sales</p>
          <h2 className="text-2xl font-bold">
            ₹0
          </h2>
        </div>
      </div>
    </div>
  );
}