import { ProductRepository } from "../repositories/product.repository";
import type {
  ProductFormValues,
} from "../schemas/product.schema";

import { generateProductCode } from "../utils/product-code";

const repository =
  new ProductRepository();

export class ProductService {
  async getAll() {
    return repository.findAll();
  }

  async create(data: ProductFormValues) {
    const productCode =
      generateProductCode();

    return repository.create({
      ...data,
      productCode,
    });
  }

  async delete(id: string) {
    return repository.delete(id);
  }
}
