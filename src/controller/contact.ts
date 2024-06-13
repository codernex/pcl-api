import {
  Contacts,
  PaymentDetails,
  PaymentOption,
  PaymentStatus,
} from "../entities";
import { ApiError, requestHandler } from "../utils";
import { Controller } from "./base";

export class ContactController extends Controller<Contacts> {
  constructor() {
    super(Contacts);
  }

  createContact = requestHandler(
    async (req, res, next) => {
      try {
        this.validateErr(req.body, "name", "mobile");
        // Handling Error

        // Seller Payment Option
        const paymentDetails = new PaymentDetails();

        Object.assign(paymentDetails, {
          ...req.body,
        });

        const contact = new Contacts();

        if (!req.body.credit_limit) {
          contact.credit_limit = 0;
        }
        contact.payment_details = paymentDetails;
        Object.assign(contact, {
          ...req.body,
        });

        await this.repository.save(contact);

        return this.success(res, contact, 201);
      } catch (err) {
        return ApiError(err, 500, next);
      }
    },
    {
      body: {} as any,
    }
  );

  getContacts = requestHandler(async (req, res, next) => {
    try {
      const contacts = await this.repository.find({
        relations: {
          payment_details: true,
          payment_option: true,
        },
        order: {
          payment_option: {
            created_at: "DESC",
          },
        },
      });

      return this.success(res, contacts);
    } catch (err) {
      return ApiError(err, 500, next);
    }
  });

  updateContact = requestHandler(
    async (req, res, next) => {
      try {
        const contact = await this.repository.findOneOrFail({
          where: {
            id: req.params.id,
          },
          relations: {
            payment_details: true,
          },
        });

        let paymentDetails = contact.payment_details;

        if (!paymentDetails) {
          paymentDetails = new PaymentDetails();
        }

        Object.assign(paymentDetails, {
          ...req.body,
        });

        Object.assign(contact, {
          ...req.body,
        });
        contact.payment_details = paymentDetails;

        await this.repository.save(contact);

        this.success(res, contact, 200);
      } catch (err) {
        return ApiError(err, 500, next);
      }
    },
    {
      body: {} as any,
      params: { id: 0 },
    }
  );

  collectDue = requestHandler(
    async (req, res, next) => {
      try {
        this.validateErr(req.body, "amount", "paymentMethod");

        if (!req.user) {
          throw new Error("Unauthorized user");
        }
        const contact = await this.repository.findOneOrFail({
          where: {
            id: req.params.id,
          },
          relations: {
            payment_option: true,
          },
        });

        if (!contact.due_from_supplier) {
          throw new Error("There is no due of this contact");
        }

        const amount = Number.parseFloat(req.body.amount);

        if (amount > contact.due_from_supplier) {
          throw new Error("Amount is greater than due amount");
        }
        const changeAmount = amount - contact.due_from_supplier;
        const paid_amount = contact.due_from_supplier - amount;

        const payment = new PaymentOption();
        payment.type = "COLLECT_DUE";
        payment.amount = contact.due_from_supplier;
        payment.paid_amount = amount;
        payment.payment_method = req.body.paymentMethod;
        payment.payment_status = PaymentStatus.COLLECT_DUE;
        payment.due_amount =
          contact.due_from_supplier > 0 ? contact.due_from_supplier : 0;
        payment.change_amount = changeAmount > 0 ? changeAmount : 0;
        payment.recived_by = "Owner";
        payment.reciver_id = req.user?.id;
        contact.due_from_supplier = paid_amount < 0 ? 0 : paid_amount;
        payment.contact = contact;
        await this.getRepository(PaymentOption).save(payment);
        this.success(res, contact, 200);
      } catch (err) {
        return ApiError(err, 500, next);
      }
    },
    {
      params: { id: 0 },
      body: {} as any,
    }
  );

  payDue = requestHandler(
    async (req, res, next) => {
      try {
        this.validateErr(req.body, "amount", "paymentMethod");

        if (!req.user) {
          throw new Error("Unauthorized user");
        }
        const contact = await this.repository.findOneOrFail({
          where: {
            id: req.params.id,
          },
          relations: {
            payment_option: true,
          },
        });

        if (!contact.due_from_owner) {
          throw new Error("There is no due to this contact from the owner");
        }

        const amount = Number.parseFloat(req.body.amount);

        if (amount > contact.due_from_owner) {
          throw new Error("Amount is greater than due amount");
        }
        const changeAmount = amount - contact.due_from_owner;
        const paid_amount = contact.due_from_owner - amount;

        const payment = new PaymentOption();
        payment.type = "PAY_DUE";
        payment.amount = contact.due_from_owner;
        payment.paid_amount = amount;
        payment.payment_method = req.body.paymentMethod;

        payment.payment_status = PaymentStatus.COLLECT_DUE;
        payment.due_amount =
          contact.due_from_owner > 0 ? contact.due_from_owner : 0;
        payment.change_amount = changeAmount > 0 ? changeAmount : 0;
        payment.recived_by = "Supplier";
        payment.reciver_id = contact.id;
        contact.due_from_owner = paid_amount < 0 ? 0 : paid_amount;
        payment.contact = contact;
        await this.getRepository(PaymentOption).save(payment);
        this.success(res, contact, 200);
      } catch (err) {
        return ApiError(err, 500, next);
      }
    },
    {
      params: { id: 0 },
      body: {} as any,
    }
  );
}
