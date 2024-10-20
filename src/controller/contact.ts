import {
  Customer,
  Granter,
  PaymentMethod,
  PaymentOption,
  PaymentStatus,
  SavingDeposit,
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
        this.validateErr(
          req.body,
          "name",
          "mobile",
          "company_name",
          "designation"
        );

        // Handling Error
        const contact = new Customer();
        Object.assign(contact, {
          ...req.body,
          opening_balance: parseInt(req.body.opening_balance) || 0,
          credit_limit: parseInt(req.body.credit_limit) || 0,
          due: parseInt(req.body.opening_balance) || 0,
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
        this.validateErr(req.body, "amount", "paymentMethod", "accountId");

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
        const changeAmount = Math.max(amount - contact.due, 0);
        if (contact.due < amount) {
          throw new ErrorHandler("Can't pay more than due amount", 404);
        }
        const payment = await this.createCashPayment(
          contact,
          amount - changeAmount,
          req,
          changeAmount,
          "COLLECT_DUE"
        );
        await AccountController.updateBalance(
          amount - changeAmount,
          req.body.accountId,
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

  deposit = requestHandler(
    async (req, res, next) => {
      try {
        this.validateErr(req.body, "amount", "customerId", "accountId");
        const contact = await this.repository.findOneOrFail({
          where: {
            id: req.body.customerId,
          },
        });

        const amount = Number.parseInt(req.body?.amount) || 0;
        const cost = Number.parseInt(req.body?.cost) || 0;

        const account = await AccountController.currentAccount(
          req.body.accountId
        );

        contact.savings = parseInt(contact.savings.toString()) + amount;

        const deposit = new SavingDeposit();
        deposit.amount = amount;
        deposit.customer = contact;
        deposit.cost = cost;

        await AccountController.updateBalance(
          deposit.amount - deposit.cost,
          req.body.accountId,
          TransactionType.CREDIT,
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

  private async createCashPayment(
    contact: Customer,
    amount: number,
    req: any,
    changeAmount: number,
    type: string
  ) {
    contact.due = contact.due - amount || 0;

    await this.repository.save(contact);
    const payment = new PaymentOption();
    payment.type = type;
    payment.amount = contact.due;
    payment.paid_amount = amount;
    payment.payment_method = PaymentMethod.CASH;
    payment.payment_status = payment.amount
      ? PaymentStatus.DUE
      : PaymentStatus.PAID;
    payment.payment_by_id = contact.id;
    payment.due_amount = contact.due > 0 ? contact.due : 0;
    payment.change_amount = changeAmount > 0 ? changeAmount : 0;
    payment.recived_by = "Owner";
    payment.reciver_id = req.user?.id;
    payment.contact = contact;
    return payment;
  }
}
