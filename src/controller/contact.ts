import {
  Customer,
  Granter,
  Payment,
  Project,
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
          payments: true,
        },
        order: {
          payments: {
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
        this.validateErr(req.body, "amount", "accountId", "projectId");

        if (!req.user) {
          throw new Error("Unauthorized user");
        }

        const contact = await this.repository.findOneOrFail({
          where: {
            id: req.params.id,
          },
          relations: {
            payments: true,
          },
        });

        const project = await this.getRepository(Project).findOne({
          where: {
            id: req.body.projectId,
          },
        });

        if (!project) {
          throw new ErrorHandler("Project not found", 404);
        }

        const amount = Number.parseFloat(req.body.amount);
        const changeAmount = Math.max(amount - contact.due, 0);

        if (project.dueAmount < amount) {
          throw new ErrorHandler("Can't pay more than due amount", 404);
        }

        if (contact.due < amount) {
          throw new ErrorHandler("Can't pay more than due amount", 404);
        }

        project.dueAmount = Math.max(project.dueAmount - amount, 0);
        project.paidAmount= Number(project.paidAmount) + amount;
        contact.due = Math.max(Number(contact.due) - amount, 0);
        const account = await AccountController.currentAccount(
          req.body.accountId
        );

        await AccountController.updateBalance(
          amount - changeAmount,
          req.body.accountId,
          TransactionType.CREDIT,
          "COLLECT_DUE",
          "Collect Due From Customer",
          contact
        );

        const payment = new Payment();
        payment.paidAmount = amount;
        payment.customer = contact;
        payment.account = req.body.paymentMethod;
        payment.account = account;
        payment.project = project;
        payment.paymentMethod= req.body.paymentMethod;
        payment.refference= req.body.refference;

        await this.getRepository(Project).save(project);
        const collectDue = await this.getRepository(Payment).save(payment);

        this.success(res, collectDue, 200);
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
}
