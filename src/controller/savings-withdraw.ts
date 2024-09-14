import { Customer, SavingsWithdraw } from "../entities";
import { ErrorHandler, isDateValid, requestHandler } from "../utils";
import { Controller } from "./base";

export class SavingsWithdrawController extends Controller<SavingsWithdraw> {
  constructor() {
    super(SavingsWithdraw);
  }

  get = requestHandler(
    async (req, res, next) => {
      try {
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
        const savingsWithdraw = await qb
          .orderBy("sw.created_at", "DESC")
          .getMany();
        return this.success(res, savingsWithdraw);
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
        this.validateErr(req.body, "amount", "customerId");

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
