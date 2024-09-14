import { IncomeType } from "../entities";
import { requestHandler } from "../utils";
import { Controller } from "./base";

export class IncomeTypeController extends Controller<IncomeType> {
  constructor() {
    super(IncomeType);
  }

  get = requestHandler(async (req, res, next) => {
    try {
      const incomeType = await this.repository.find();
      return this.success(res, incomeType);
    } catch (error) {
      return this.failed(error, next);
    }
  });

  create = requestHandler(
    async (req, res, next) => {
      try {
        this.validateErr(req.body, "type", "remark");

        const incomeType = new IncomeType();
        Object.assign(incomeType, req.body);
        await this.repository.save(incomeType);
        return this.success(res, incomeType, 201);
      } catch (err) {
        return this.failed(err, next);
      }
    },
    {
      body: {} as any,
    }
  );
}
