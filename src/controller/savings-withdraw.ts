import { Customer, SavingsWithdraw, TransactionType } from "../entities";
import { encodeCursor, ErrorHandler, isDateValid, parseCursorParams, requestHandler } from "../utils";
import { AccountController } from "./account";
import { Controller } from "./base";

export class SavingsWithdrawController extends Controller<SavingsWithdraw> {
  constructor() {
    super(SavingsWithdraw);
  }

  get = requestHandler(
    async (req, res, next) => {
      try {
        const { cursor, limit } = parseCursorParams(req.query);

        const qb = this.repository
          .createQueryBuilder("sw")
          .leftJoinAndSelect("sw.customer", "c")
          .select([
            "sw.id",
            "sw.amount",
            "sw.created_at",
            "c.id",
            "c.account_number",
            "c.name",
            "c.mobile",
          ]);

        if (req.query.startDate && req.query.endDate) {
          const isDate = isDateValid(req.query.startDate, req.query.endDate);
          if (!isDate) {
            throw new ErrorHandler("Invalid Date", 404);
          }
          qb.andWhere("DATE(sw.created_at) BETWEEN :startDate AND :endDate", {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
          });
        }

        const totalCount = await qb.getCount();

        if (cursor) {
          qb.andWhere("sw.id < :cursor", { cursor });
        }

        const items = await qb
          .orderBy("sw.id", "DESC")
          .take(limit + 1)
          .getMany();

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
    },
    {
      query: {} as any,
    }
  );

  create = requestHandler(
    async (req, res, next) => {
      try {
        this.validateErr(req.body, "amount", "customerId", "accountId");

        const customer = await this.getRepository(Customer).findOne({
          where: {
            id: req.body.customerId,
          },
        });

        if (!customer) {
          return this.failed("Customer not found", next);
        }

        if (customer.savings < parseInt(req.body.amount)) {
          return this.failed("Insufficient savings, with", next);
        }
        customer.savings = Math.max(
          customer.savings - parseInt(req.body.amount),
          0
        );

        const savingsWithdraw = new SavingsWithdraw();
        savingsWithdraw.amount = parseInt(req.body.amount);
        savingsWithdraw.customer = customer;

        await AccountController.updateBalance(
          savingsWithdraw.amount,
          req.body.accountId,
          TransactionType.DEBIT,
          "Savings Withdraw",
          "Savings withdraw from savings account",
          customer
        );

        await this.repository.save(savingsWithdraw);
        return this.success(res, savingsWithdraw, 201);
      } catch (err) {
        return this.failed(err, next);
      }
    },
    {
      body: {} as any,
    }
  );
}
