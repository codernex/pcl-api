import { Factory } from "../entities/factory";
import { requestHandler } from "../utils";
import { Controller } from "./base";

export class FactoryController extends Controller<Factory> {
  constructor() {
    super(Factory);
  }

  create = requestHandler(
    async (req, res, next) => {
      this.validateErr(req.body, "name", "address");

      const factory = this.repository.create(req.body);
      await this.repository.save(factory);
      this.success(res, factory);
    },
    {
      body: {} as any,
    }
  );

  get = requestHandler(async (req, res, next) => {
    const data = await this.repository.find({
      order:{
        createdAt:'asc'
      }
    });
    return this.success(res, data);
  });
}
