import { Income, IncomeType, TransactionType } from "../entities";
import { encodeCursor, parseCursorParams, requestHandler } from "../utils";
import { AccountController } from "./account";
import { Controller } from "./base";

export class IncomeController extends Controller<Income> {
  constructor() {
    super(Income);
  }

  create = requestHandler(
    async (req, res, next) => {
      try {
        this.validateErr(req.body, "amount", "incomeTypeId", "accountId");

        const incomeType = await this.getRepository(IncomeType).findOne({
          where: {
            id: req.body.incomeTypeId,
          },
        });

        if (!incomeType) {
          return this.failed("Income Type not found", next);
        }
        const cost = parseInt(req.body.cost) || 0;

        const income = new Income();
        income.amount = parseInt(req.body.amount);
        income.incomeType = incomeType;
        income.cost = cost;

        await AccountController.updateBalance(
          income.amount - cost,
          req.body.accountId,
          TransactionType.CREDIT,
          incomeType.type,
          req.body.remark
            ? req.body.remark
            : incomeType.remark
              ? incomeType.remark
              : ""
        );

        await this.getRepository(Income).save(income);
        return this.success(res, income, 201);
      } catch (error) {
        return this.failed(error, next);
      }
    },
    {
      body: {} as any,
    }
  );

  get = requestHandler(async (req, res, next) => {
    try {
      const { cursor, limit } = parseCursorParams(req.query);

      const qb = this.repository
        .createQueryBuilder("income")
        .leftJoinAndSelect("income.incomeType", "incomeType")
        .select([
          "income.id",
          "income.amount",
          "incomeType.type",
          "incomeType.remark",
        ])
        .orderBy("income.id", "DESC");

      const totalCount = await qb.getCount();

      if (cursor) {
        qb.andWhere("income.id < :cursor", { cursor });
      }

      const items = await qb.take(limit + 1).getMany();

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
    } catch (error) {
      return this.failed(error, next);
    }
  });
}
