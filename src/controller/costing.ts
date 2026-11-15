import { FindOptionsWhere, LessThan } from "typeorm";
import { Customer, Project } from "../entities";
import { Costing } from "../entities/costing";
import { encodeCursor, parseCursorParams, requestHandler } from "../utils";
import { Controller } from "./base";

export class CostingController extends Controller<Costing> {
  constructor() {
    super(Costing);
  }

  create = requestHandler(
    async (req, res, next) => {
      this.validateErr(req.body, "projectId", "customerId", "amount");
      const project = await this.getRepository(Project).findOne({
        where: {
          id: req.body.projectId,
        },
      });

      const customer = await this.getRepository(Customer).findOne({
        where: {
          id: req.body.customerId,
        },
      });

      if (!project) {
        return this.failed("Project not found", next);
      }

      if (!customer) {
        return this.failed("Customer not found", next);
      }

      const costing = new Costing();
      costing.project = project;
      costing.customer = customer;
      costing.amount = req.body.amount;
      await this.repository.save(costing);
      return this.success(res, costing, 201);
    },
    {
      body: {} as any,
    }
  );

  get = requestHandler(async (req, res, next) => {
    try {
      const { cursor, limit } = parseCursorParams(req.query);
      const where: FindOptionsWhere<Costing> = {};
      if (cursor) {
        where.id = LessThan(cursor);
      }

      const [items, totalCount] = await Promise.all([
        this.repository.find({
          where,
          relations: {
            customer: true,
            project: true,
          },
          order: {
            id: "DESC",
          },
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
