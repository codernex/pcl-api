import { LessThan, FindOptionsWhere } from "typeorm";
import { Expense, ExpenseType, TransactionType } from "../entities";
import { ErrorHandler, encodeCursor, parseCursorParams, requestHandler } from "../utils";
import { AccountController } from "./account";
import { Controller } from "./base";

export class ExpenseController extends Controller<Expense> {
  constructor() {
    super(Expense);
  }

  create = requestHandler(
    async (req, res, next) => {
      try {
        this.validateErr(
          req.body,
          "amount",
          "expenseTypeId",
          "expenseName",
          "accountId"
        );

        const expenseType = await this.getRepository(ExpenseType).findOne({
          where: {
            id: Number(req.body.expenseTypeId),
          },
        });

        if (!expenseType) {
          throw new ErrorHandler("Expense type not found", 404);
        }

        const expense = new Expense();

        if (req.file) {
          expense.attachment = req.file.filename;
        }
        Object.assign(expense, req.body);
        expense.expenseType = expenseType;

        await AccountController.updateBalance(
          expense.amount,
          req.body.accountId,
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
        accountId: number;
      },
    }
  );

  get = requestHandler(async (req, res, next) => {
    try {
      const { cursor, limit } = parseCursorParams(req.query);

      const where: FindOptionsWhere<Expense> = {};
      if (cursor) {
        where.id = LessThan(cursor);
      }

      const [items, totalCount] = await Promise.all([
        this.repository.find({
          where,
          order: { id: "DESC" },
          take: limit + 1,
        }),
        this.repository.count(),
      ]);

      const hasMore = items.length > limit;
      if (hasMore) items.pop();
      const nextCursor =
        hasMore && items.length > 0
          ? encodeCursor(items[items.length - 1].id)
          : null;

      return this.successPaginated(res, {
        items,
        nextCursor,
        hasMore,
        totalCount,
      });
    } catch (err) {
      this.failed(err, next);
    }
  });
}
