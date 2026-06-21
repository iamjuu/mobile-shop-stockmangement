export interface Product {
  id: string;
  productCode: string;

  productName: string;

  shopId: string;
  categoryId: string;
  subcategoryId: string;

  purchasePrice?: number;
  price: number;
  stock: number;

  imageUrl?: string;
  description?: string;

  qrCode?: string;
  barcode?: string;
}
