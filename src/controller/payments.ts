import { Between, FindOptionsWhere, LessThan } from "typeorm";
import { Payment } from "../entities";
import { encodeCursor, parseCursorParams, requestHandler } from "../utils";
import { Controller } from "./base";

export class PaymentController extends Controller<Payment> {
  constructor() {
    super(Payment);
  }

  get = requestHandler(
    async (req, res, next) => {
      try {
        const { cursor, limit } = parseCursorParams(req.query);
        let where: FindOptionsWhere<Payment> = {};
        if (req.query.startDate && req.query.endDate) {
          // Convert the endDate to 23:59:59
          let endDate = new Date(req.query.endDate);
          endDate.setHours(23, 59, 59, 999);
          where.created_at = Between(req.query.startDate, endDate);
        }

        const countWhere = { ...where };
        if (cursor) {
          where.id = LessThan(cursor);
        }

        const [items, totalCount] = await Promise.all([
          this.repository.find({
            relations: {
              account: true,
              project: true,
              customer: true,
            },
            order: {
              id: "DESC",
            },
            where,
            take: limit + 1,
          }),
          this.repository.count({ where: countWhere }),
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
        return this.failed(err, next);
      }
    },
    {
      query: {} as any,
    }
  );
}
