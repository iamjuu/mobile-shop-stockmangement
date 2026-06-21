import type { ShopFormValues } from "../components/ShopForm";
import { ShopRepository } from "../repositories/shop.repository";

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

  create(data: ShopFormValues) {
    return repository.create(data);
  }

  update(
    id: string,
    data: ShopFormValues
  ) {
    return repository.update(id, data);
  }

  delete(id: string) {
    return repository.delete(id);
  }
}
