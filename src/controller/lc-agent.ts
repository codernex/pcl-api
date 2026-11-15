import { FindOptionsWhere, LessThan } from "typeorm";
import { LcAgent } from "../entities";
import { encodeCursor, parseCursorParams, requestHandler } from "../utils";
import { Controller } from "./base";

export class LcAgentController extends Controller<LcAgent> {
  constructor() {
    super(LcAgent);
  }

  create = requestHandler(
    async (req, res, next) => {
      this.validateErr(
        req.body,
        "name",
        "companyName",
        "designation",
        "mobile"
      );
      const lcAgent = await this.repository.save(req.body);
      this.success(res, lcAgent, 201);
    },
    {
      body: {} as any,
    }
  );

  get = requestHandler(async (req, res, next) => {
    try {
      const { cursor, limit } = parseCursorParams(req.query);
      const where: FindOptionsWhere<LcAgent> = {};
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
      return this.failed(err, next);
    }
  });
}
