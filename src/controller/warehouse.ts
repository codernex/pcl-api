import { Warehouse } from "../entities";
import { requestHandler } from "../utils";
import { Controller } from "./base";

export class WarehouseController extends Controller<Warehouse> {
  constructor() {
    super(Warehouse);
  }

  create = requestHandler(
    async (req, res, next) => {
      try {
        if (!req.user) {
          return this.failed("Unauthorized", next, 401);
        }
        this.validateErr(req.body, "name");
        const warehouse = new Warehouse();
        Object.assign(warehouse, req.body);
        warehouse.business = req.user.business;
        await this.repository.save(warehouse);
        return this.success(res, warehouse, 201);
      } catch (err) {
        this.failed(err, next);
      }
    },
    {
      body: {} as any,
    }
  );

  get = requestHandler(async (req, res, next) => {
    try {
      const warehouse = await this.repository.find({
        where: {
          business: {
            id: req.user?.business?.id,
          },
        },
      });
      return this.success(res, warehouse);
    } catch (err) {
      return this.failed(err, next);
    }
  });
}
