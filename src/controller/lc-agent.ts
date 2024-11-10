import { LcAgent } from "../entities";
import { requestHandler } from "../utils";
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
    const data = await this.repository.find();
    return this.success(res, data);
  });
}
