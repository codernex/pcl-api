import {
  PaymentMethod,
  PaymentOption,
  PaymentStatus,
  Supplier,
  TransactionType,
} from "../entities";
import { requestHandler } from "../utils";
import { AccountController } from "./account";
import { Controller } from "./base";

export class SupplierController extends Controller<Supplier> {
  constructor() {
    super(Supplier);
  }

  createSupplier = requestHandler(
    async (req, res, next) => {
      try {
        this.validateErr(req.body, "mobile", "company_name");
        const supplier = new Supplier();

        Object.assign(supplier, req.body);

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

  payDue = requestHandler(
    async (req, res, next) => {
      try {
        const amount = parseInt(req.body.amount);
        const supplier = await this.repository.findOneOrFail({
          where: {
            id: req.params.id,
          },
          relations: {
            paymentOptions: true,
          },
        });
        if (!supplier.due) {
          return this.failed("Supplier has no due", next);
        }

        if (amount > supplier.due) {
          return this.failed("Amount is greater than due amount", next);
        }
        supplier.due = Math.max(supplier.due - amount, 0);
        const payment = new PaymentOption();
        payment.paid_amount = req.body.amount;
        payment.recived_by = "Supplier";
        payment.reciver_id = supplier.id;
        payment.amount = supplier.due;
        payment.payment_method = PaymentMethod.CASH;
        payment.payment_status =
          supplier.due > 0 ? PaymentStatus.DUE : PaymentStatus.PAID;
        payment.due_amount = supplier.due;
        payment.change_amount = 0;
        payment.supplier = supplier;
        payment.type = "Supplier Due Payment";

        await AccountController.updateBalance(
          amount,
          req.body.accountId,
          TransactionType.CREDIT,
          "PURCHASE_DUE",
          "Supplier Due Payment"
        );

        await this.getRepository(PaymentOption).save(payment);
        return this.success(res, supplier);
      } catch (error) {}
    },
    {
      params: {} as any,
      body: {} as any,
    }
  );
}
