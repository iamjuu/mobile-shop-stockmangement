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

  create(name: string) {
    return repository.create(name);
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