import { format } from "date-fns";
import { Like } from "typeorm";
import {
  Customer,
  Granter,
  Installments,
  Invoice,
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

        const isExist = await this.repository.count({
          where: {
            account_number: req.body.account_number,
          },
        });

        if (isExist) {
          return this.failed(
            "Customer Already Exist with this Account Number",
            next
          );
        }

        const currentDate = new Date();

        // Set the time to the start of the day (midnight)
        currentDate.setHours(0, 0, 0, 0);

        // Handling Error
        const contact = new Customer();

        if (req.body.account_number) {
          contact.account_number = req.body.account_number;
        } else {
          const count = await this.repository.count({
            where: {
              account_number: Like(`${format(currentDate, "yyyyMM")}%`),
            },
          });
          contact.account_number =
            format(currentDate, "yyyyMM") +
            (count + 1).toString().padStart(3, "0");
        }

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
          seasonal: true,
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
        const changeAmount = Math.max(amount - contact.cash_due, 0);
        if (contact.cash_due < amount) {
          throw new ErrorHandler("Can't pay more than due amount", 404);
        }
        const payment = this.createCashPayment(
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
        this.validateErr(req.body, "amount", "installmentId", "customerId");

        const customer = await this.getRepository(Customer).findOne({
          where: {
            id: req.body.customerId,
          },
        });

        if (!customer) {
          throw new ErrorHandler("Customer not found", 404);
        }

        if (customer.is_hire_account_closed) {
          throw new ErrorHandler("Customer's hire account is closed", 404);
        }

        const installment = await this.getRepository(Installments).findOne({
          where: {
            id: req.body.installmentId,
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

        const totalInstallmentAmount = invoice.installments.reduce(
          (total, installment) => total + installment.amount,
          0
        );

        if (paid_amount > totalInstallmentAmount) {
          throw new ErrorHandler(
            "Amount must be less than or equal to total installment amount",
            404
          );
        }

        if (invoice.installments.length === 1) {
          this.handleSingleInstallment(installment, paid_amount);
        } else {
          await this.handleMultipleInstallments(
            installment,
            paid_amount,
            invoice
          );
        }

        await AccountController.updateBalance(
          paid_amount,
          TransactionType.DEBIT
        );

        const payment = this.createHirePayment(
          installment.customer,
          paid_amount,
          req,
          0,
          invoice.installments.length === 1
            ? "COLLECT_LPR"
            : "COLLECT_INSTALLMENT"
        );
        await this.getRepository(PaymentOption).save(payment);
        await this.getRepository(Installments).save(installment);
        this.success(res, { payment, installment }, 200);
      } catch (err) {
        this.failed(err, next);
      }
    },
    {
      body: {} as any,
    }
  );

  deposit = requestHandler(
    async (req, res, next) => {
      try {
        this.validateErr(req.body, "amount", "customerId");
        const contact = await this.repository.findOneOrFail({
          where: {
            id: req.body.customerId,
          },
        });

        contact.savings += Number.parseInt(req.body?.amount);

        await contact.save();

        this.success(res, contact);
      } catch (error) {
        return this.failed(error, next);
      }
    },
    {
      body: {} as any,
    }
  );

  collectLPR = requestHandler(
    async (req, res, next) => {
      try {
        this.validateErr(req.body, "amount", "customerId");

        const customer = await this.repository.findOne({
          where: {
            id: req.body.customerId,
          },
        });

        if (!customer) {
          return this.failed("Customer not found", next);
        }

        if (customer.is_hire_account_closed) {
          throw new ErrorHandler("Customer's hire account is closed", 404);
        }
        customer.is_hire_account_closed = true;

        const payment = this.createHirePayment(
          customer,
          req.body.amount,
          req,
          0,
          "COLLECT_LPR"
        );
        await AccountController.updateBalance(
          Number.parseInt(req.body.amount),
          TransactionType.DEBIT
        );
        await this.getRepository(PaymentOption).save(payment);

        this.success(res, payment);
      } catch (err) {
        return this.failed(err, next);
      }
    },
    {
      body: {} as any,
    }
  );

  private createCashPayment(
    contact: Customer,
    amount: number,
    req: any,
    changeAmount: number,
    type: string
  ) {
    contact.cash_due = contact.cash_due - amount || 0;

    const payment = new PaymentOption();
    payment.type = type;
    payment.amount = contact.cash_due;
    payment.paid_amount = amount;
    payment.payment_method = PaymentMethod.CASH;
    payment.payment_status = payment.amount
      ? PaymentStatus.DUE
      : PaymentStatus.PAID;
    payment.payment_by_id = contact.id;
    payment.due_amount = contact.cash_due > 0 ? contact.cash_due : 0;
    payment.change_amount = changeAmount > 0 ? changeAmount : 0;
    payment.recived_by = "Owner";
    payment.reciver_id = req.user?.id;
    payment.contact = contact;
    return payment;
  }

  private createHirePayment(
    contact: Customer,
    amount: number,
    req: any,
    changeAmount: number,
    type: string
  ) {
    contact.hire_due = Math.max(
      contact.hire_due - Number.parseInt(req.body?.amount),
      0
    );

    const payment = new PaymentOption();
    payment.type = type;
    payment.amount = contact.hire_due;
    payment.paid_amount = amount;
    payment.payment_method = PaymentMethod.CASH;
    payment.payment_status = payment.amount
      ? PaymentStatus.DUE
      : PaymentStatus.PAID;
    payment.due_amount = contact.hire_due > 0 ? contact.hire_due : 0;
    payment.change_amount = changeAmount > 0 ? changeAmount : 0;
    payment.recived_by = "Owner";
    payment.reciver_id = req.user?.id;
    payment.contact = contact;
    return payment;
  }

  private handleSingleInstallment = (
    installment: Installments,
    amount: number
  ) => {
    if (amount !== installment.amount) {
      throw new ErrorHandler(
        `LPR Amount must be exactly equal to the installment amount of ${installment.amount}`,
        404
      );
    }
    installment.paid = true;
    installment.amount = 0;
  };

  private handleMultipleInstallments = async (
    installment: Installments,
    amount: number,
    invoice: Invoice
  ) => {
    const lastInstallment =
      invoice.installments[invoice.installments.length - 1];

    const handleExcess = async (excessAmount: number) => {
      lastInstallment.amount -= excessAmount;

      if (lastInstallment.amount <= 0) {
        lastInstallment.paid = true;
        const extraAmount = Math.abs(lastInstallment.amount);
        lastInstallment.amount = 0;

        if (extraAmount > 0 && invoice.installments.length > 1) {
          const secondLastInstallment =
            invoice.installments[invoice.installments.length - 2];
          secondLastInstallment.amount -= extraAmount;

          if (secondLastInstallment.amount <= 0) {
            secondLastInstallment.paid = true;
            secondLastInstallment.amount = 0;
          }

          await this.getRepository(Installments).save(secondLastInstallment);
        }
      }

      await this.getRepository(Installments).save(lastInstallment);
    };

    if (amount > installment.amount) {
      const excessAmount = amount - installment.amount;
      await handleExcess(excessAmount);
    } else if (amount < installment.amount) {
      if (invoice.installments.length > 1) {
        const secondInstallment = invoice.installments[1];
        secondInstallment.amount += installment.amount - amount;
        await this.getRepository(Installments).save(secondInstallment);
      }
    }

    installment.amount = 0;
    installment.paid = true;
    await this.getRepository(Installments).save(installment);
  };
}
