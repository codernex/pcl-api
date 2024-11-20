import { Customer, PlanProject, Project } from "../entities";
import { VolatileProduct } from "../entities/volatile-product";
import { requestHandler } from "../utils";
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
    const plan = await this.repository.find({
      relations: {
        product: true,
        project: true,
        customer:true
      },
    });
    this.success(res, plan);
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
