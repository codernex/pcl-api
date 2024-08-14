import { format } from "date-fns";
import {
  Account,
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
import { ErrorHandler, requestHandler } from "../utils";
import { Controller } from "./base";
import { AccountController } from "./account";

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
          ? Number.parseFloat(req.body.transport_cost)
          : 0;
        const paid_amount = req.body.paid_amount
          ? Number.parseFloat(req.body.paid_amount)
          : 0;
        const total_amount = Number.parseFloat(req.body.total_amount);
        let discountAmount =
          Number.parseFloat(req.body.discount?.toString()) || 0;
        if (req.body.discountType === "PERCENTAGE") {
          discountAmount = Math.fround((total_amount * discountAmount) / 100);
        } else {
          discountAmount = discountAmount;
        }
        const amount_after_discount = parseFloat(
          (total_amount - discountAmount).toFixed(2)
        );
        const change_amount = parseFloat(
          (paid_amount - amount_after_discount).toFixed(2)
        );
        const due_amount = parseFloat(
          (amount_after_discount - paid_amount).toFixed(2)
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

        // Creating payment
        const payment = this.createPayment(
          amount_after_discount,
          paid_amount,
          contact,
          req,
          discountAmount
        );

        if (due_amount > 0) {
          contact.due += due_amount > 0 ? due_amount : 0;
          await contact.save();
          payment.payment_status = PaymentStatus.DUE;
        } else {
          payment.payment_status = PaymentStatus.PAID;
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
        // Creating installment For this Invoice
        if (req.body.salesType === "HIRE" && contact.approved) {
          installments = await this.createInstallment(
            invoice,
            contact,
            due_amount,
            req.body.installment_period
          );
        } else if (req.body.salesType === "HIRE" && !contact.approved) {
          throw new ErrorHandler("Customer is not approved", 400);
        }

        const cartsData: Cart[] = [];

        // Creating cart for invoice
        await this.addToCarts(carts, invoice, cartsData);
        await this.updateAccount(paid_amount - change_amount || 0);
        await this.repository.save(invoice);

        this.success(res, { ...invoice, carts: cartsData, installments }, 201);
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
      },
    }
  );
  getInvoice = requestHandler(async (req, res, next) => {
    try {
      const invoices = await this.repository
        .createQueryBuilder("iv")
        .leftJoinAndSelect("iv.business", "b")
        .leftJoinAndSelect("iv.contact", "co")
        .leftJoinAndSelect("iv.payment", "p")
        .leftJoinAndSelect("iv.carts", "cart")
        .leftJoinAndSelect("iv.installments", "i")
        .where("b.id=:id", { id: req.user?.business.id })
        .orderBy("iv.created_at", "DESC")
        .orderBy("STR_TO_DATE(i.date, '%d-%m-%Y')", "DESC")
        .getMany();

      this.success(res, invoices);
    } catch (error) {
      this.failed(error, next);
    }
  });

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

  private async updateAccount(amount: number) {
    /**
     * Update Cash Book
     */
    const account = await AccountController.currentAccount();
    account.balance += amount;
    const history = new AccountHistory();
    history.account = account;
    history.amount = amount;
    history.transactionType = TransactionType.CREDIT;
    await this.getRepository(AccountHistory).save(history);
  }
}
