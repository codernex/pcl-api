import { Customer, Project } from "../entities";
import { Costing } from "../entities/costing";
import { requestHandler } from "../utils";
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
    const data = await this.repository.find({
      relations: {
        customer: true,
        project: true,
      },
    });
    return this.success(res, data);
  });
}
