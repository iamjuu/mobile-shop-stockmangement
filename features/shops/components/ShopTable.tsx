import { ShopActions } from "./ShopActions";

interface Shop {
  id: string;
  shopName: string;
  shopCode: string;
  phone?: string | null;
}

interface Props {
  shops: Shop[];
}

export function ShopTable({
  shops,
}: Props) {
  return (
    <table className="w-full border">
      <thead>
        <tr>
          <th>Name</th>
          <th>Code</th>
          <th>Phone</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        {shops.map((shop) => (
          <tr key={shop.id}>
            <td>{shop.shopName}</td>
            <td>{shop.shopCode}</td>
            <td>{shop.phone}</td>

            <td>
              <ShopActions
                id={shop.id}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}