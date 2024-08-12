import { Account, AccountHistory, Expense, TransactionType } from "../entities";
import { ErrorHandler, requestHandler } from "../utils";
import { Controller } from "./base";

export class ExpenseController extends Controller<Expense> {
  constructor() {
    super(Expense);
  }

  create = requestHandler(
    async (req, res, next) => {
      try {
        this.validateErr(
          req.body,
          "accountId",
          "amount",
          "expenseName",
          "expenseName"
        );

        const history = new AccountHistory();
        history.amount = req.body.amount;
        history.transactionType = TransactionType.DEBIT;

        const account = await this.getRepository(Account).findOneBy({
          id: Number(req.body.accountId),
        });
        if (!account) {
          throw new ErrorHandler("Account not found", 404);
        }

        if (history.amount > account.balance) {
          throw new ErrorHandler("Insufficient balance", 400);
        }

        // Deduction from account
        account.balance = account.balance - history.amount;
        history.account = account;
        await this.getRepository(AccountHistory).save(history);

        const expense = new Expense();
        Object.assign(expense, req.body);
        await this.repository.save(expense);
        return this.success(res, expense, 201);
      } catch (error) {
        this.failed(error, next);
      }
    },
    {
      body: {} as Expense & {
        accountId: string;
      },
    }
  );

  get = requestHandler(async (req, res, next) => {
    try {
      const expense = await this.repository.find();

      return this.success(res, expense);
    } catch (err) {
      this.failed(err, next);
    }
  });
}
