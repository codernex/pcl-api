import {
  Account,
  AccountHistory,
  AccountState,
  AccountType,
  TransactionType,
} from "../entities";
import { requestHandler } from "../utils";
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

        if (req.body.accountType === AccountType.CASH) {
          const isExist = await this.repository.findOneBy({
            accountName: "CASH_REGISTER",
          });
          if (isExist) {
            return this.failed("Cash register already exist", next);
          }
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
        this.validateErr(req.params, "id");
        this.validateErr(req.body, "accountState");
        this.isValidEnum(AccountState, req.body.accountState as AccountState);
        const account = await this.repository.findOneBy({
          id: Number(req.params.id),
        });
        if (!account) {
          return this.failed("Account not found", next);
        }
        return this.success(res, account);
      } catch (err) {
        return this.failed(err, next);
      }
    },
    {
      params: {
        id: "",
      },
      body: {} as any,
    }
  );
}
