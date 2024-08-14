import { ExpenseType } from "../entities";
import { requestHandler } from "../utils";
import { Controller } from "./base";

export class ExpenseTypeController extends Controller<ExpenseType> {
  constructor() {
    super(ExpenseType);
  }

  create = requestHandler(
    async (req, res, next) => {
      try {
        this.validateErr(req.body, "type");

        const expenseType = new ExpenseType();
        expenseType.type = req.body.type;

        await this.repository.save(expenseType);

        this.success(res, expenseType);
      } catch (error) {
        this.failed(error, next);
      }
    },
    {
      body: { type: "" },
    }
  );

  get = requestHandler(async (req, res, next) => {
    try {
      const expenseType = await this.repository.find();
      this.success(res, expenseType);
    } catch (error) {
      this.failed(error, next);
    }
  });
}
