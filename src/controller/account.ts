import {
  Account,
  AccountHistory,
  AccountType,
  AmountTransfer,
  Customer,
  TransactionType,
} from "../entities";
import { appDataSource } from "../orm.config";
import { encodeCursor, ErrorHandler, isDateValid, parseCursorParams, requestHandler } from "../utils";
import { Controller } from "./base";

export class AccountController extends Controller<Account> {
  constructor() {
    super(Account);
  }
  create = requestHandler(
    async (req, res, next) => {
      try {
        this.validateErr(req.body, "accountType", "accountName");
        this.isValidEnum(AccountType, req.body.accountType as AccountType);

        const account = new Account();
        Object.assign(account, req.body);
        account.balance = req.body.openingBalance.toString();
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
      const account = await this.repository
        .createQueryBuilder("a")
        .leftJoinAndSelect("a.accountHistory", "ah")
        .orderBy("a.id", "DESC")
        .orderBy("ah.id", "DESC")
        .getMany();
      return this.success(res, account);
    } catch (err) {
      return this.failed(err, next);
    }
  });

  getAccountHistory = requestHandler(
    async (req, res, next) => {
      try {
        this.validateErr(req.params, "accountId");
        const { cursor, limit } = parseCursorParams(req.query);

        const qb = this.getRepository(AccountHistory)
          .createQueryBuilder("ah")
          .leftJoinAndSelect("ah.account", "a")
          .leftJoinAndSelect("ah.customer", "c")
          .andWhere("a.id = :accountId", { accountId: req.params.accountId });

        if (req.query.startDate && req.query.endDate) {
          const isValid = isDateValid(req.query.startDate, req.query.endDate);
          if (!isValid) {
            return this.failed("Invalid Date", next);
          }
          qb.andWhere("DATE(ah.createdAt) BETWEEN :startDate AND :endDate", {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
          });
        }

        const totalCount = await qb.getCount();

        if (cursor) {
          qb.andWhere("ah.id < :cursor", { cursor });
        }

        const items = await qb
          .orderBy("ah.id", "DESC")
          .take(limit + 1)
          .getMany();

        const hasMore = items.length > limit;
        if (hasMore) items.pop();
        const nextCursor =
          hasMore && items.length > 0
            ? encodeCursor(items[items.length - 1].id)
            : null;

        return this.successPaginated(res, {
          items,
          nextCursor,
          hasMore,
          totalCount,
        });
      } catch (err) {
        return this.failed(err, next);
      }
    },
    {
      query: {} as any,
      params: {} as { accountId: number },
    }
  );

  transferAmount = requestHandler(
    async (req, res, next) => {
      this.validateErr(req.body, "senderAccount", "receiverAccount", "amount");
      const cost = parseInt(req.body.cost) || 0;
      const amount = parseInt(req.body.amount) || 0;

      if (req.body.senderAccount === req.body.receiverAccount) {
        return this.failed("Sender and Receiver account can not be same", next);
      }
      const sender = await AccountController.currentAccount(
        req.body.senderAccount
      );
      const receiver = await AccountController.currentAccount(
        req.body.receiverAccount
      );

      const transfer = new AmountTransfer();

      transfer.sender = sender;
      transfer.reciever = receiver;
      transfer.amount = amount;
      transfer.cost = cost;

      await AccountController.updateBalance(
        amount + cost,
        req.body.senderAccount,
        TransactionType.DEBIT,
        "Balance Transfer",
        "Transfer amount from this account"
      );

      await AccountController.updateBalance(
        amount,
        req.body.receiverAccount,
        TransactionType.CREDIT,
        "Balance Transfer",
        "Received amount to this account"
      );

      await this.getRepository(AmountTransfer).save(transfer);

      return this.success(res, transfer, 201);
    },
    {
      body: {} as {
        senderAccount: number;
        receiverAccount: number;
        amount: string;
        cost: string;
      },
    }
  );

  getTransferHisoty = requestHandler(async (req, res, next) => {
    try {
      const { cursor, limit } = parseCursorParams(req.query);

      const qb = this.getRepository(AmountTransfer)
        .createQueryBuilder("at")
        .leftJoinAndSelect("at.sender", "s")
        .leftJoinAndSelect("at.reciever", "r")
        .orderBy("at.id", "DESC");

      const totalCount = await qb.getCount();

      if (cursor) {
        qb.andWhere("at.id < :cursor", { cursor });
      }

      const items = await qb.take(limit + 1).getMany();

      const hasMore = items.length > limit;
      if (hasMore) items.pop();
      const nextCursor =
        hasMore && items.length > 0
          ? encodeCursor(items[items.length - 1].id)
          : null;

      return this.successPaginated(res, {
        items,
        nextCursor,
        hasMore,
        totalCount,
      });
    } catch (error) {
      return this.failed(error, next);
    }
  });

  static async currentAccount(accountId: number): Promise<Account> {
    const account = await appDataSource.getRepository(Account).findOne({
      where: {
        id: accountId,
      },
      relations: {
        accountHistory: true,
      },
    });

    if (!account) {
      throw new ErrorHandler("Cash Book Not found", 404);
    }
    return account;
  }

  static async updateBalance(
    amount: number,
    accountId: number,
    type: TransactionType,
    remarkType?: string,
    remark?: string,
    customer?: Customer
  ) {
    if (
      amount === 0 ||
      !amount ||
      amount === undefined ||
      amount === null ||
      Number.isNaN(amount)
    )
      return;

    const account = await AccountController.currentAccount(accountId);

    if (type === "CREDIT") {
      account.balance = Math.round(
        parseInt(account.balance) + parseInt(amount?.toString())
      ).toString();
    } else {
      if (parseInt(account.balance) < parseInt(amount?.toString())) {
        throw new ErrorHandler("Insufficient Balance", 404);
      }
      account.balance = Math.round(
        parseInt(account.balance) - parseInt(amount?.toString())
      ).toString();
    }

    const history = new AccountHistory();
    if (customer) {
      history.customer = customer;
    }
    history.account = account;
    history.amount = parseInt(amount?.toString());
    history.transactionType = type;
    history.type = remarkType ?? "";
    history.remark = remark ?? "";
    await appDataSource.getRepository(AccountHistory).save(history);
  }
}
