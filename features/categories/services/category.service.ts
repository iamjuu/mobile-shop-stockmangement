import { CategoryRepository } from "../repositories/category.repository";

const repository =
  new CategoryRepository();

export class CategoryService {
  getAll() {
    return repository.findAll();
  }

  getById(id: string) {
    return repository.findById(id);
  }

  create(
    name: string,
    shopId?: string | null
  ) {
    return repository.create(
      name,
      shopId
    );
  }

  update(
    id: string,
    name: string
  ) {
    return repository.update(
      id,
      name
    );
  }

  delete(id: string) {
    return repository.delete(id);
  }
}
