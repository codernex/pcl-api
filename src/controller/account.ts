import {
  Account,
  AccountHistory,
  AccountState,
  AccountType,
  TransactionType,
} from "../entities";
import { appDataSource } from "../orm.config";
import { ErrorHandler, requestHandler } from "../utils";
import { Controller } from "./base";

export class AccountController extends Controller<Account> {
  constructor() {
    super(Account);
  }
  create = requestHandler(
    async (req, res, next) => {
      try {
        this.validateErr(req.body, "accountType");
        this.isValidEnum(AccountType, req.body.accountType as AccountType);

        const isExist = await this.repository.findOne({
          where: {
            accountName: "Cash Book",
          },
        });
        if (isExist) {
          return this.failed(
            "Cash Book is Reserved, Please use other name",
            next
          );
        }

        const account = new Account();
        Object.assign(account, req.body);
        account.balance = req.body.openingBalance;
        const accountHistory = new AccountHistory();
        accountHistory.account = account;
        accountHistory.amount = req.body.openingBalance;
        accountHistory.transactionType = TransactionType.OPENING_BALANCE;
        await this.getRepository(AccountHistory).save(accountHistory);
        return this.success(res, account, 201);
      } catch (err) {
        return this.failed(err, next);
      }
    },
    {
      body: {} as Partial<Account> & {
        openingBalance: number;
      },
    }
  );

  get = requestHandler(async (req, res, next) => {
    try {
      const account = await this.repository.find();
      return this.success(res, account);
    } catch (err) {
      return this.failed(err, next);
    }
  });

  updateCashRegister = requestHandler(
    async (req, res, next) => {
      try {
        this.validateErr(req.body, "accountState");
        this.isValidEnum(AccountState, req.body.accountState as AccountState);
        const account = await AccountController.currentAccount();
        Object.assign(account, req.body);
        await this.repository.save(account);
        return this.success(res, account);
      } catch (err) {
        return this.failed(err, next);
      }
    },
    {
      body: {} as any,
    }
  );
  static async currentAccount(): Promise<Account> {
    const account = await appDataSource.getRepository(Account).findOne({
      where: {
        accountName: "Cash Book",
      },
    });

    if (!account) {
      throw new ErrorHandler("Cash Book Not found", 404);
    }
    return account;
  }

  static async updateBalance(amount: number, type: TransactionType) {
    if (
      amount === 0 ||
      !amount ||
      amount === undefined ||
      amount === null ||
      Number.isNaN(amount)
    )
      return;

    const account = await AccountController.currentAccount();
    
    if (type === "DEBIT") {
      account.balance += amount;
    } else {
      account.balance -= amount;
    }
    const history = new AccountHistory();
    history.account = account;
    history.amount = amount;
    history.transactionType = type;
    await appDataSource.getRepository(AccountHistory).save(history);
  }
}
