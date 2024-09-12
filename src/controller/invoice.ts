import { format } from "date-fns";
import {
  AccountHistory,
  Cart,
  Customer,
  Installments,
  Invoice,
  PaymentMethod,
  PaymentOption,
  PaymentStatus,
  Product,
  TransactionType,
} from "../entities";
import { Seasonal } from "../entities/seasonal";
import {
  ErrorHandler,
  isDateValid,
  monthDifference,
  requestHandler,
} from "../utils";
import { AccountController } from "./account";
import { Controller } from "./base";

export class InvoiceController extends Controller<Invoice> {
  constructor() {
    super(Invoice);
  }

  createInvoice = requestHandler(
    async (req, res, next) => {
      try {
        if (!req.user) {
          throw new Error("Unauthorized");
        }

        this.validateErr(
          req.body,
          "carts",
          "total_amount",
          "payment_method",
          "customer_id",
          "salesType"
        );

        this.isValidEnum(PaymentMethod, req.body.payment_method);
        /**
         * Error Handling part done
         */

        const transport_cost = req.body.transport_cost
          ? Math.round(Number.parseFloat(req.body.transport_cost))
          : 0;
        const paid_amount = req.body.paid_amount
          ? Math.round(Number.parseFloat(req.body.paid_amount))
          : 0;

        const total_amount = Math.round(
          Number.parseFloat(req.body.total_amount)
        );

        let discountAmount =
          Number.parseFloat(req.body.discount?.toString()) || 0;
        if (req.body.discountType === "PERCENTAGE") {
          discountAmount = Math.round((total_amount * discountAmount) / 100);
        } else {
          discountAmount = Math.round(discountAmount);
        }
        const amount_after_discount = Math.round(
          parseFloat((total_amount - discountAmount).toFixed(2))
        );
        const change_amount = Math.round(
          parseFloat((paid_amount - amount_after_discount).toFixed(2))
        );
        const due_amount = Math.round(
          parseFloat((amount_after_discount - paid_amount).toFixed(2))
        );
        const carts = req.body.carts;

        if (carts.length === 0) {
          throw new Error("Cart is empty");
        }

        if (!(carts instanceof Array)) {
          throw new Error("Cart should be an array");
        }
        const totalQty = carts.reduce(
          (total, item) => total + item.quantity,
          0
        );

        // Searching for contact
        const contact = await this.getRepository(Customer)
          .createQueryBuilder()
          .where("id = :id", { id: req.body.customer_id })
          .getOneOrFail();

        if (req.body.salesType === "HIRE" && contact.hire_due) {
          return this.failed("This customer has a hire due", next);
        }

        if (req.body.salesType === "HIRE" && !contact.approved) {
          throw new ErrorHandler(
            "Customer is not approved For Hire Sales",
            400
          );
        }

        if (req.body.salesType === "SAVINGS_HIRE" && !contact.savingsCustomer) {
          return this.failed("This customer is not a savings customer", next);
        }

        if (
          req.body.salesType === "HIRE" &&
          contact.hire_due &&
          contact.is_hire_account_closed
        ) {
          return this.failed(
            "This customer has a closed hire account, with faults",
            next
          );
        }

        // Creating payment
        const payment = this.createPayment(
          amount_after_discount,
          paid_amount,
          contact,
          req,
          discountAmount
        );

        // Adding Contact Cash or Hire due

        if (req.body.salesType === "RETAIL") {
          if (due_amount > 0) {
            contact.cash_due += due_amount > 0 ? due_amount : 0;
            await contact.save();
            payment.payment_status = PaymentStatus.DUE;
          } else {
            payment.payment_status = PaymentStatus.PAID;
          }
        } else {
          if (due_amount > 0) {
            contact.hire_due += due_amount > 0 ? due_amount : 0;
            await contact.save();
            payment.payment_status = PaymentStatus.DUE;
          } else {
            payment.payment_status = PaymentStatus.PAID;
          }
        }

        // Creating invoice
        const invoice = this.createNewInvoice(
          req,
          total_amount,
          paid_amount,
          contact,
          transport_cost,
          discountAmount,
          totalQty,
          change_amount,
          amount_after_discount,
          payment,
          due_amount
        );

        let installments: Installments[] = [];
        let seasonals: Seasonal[] = [];

        // Creating installment For this Invoice
        if (
          req.body.salesType === "HIRE" ||
          req.body.salesType === "SAVINGS_HIRE"
        ) {
          installments = await this.createInstallment(
            invoice,
            contact,
            due_amount,
            req.body.installment_period
          );
        } else if (req.body.salesType === "SEASONAL") {
          seasonals = await this.createSeasonalSales(
            invoice,
            contact,
            due_amount,
            req.body.seasonal_payment_period,
            req.body.seasonal_due_date
          );
        }

        const cartsData: Cart[] = [];

        // Creating cart for invoice
        await this.addToCarts(carts, invoice, cartsData);
        await this.updateAccount(paid_amount - change_amount || 0);
        await this.repository.save(invoice);

        this.success(
          res,
          { ...invoice, carts: cartsData, installments, seasonals },
          201
        );
      } catch (error) {
        this.failed(error, next);
      }
    },
    {
      body: {} as {
        carts: Cart[];
        total_amount: string;
        paid_amount: string;
        payment_method: PaymentMethod;
        customer_id: number;
        transport_cost: string;
        discount: number;
        discountType: "FIXED" | "PERCENTAGE";
        salesType: string;
        installment_period: number;
        interest_rate: number;
        seasonal_due_date: string;
        seasonal_payment_period: number;
      },
    }
  );
  getInvoice = requestHandler(
    async (req, res, next) => {
      try {
        const qb = this.repository
          .createQueryBuilder("iv")
          .leftJoinAndSelect("iv.business", "b")
          .leftJoinAndSelect("iv.contact", "co")
          .leftJoinAndSelect("iv.payment", "p")
          .leftJoinAndSelect("iv.carts", "cart")
          .leftJoinAndSelect("iv.installments", "i")
          .andWhere("b.id=:id", { id: req.user?.business.id });

        if (req.query.startDate && req.query.endDate) {
          const isDate = isDateValid(req.query.startDate, req.query.endDate);

          if (!isDate) {
            return this.failed("Start date should be less than end date", next);
          }
          qb.andWhere("DATE(iv.created_at) BETWEEN :startDate AND :endDate", {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
          });
        }
        const invoices = await qb.orderBy("iv.created_at", "DESC").getMany();

        this.success(res, invoices);
      } catch (error) {
        this.failed(error, next);
      }
    },
    { query: {} as any }
  );

  async updateProduct(id: string, quantity: number) {
    await this.getRepository(Product)
      .createQueryBuilder()
      .update()
      .set({
        quantity: () => `quantity - ${quantity}`,
      })
      .where("id = :id", { id })
      .execute();
  }

  /**
   *
   * @param paid_amount
   * @param contact
   * @param req
   *  @returns
   * Creating payment option for invoice
   */

  private createPayment(
    amount: number,
    paid_amount: number,
    contact: Customer,
    req: any,
    discount: number
  ) {
    const payment = new PaymentOption();
    payment.amount = amount;
    payment.paid_amount = paid_amount;
    payment.contact = contact;
    payment.type = "SELLS";
    payment.recived_by = "Owner";
    payment.reciver_id = contact.id;
    payment.payment_method = req.body.payment_method;
    payment.payment_status =
      paid_amount < amount ? PaymentStatus.DUE : PaymentStatus.PAID;
    payment.change_amount = paid_amount - amount > 0 ? paid_amount - amount : 0;
    payment.due_amount = amount - paid_amount > 0 ? amount - paid_amount : 0;
    payment.discount_amount = discount;
    return payment;
  }

  /**
   *
   * @param carts
   * @param invoice
   * @param cartsData
   * Adding product to cart
   */
  private async addToCarts(carts: Cart[], invoice: Invoice, cartsData: Cart[]) {
    for (const { id, ...cart } of carts) {
      const product = await this.getRepository(Product).findOneOrFail({
        where: { id: id.toString() },
      });
      if (product.is_returned) {
        throw new Error("Product is Returned");
      }
      if (product.quantity < cart.quantity) {
        throw new Error("Product quantity is not available");
      }
      await this.updateProduct(id?.toString(), cart.quantity);
      const cartData = new Cart();
      Object.assign(cartData, { ...cart, product_id: id });
      cartData.invoice = invoice;
      await this.getRepository(Cart).save(cartData);

      cartsData.push(cartData);
    }
  }

  /**
   * Create Invoice
   */
  private createNewInvoice(
    req: any,
    total_amount: number,
    paid_amount: number,
    contact: Customer,
    transport_cost: number,
    discountAmount: number,
    totalQty: number,
    change_amount: number,
    amount_after_discount: number,
    payment: PaymentOption,
    due_amount: number
  ): Invoice {
    const invoice = new Invoice();

    invoice.business = req.user.business;
    invoice.total_amount = total_amount;
    invoice.paid_amount = paid_amount;
    invoice.payment = payment;
    invoice.contact = contact;
    invoice.due_amount = due_amount > 0 ? due_amount : 0;
    invoice.change_amount = change_amount > 0 ? change_amount : 0;
    invoice.quantity = totalQty;
    invoice.transport_cost = transport_cost;
    invoice.discountType = req.body.discountType;
    invoice.sales_type = req.body.salesType;
    invoice.interest_rate = req.body.interest_rate;
    invoice.discount =
      req.body.discountType === "PERCENTAGE"
        ? (discountAmount / total_amount) * 100
        : discountAmount;
    invoice.amount_after_discount = amount_after_discount;

    if (due_amount > 0) {
      invoice.status = PaymentStatus.DUE;
    } else {
      invoice.status = PaymentStatus.PAID;
    }
    return invoice;
  }

  /**
   * Create Installment
   */

  private async createInstallment(
    invoice: Invoice,
    contact: Customer,
    due_amount: number,
    installment_period: number
  ): Promise<Installments[]> {
    const installment_amount = Math.round(due_amount / installment_period);
    const installments: Installments[] = [];
    for (let i = 1; i <= installment_period; i++) {
      const installment = new Installments();
      installment.amount = installment_amount;
      installment.invoice = invoice;
      installment.customer = contact;

      // Calculate the due date for each installment
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i); // Assuming monthly installments

      // Set the due date in the installment
      installment.date = format(dueDate, "dd-MM-yyyy");

      // Save the installment to the database (assuming you have a repository for Installments)
      await this.getRepository(Installments).save(installment);

      installments.push(installment);
    }
    return installments;
  }

  private async createSeasonalSales(
    invoice: Invoice,
    contact: Customer,
    due_amount: number,
    payment_seasonal: number,
    payment_till_date: string
  ): Promise<Seasonal[]> {
    const installment_amount = Math.round(due_amount / payment_seasonal);
    const seasonals: Seasonal[] = [];
    for (let i = payment_seasonal; i >= 1; i--) {
      const seasonal = new Seasonal();
      seasonal.amount = installment_amount;
      seasonal.invoice = invoice;
      seasonal.customer = contact;
      // Calculate the due date for each installment
      const currentDate = new Date();
      const dueDate = new Date(payment_till_date);

      const monthDiff = monthDifference(currentDate, dueDate);
      currentDate.setMonth(currentDate.getMonth() + monthDiff / i); // Assuming monthly instal
      // Set the due date in the installment
      seasonal.date = format(currentDate, "dd-MM-yyyy");
      // Save the installment to the database (assuming you have a repository for Installments)
      await this.getRepository(Seasonal).save(seasonal);
      seasonals.push(seasonal);
    }
    return seasonals;
  }

  private async updateAccount(amount: number) {
    /**
     * Update Cash Book
     */
    const account = await AccountController.currentAccount();
    account.balance += amount;
    const history = new AccountHistory();
    history.account = account;
    history.amount = amount;
    history.transactionType = TransactionType.DEBIT; // Income
    await this.getRepository(AccountHistory).save(history);
  }
}
