import { Between, FindOptionsWhere } from "typeorm";
import { Payment } from "../entities";
import { requestHandler } from "../utils";
import { Controller } from "./base";

export class PaymentController extends Controller<Payment> {
  constructor() {
    super(Payment);
  }

  get = requestHandler(
    async (req, res, next) => {
      try {
        let where: FindOptionsWhere<Payment> = {};
        if (req.query.startDate && req.query.endDate) {
          // Convert the endDate to 23:59:59
          let endDate = new Date(req.query.endDate);
          endDate.setHours(23, 59, 59, 999);
          where.created_at = Between(req.query.startDate, endDate);
        }
        const payments = await this.repository.find({
          relations: {
            account: true,
            project: true,
            customer: true,
          },
          order: {
            created_at: "DESC",
          },
          where,
        });
        return this.success(res, payments);
      } catch (err) {
        return this.failed(err, next);
      }
    },
    {
      query: {} as any,
    }
  );
}
