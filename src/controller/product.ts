import { Product } from "../entities";
import { requestHandler } from "../utils";
import { Controller } from "./base";

export class ProductController extends Controller<Product> {
  constructor() {
    super(Product);
  }

  create = requestHandler(
    async (req, res, next) => {
      this.validateErr(req.body, "name");

      const product = new Product();

      Object.assign(product, req.body);

      await this.repository.save(product);

      this.success(res, product, 201);
    },
    {
      body: {} as any,
    }
  );

  get = requestHandler(async (req, res, next) => {
    const data = await this.repository.find();
    return this.success(res, data);
  });
}
