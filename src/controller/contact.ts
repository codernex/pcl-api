import { In } from "typeorm";
import {
  AccountHistory,
  Customer,
  Granter,
  Installments,
  Invoice,
  PaymentDetails,
  PaymentMethod,
  PaymentOption,
  PaymentStatus,
  TransactionType,
} from "../entities";
import { ApiError, ErrorHandler, requestHandler } from "../utils";
import { AccountController } from "./account";
import { Controller } from "./base";

export class ContactController extends Controller<Customer> {
  constructor() {
    super(Customer);
  }

  createContact = requestHandler(
    async (req, res, next) => {
      try {
        this.validateErr(req.body, "name", "mobile");
        // Handling Error
        const contact = new Customer();

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
          payment_option: true,
          installments: true,
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
        });

        Object.assign(contact, {
          ...req.body,
        });

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

        const amount = Number.parseFloat(req.body.amount);
        const changeAmount = amount - contact.due;
        const payment = this.createPayment(
          contact,
          amount - changeAmount,
          req,
          changeAmount,
          "COLLECT_DUE"
        );
        await AccountController.updateBalance(
          amount - changeAmount,
          TransactionType.DEBIT
        );
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

  addGranter = requestHandler(
    async (req, res, next) => {
      try {
        this.validateErr(req.body, "name", "mobile", "husband_or_parent_name");
        const contact = await this.repository.findOneOrFail({
          where: {
            id: req.params.id,
          },
          relations: {
            granter: true,
          },
        });
        const granter = new Granter();
        granter.customer = contact;
        Object.assign(granter, {
          ...req.body,
        });

        await this.getRepository(Granter).save(granter);

        this.success(res, granter, 200);
      } catch (err) {
        this.failed(err, next, 400);
      }
    },
    {
      params: { id: 0 },
      body: {} as any,
    }
  );

  uploadDocuments = requestHandler(
    async (req, res, next) => {
      this.validateErr(req.params, "id");

      const files = req.files as any[];

      if (!files) {
        throw new ErrorHandler("File not found", 404);
      }

      const contact = await this.repository.findOneOrFail({
        where: {
          id: parseInt(req.params.id),
        },
      });

      let documentStr = "";
      files.forEach((file) => {
        documentStr += "/uploads/" + file.filename + ",";
      });

      contact.documents += documentStr;
      contact.documents = contact.documents.replace("null", "");

      await this.repository.save(contact);

      this.success(res, contact, 200);
    },
    {
      params: { id: "" },
    }
  );

  approveCustomer = requestHandler(
    async (req, res, next) => {
      try {
        this.validateErr(req.params, "id");

        const custoemr = await this.repository.findOne({
          where: {
            id: parseInt(req.params.id),
          },
        });

        if (!custoemr) {
          throw new ErrorHandler("Customer not found", 404);
        }

        if (custoemr.granter.length < 2) {
          throw new ErrorHandler("Customer must have atleast 2 granter", 404);
        }

        custoemr.approved = true;
        await this.repository.save(custoemr);

        this.success(res, custoemr, 200);
      } catch (error) {
        this.failed(error, next);
      }
    },
    {
      params: { id: "" },
    }
  );

  collectInstallment = requestHandler(
    async (req, res, next) => {
      try {
        this.validateErr(req.body, "amount");
        this.validateErr(req.params, "id");

        const installment = await this.getRepository(Installments).findOne({
          where: {
            id: parseInt(req.params.id),
          },
          relations: {
            customer: true,
            invoice: true,
          },
        });

        if (!installment) {
          throw new ErrorHandler("Installment not found", 404);
        }

        const paid_amount = Number.parseInt(req.body?.amount);

        // Gettings All Installments that are not paid
        const invoice = await this.getRepository(Invoice)
          .createQueryBuilder("iv")
          .leftJoinAndSelect("iv.installments", "installments")
          .where("iv.id = :id", { id: installment.invoice.id })
          .andWhere("installments.paid = :paid", { paid: false })
          .getOneOrFail();

        if (paid_amount < 1) {
          throw new ErrorHandler("Amount must be greater than 0", 404);
        }

        if (paid_amount > installment.amount) {
          // Update last installment
          const lastInstallment =
            invoice.installments[invoice.installments.length - 1];

          if (lastInstallment.amount === paid_amount - installment.amount) {
            lastInstallment.paid = true;
            lastInstallment.amount = 0;
          } else {
            lastInstallment.amount = paid_amount - installment.amount;
          }
          installment.amount = 0;
          installment.paid = true;
          await this.getRepository(Installments).save(lastInstallment);
        } else if (paid_amount < installment.amount) {
          // Update second installment
          const secondInstallment = invoice.installments[1];
          secondInstallment.amount =
            secondInstallment.amount + (installment.amount - paid_amount);
          await this.getRepository(Installments).save(secondInstallment);

          installment.amount = 0;
          installment.paid = true;
        } else {
          installment.amount = 0;
          installment.paid = true;
        }

        await AccountController.updateBalance(
          paid_amount,
          TransactionType.DEBIT
        );

        const payment = this.createPayment(
          installment.customer,
          paid_amount,
          req,
          0,
          "COLLECT_INSTALLMENT"
        );
        await this.getRepository(PaymentOption).save(payment);
        await this.getRepository(Installments).save(installment);
        this.success(res, installment);
      } catch (err) {
        this.failed(err, next);
      }
    },
    {
      body: {} as any,
      params: { id: "" },
    }
  );

  private createPayment(
    contact: Customer,
    amount: number,
    req: any,
    changeAmount: number,
    type: string
  ) {
    contact.due -= amount;

    const payment = new PaymentOption();
    payment.type = type;
    payment.amount = contact.due;
    payment.paid_amount = amount;
    payment.payment_method = PaymentMethod.CASH;
    payment.payment_status = payment.amount
      ? PaymentStatus.DUE
      : PaymentStatus.PAID;
    payment.due_amount = contact.due > 0 ? contact.due : 0;
    payment.change_amount = changeAmount > 0 ? changeAmount : 0;
    payment.recived_by = "Owner";
    payment.reciver_id = req.user?.id;
    payment.contact = contact;
    return payment;
  }
}
