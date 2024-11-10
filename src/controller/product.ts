import { Product } from "../entities";
import { VolatileProduct } from "../entities/volatile-product";
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

  updateProduct = requestHandler(
    async (req, res, next) => {
      const product = await this.getRepository(VolatileProduct).findOne({
        where: {
          id: req.params.id,
        },
      });

      if (!product) {
        return this.failed("Product not found", next, 404);
      }

      Object.assign(product, req.body);

      await this.getRepository(VolatileProduct).save(product);

      this.success(res, product, 200);
    },
    {
      body: {} as any,
      params: {} as any,
    }
  );
}
