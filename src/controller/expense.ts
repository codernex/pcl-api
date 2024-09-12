import {
  Expense,
  ExpenseType,
  TransactionType
} from "../entities";
import { ErrorHandler, requestHandler } from "../utils";
import { AccountController } from "./account";
import { Controller } from "./base";

export class ExpenseController extends Controller<Expense> {
  constructor() {
    super(Expense);
  }

  create = requestHandler(
    async (req, res, next) => {
      try {
        this.validateErr(req.body, "amount", "expenseTypeId", "expenseName");

        const expenseType = await this.getRepository(ExpenseType).findOne({
          where: {
            id: Number(req.body.expenseTypeId),
          },
        });

        if (!expenseType) {
          throw new ErrorHandler("Expense type not found", 404);
        }

        const expense = new Expense();
        Object.assign(expense, req.body);
        expense.expenseType = expenseType;

        await AccountController.updateBalance(
          expense.amount,
          TransactionType.DEBIT,
          expense.expenseType.type,
          expense.expenseName
        );
        await this.repository.save(expense);
        return this.success(res, expense, 201);
      } catch (error) {
        this.failed(error, next);
      }
    },
    {
      body: {} as Expense & {
        expenseTypeId: string;
      },
    }
  );

  get = requestHandler(async (req, res, next) => {
    try {
      const expense = await this.repository.find();

      return this.success(res, expense);
    } catch (err) {
      this.failed(err, next);
    }
  });
}
