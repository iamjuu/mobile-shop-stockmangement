import type { ShopFormValues } from "../components/ShopForm";
import { ShopRepository } from "../repositories/shop.repository";
import { cleanName, normalizeName } from "@/lib/normalize-name";

const repository = new ShopRepository();

export class ShopService {
  getAll() {
    return repository.findAll();
  }

  async getById(id: string) {
    const shop = await repository.findById(id);

    if (!shop) {
      throw new Error("Shop not found");
    }

    return shop;
  }

  async create(data: ShopFormValues) {
    const cleanShopName = cleanName(data.shopName);
    const normalizedShopName = normalizeName(cleanShopName);
    const duplicateShop = (await repository.findByNameCandidates()).find(
      (shop) => normalizeName(shop.shopName) === normalizedShopName
    );

    if (duplicateShop) {
      throw new Error("Shop name already exists.");
    }

    return repository.create({
      ...data,
      shopName: cleanShopName,
      shopCode: data.shopCode.trim(),
      address: data.address?.trim() || undefined,
      phone: data.phone?.trim() || undefined,
      description: data.description?.trim() || undefined,
    });
  }

  async update(
    id: string,
    data: ShopFormValues
  ) {
    const cleanShopName = cleanName(data.shopName);
    const normalizedShopName = normalizeName(cleanShopName);
    const duplicateShop = (await repository.findByNameCandidates(id)).find(
      (shop) => normalizeName(shop.shopName) === normalizedShopName
    );

    if (duplicateShop) {
      throw new Error("Shop name already exists.");
    }

    return repository.update(id, {
      ...data,
      shopName: cleanShopName,
      shopCode: data.shopCode.trim(),
      address: data.address?.trim() || undefined,
      phone: data.phone?.trim() || undefined,
      description: data.description?.trim() || undefined,
    });
  }

  delete(id: string) {
    return repository.delete(id);
  }
}
