import { PaymentDetails, Supplier } from "../entities";
import { requestHandler } from "../utils";
import { Controller } from "./base";

export class SupplierController extends Controller<Supplier> {
  constructor() {
    super(Supplier);
  }

  createSupplier = requestHandler(
    async (req, res, next) => {
      try {
        this.validateErr(req.body, "name", "mobile", "company_name");
        const supplier = new Supplier();

        Object.assign(supplier, req.body);

        const paymentDetails = new PaymentDetails();

        Object.assign(paymentDetails, req.body);

        supplier.payment_details = paymentDetails;

        await this.repository.save(supplier);

        return this.success(res, supplier, 201);
      } catch (error) {
        this.failed(error, next);
      }
    },
    {
      body: {} as any,
    }
  );

  getSupplier = requestHandler(async (req, res, next) => {
    try {
      const suppliers = await this.repository.find({
        relations: {
          paymentOptions: true,
        },
      });
      return this.success(res, suppliers);
    } catch (error) {
      this.failed(error, next);
    }
  });
}
