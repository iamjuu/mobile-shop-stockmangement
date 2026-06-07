import { SubCategoryRepository } from "../repositories/subcategory.repository";

const repository =
  new SubCategoryRepository();

export class SubCategoryService {
  getAll() {
    return repository.findAll();
  }

  create(
    name: string,
    categoryId: string
  ) {
    return repository.create(
      name,
      categoryId
    );
  }

  getByCategory(
    categoryId: string
  ) {
    return repository.findByCategory(
      categoryId
    );
  }
}