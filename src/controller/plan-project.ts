import { FindOptionsWhere, LessThan } from "typeorm";
import { Customer, PlanProject, Project } from "../entities";
import { VolatileProduct } from "../entities/volatile-product";
import { encodeCursor, parseCursorParams, requestHandler } from "../utils";
import { Controller } from "./base";

export class PlanController extends Controller<PlanProject> {
  constructor() {
    super(PlanProject);
  }

  creatPlan = requestHandler(
    async (req, res, next) => {
      this.validateErr(
        req.body,
        "startDate",
        "endDate",
        "projectId",
        "productId",
        "weeklyDayOff",
        "customerId"
      );

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
      const product = await this.getRepository(VolatileProduct).findOne({
        where: {
          id: req.body.productId,
        },
      });

      if (!customer) {
        return this.failed("Customer not found", next);
      }

      if (!project) {
        return this.failed("Project not found", next);
      }

      if (!product) {
        return this.failed("Product not found", next);
      }
      const dayCount = this.countDaysExcludingFridays(
        req.body.startDate,
        req.body.endDate,
        req.body.weeklyDayOff
      );

      const plan = new PlanProject();
      plan.product = product;
      plan.project = project;
      plan.productionPerDay = Math.round(product.quantity / dayCount);
      plan.startDate = req.body.startDate;
      plan.endDate = req.body.endDate;
      plan.dayCount = dayCount;
      plan.customer = customer;

      await this.repository.save(plan);

      this.success(res, plan, 201);
    },
    {
      body: {} as any,
    }
  );

  getPlan = requestHandler(async (req, res, next) => {
    try {
      const { cursor, limit } = parseCursorParams(req.query);
      const where: FindOptionsWhere<PlanProject> = {};
      if (cursor) {
        where.id = LessThan(cursor);
      }

      const [items, totalCount] = await Promise.all([
        this.repository.find({
          where,
          relations: {
            product: true,
            project: true,
            customer: true,
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

  protected countDaysExcludingFridays(
    startDate: string,
    endDate: string,
    weeklyDayOff: boolean
  ) {
    // Convert start and end dates to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);

    let count = 0;

    // Loop through each day from startDate to endDate
    while (start <= end) {
      // Check if the current day is not a Friday (Day 5 in JavaScript's Date.getDay())
      if (start.getDay() !== 5 || !weeklyDayOff) {
        count++;
      }

      // Move to the next day
      start.setDate(start.getDate() + 1);
    }

    return count;
  }
}
