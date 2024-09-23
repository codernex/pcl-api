import { addMonths, format, parse } from "date-fns";
import { Like } from "typeorm";
import {
  Customer,
  Granter,
  Installments,
  Invoice,
  PaymentMethod,
  PaymentOption,
  PaymentStatus,
  SavingDeposit,
  TransactionType,
} from "../entities";
import {
  ApiError,
  ErrorHandler,
  getNextMonthDate,
  requestHandler,
} from "../utils";
import { AccountController } from "./account";
import { Controller } from "./base";
import { Seasonal } from "../entities/seasonal";

export class ContactController extends Controller<Customer> {
  constructor() {
    super(Customer);
  }

  createContact = requestHandler(
    async (req, res, next) => {
      try {
        this.validateErr(req.body, "name", "mobile");

        // Handling Error
        if (req.body.account_number && req.body.account_number.length > 0) {
          const isExist = await this.repository
            .createQueryBuilder("c")
            .where("c.account_number = :account_number", {
              account_number: req.body.account_number?.trim(),
            })
            .getOne();

          if (isExist) {
            return this.failed(
              "Customer Already Exist with this Account Number",
              next
            );
          }
        }
        const currentDate = new Date();

        // Set the time to the start of the day (midnight)
        currentDate.setHours(0, 0, 0, 0);

        // Handling Error
        const contact = new Customer();

        if (req.body.account_number && req.body.account_number.length > 0) {
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

        const isExist = await this.repository.count({
          where: {
            account_number: req.body.account_number,
          },
        });

        if (isExist) {
          throw new ErrorHandler(
            "Customer Already Exist with this Account Number",
            404
          );
        }

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
          TransactionType.DEBIT,
          "COLLECT_DUE",
          "Collect Retail Due From Customer",
          contact
        );
        await this.getRepository(PaymentOption).save(payment);

        this.success(res, payment, 200);
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

        if (custoemr.seasonal_approved) {
          throw new ErrorHandler(
            "Customer already approved for seasonal hire, can't approve for hire",
            404
          );
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

  seasonalApproved = requestHandler(
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

        if (custoemr.approved) {
          throw new ErrorHandler(
            "Customer already approved for hire, can't approve for seasonal hire",
            404
          );
        }

        custoemr.seasonal_approved = true;
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

        invoice.due_amount = Math.max(invoice.due_amount - paid_amount, 0);

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
          await this.handleSingleInstallment(installment, paid_amount);
        } else {
          await this.handleMultipleInstallments(
            installment,
            paid_amount,
            invoice
          );
        }

        await AccountController.updateBalance(
          paid_amount,
          TransactionType.DEBIT,
          "COLLECT_INSTALLMENT",
          "Collect Installment from customer",
          customer
        );

        const payment = this.createHirePayment(
          customer,
          paid_amount,
          req,
          0,
          "COLLECT_INSTALLMENT",
          invoice
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

  collectSeasonalInstallment = requestHandler(
    async (req, res, next) => {
      try {
        this.validateErr(req.body, "amount", "seasonalId", "customerId");

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

        const seasonal = await this.getRepository(Seasonal).findOne({
          where: {
            id: req.body.seasonalId,
          },
          relations: {
            customer: true,
            invoice: true,
          },
        });

        if (!seasonal) {
          throw new ErrorHandler("Seasonal Installment not found", 404);
        }

        const paid_amount = Number.parseInt(req.body?.amount);

        // Gettings All Installments that are not paid
        const invoice = await this.getRepository(Invoice)
          .createQueryBuilder("iv")
          .leftJoinAndSelect("iv.seasonals", "seasonals")
          .where("iv.id = :id", { id: seasonal.invoice.id })
          .andWhere("seasonals.paid = :paid", { paid: false })
          .getOneOrFail();

        if (paid_amount < 1) {
          throw new ErrorHandler("Amount must be greater than 0", 404);
        }

        const totalSeasonalAmount = invoice.seasonals.reduce(
          (total, installment) => total + installment.amount,
          0
        );

        if (paid_amount > totalSeasonalAmount) {
          throw new ErrorHandler(
            "Amount must be less than or equal to total seasonal installment amount",
            404
          );
        }

        invoice.due_amount = Math.max(invoice.due_amount - paid_amount, 0);

        if (invoice.seasonals.length === 1) {
          await this.handleSingleSeasonalInstallment(seasonal, paid_amount);
        } else {
          await this.handleMultipleSeasonalInstallment(
            seasonal,
            paid_amount,
            invoice
          );
        }

        await AccountController.updateBalance(
          paid_amount,
          TransactionType.DEBIT,
          "COLLECT_SEASONAL_INSTALLMENT",
          "Collect Installment from customer",
          customer
        );

        const payment = this.createHirePayment(
          customer,
          paid_amount,
          req,
          0,
          "COLLECT_SEASONAL_INSTALLMENT",
          invoice
        );
        await this.getRepository(PaymentOption).save(payment);
        await this.getRepository(Installments).save(seasonal);
        this.success(res, { payment, seasonal }, 200);
      } catch (error) {
        this.failed(error, next);
      }
    },
    {
      body: {} as any,
    }
  );

  revertInstallment = requestHandler(
    async (req, res, next) => {
      try {
        this.validateErr(req.body, "paymentId");

        const payment = await this.getRepository(PaymentOption).findOne({
          where: {
            id: req.body.paymentId,
          },
          relations: {
            contact: true,
          },
        });
        if (!payment) {
          return this.failed("Installment not found", next);
        }

        if (
          payment?.type === "COLLECT_SEASONAL_LPR" ||
          payment?.type === "COLLECT_LPR"
        ) {
          return this.failed("LPR Payment type cannot be reverted", next);
        }

        if (payment.contact.is_hire_account_closed) {
          return this.failed("Customer's hire account is closed", next);
        }

        const installment = new Installments();
        installment.actual_amount = 0;
        installment.amount = payment.paid_amount;
        installment.customer = payment.contact;
        installment.date = format(
          addMonths(payment.created_at, 1),
          "dd-MM-yyyy"
        );
        installment.paid = false;
        payment.contact.hire_due += payment.paid_amount;
        payment.isReverted = true;

        await AccountController.updateBalance(
          installment.amount,
          TransactionType.CREDIT,
          "REVERT_INSTALLMENT",
          "Revert Installment",
          payment.contact
        );

        await this.getRepository(Installments).save(installment);
        await this.getRepository(PaymentOption).save(payment);
        this.success(res, installment, 200);
      } catch (err) {
        return this.failed(err, next);
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

        const deposit = new SavingDeposit();
        deposit.amount = Number.parseInt(req.body?.amount);
        deposit.customer = contact;

        await AccountController.updateBalance(
          deposit.amount,
          TransactionType.DEBIT,
          "DEPOSIT_SAVINGS",
          "Deposit savings to savings customer",
          contact
        );

        await this.getRepository(SavingDeposit).save(deposit);

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
          TransactionType.DEBIT,
          "COLLECT_LPR",
          "Collect LPR from customer",
          customer
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
    type: string,
    invoice?: Invoice | undefined
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

  private handleSingleInstallment = async (
    installment: Installments,
    amount: number
  ) => {
    if (amount !== installment.amount) {
      const newInstallment = new Installments();
      newInstallment.amount = Math.max(installment.amount - amount, 0);
      newInstallment.paid = false;
      newInstallment.actual_amount = installment.actual_amount;
      newInstallment.customer = installment.customer;
      newInstallment.invoice = installment.invoice;
      newInstallment.date = format(
        getNextMonthDate(parse(installment.date, "dd-MM-yyyy", new Date())),
        "dd-MM-yyyy"
      );
      await this.getRepository(Installments).save(newInstallment);
      installment.paid = true;
      installment.amount = 0;
    } else {
      installment.paid = true;
      installment.amount = 0;
    }
  };
  private handleSingleSeasonalInstallment = async (
    seasonal: Seasonal,
    amount: number
  ) => {
    if (amount !== seasonal.amount) {
      const newInstallment = new Seasonal();
      newInstallment.amount = Math.max(seasonal.amount - amount, 0);
      newInstallment.paid = false;
      newInstallment.actual_amount = seasonal.actual_amount;
      newInstallment.customer = seasonal.customer;
      newInstallment.invoice = seasonal.invoice;
      newInstallment.date = format(
        getNextMonthDate(parse(seasonal.date, "dd-MM-yyyy", new Date())),
        "dd-MM-yyyy"
      );
      await this.getRepository(Seasonal).save(newInstallment);
      seasonal.paid = true;
      seasonal.amount = 0;
    } else {
      seasonal.paid = true;
      seasonal.amount = 0;
    }
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

  private handleMultipleSeasonalInstallment = async (
    installment: Seasonal,
    amount: number,
    invoice: Invoice
  ) => {
    const lastSeasonal = invoice.seasonals[invoice.seasonals.length - 1];

    const handleExcess = async (excessAmount: number) => {
      lastSeasonal.amount -= excessAmount;

      if (lastSeasonal.amount <= 0) {
        lastSeasonal.paid = true;
        const extraAmount = Math.abs(lastSeasonal.amount);
        lastSeasonal.amount = 0;

        if (extraAmount > 0 && invoice.seasonals.length > 1) {
          const secondLastSeasonal =
            invoice.seasonals[invoice.seasonals.length - 2];
          secondLastSeasonal.amount -= extraAmount;

          if (secondLastSeasonal.amount <= 0) {
            secondLastSeasonal.paid = true;
            secondLastSeasonal.amount = 0;
          }

          await this.getRepository(Seasonal).save(secondLastSeasonal);
        }
      }

      await this.getRepository(Seasonal).save(lastSeasonal);
    };

    if (amount > installment.amount) {
      const excessAmount = amount - installment.amount;
      await handleExcess(excessAmount);
    } else if (amount < installment.amount) {
      if (invoice.seasonals.length > 1) {
        const secondInstallment = invoice.seasonals[1];
        secondInstallment.amount += installment.amount - amount;
        await this.getRepository(Seasonal).save(secondInstallment);
      }
    }

    installment.amount = 0;
    installment.paid = true;
    await this.getRepository(Seasonal).save(installment);
  };
}
