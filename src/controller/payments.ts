import { PaymentOption } from "../entities";
import { requestHandler } from "../utils";
import { Controller } from "./base";

export class PaymentController extends Controller<PaymentOption> {
  constructor() {
    super(PaymentOption);
  }

  get = requestHandler(async (req, res, next) => {
    try {
      const payments = await this.repository.find();
      return this.success(res, payments);
    } catch (err) {
      return this.failed(err, next);
    }
  });
}
