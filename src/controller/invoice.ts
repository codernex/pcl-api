import {
  Cart,
  Customer,
  Invoice,
  PaymentMethod,
  PaymentOption,
  PaymentStatus,
  Product,
} from "../entities";
import { requestHandler } from "../utils";
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
          "customer_id"
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
        let discountAmount = req.body.discount || 0;
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

        const payment = this.createPayment(
          amount_after_discount,
          paid_amount,
          contact,
          req,
          discountAmount
        );

        if (due_amount > 0) {
          if (contact.credit_limit > 0 && contact.credit_limit < due_amount) {
            throw new Error("Credit limit exceeded");
          }
          contact.due += due_amount > 0 ? due_amount : 0;
          contact.credit_limit -= due_amount > 0 ? due_amount : 0;
          await contact.save();
          payment.payment_status = PaymentStatus.DUE;
        } else {
          payment.payment_status = PaymentStatus.PAID;
        }

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

        const cartsData: Cart[] = [];

        // Creating cart for invoice
        await this.addToCarts(carts, invoice, cartsData);

        await this.repository.save(invoice);
        this.success(res, { ...invoice, carts: cartsData }, 201);
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
      },
    }
  );

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

  getInvoice = requestHandler(async (req, res, next) => {
    try {
      const invoices = await this.repository
        .createQueryBuilder("iv")
        .leftJoinAndSelect("iv.business", "b")
        .leftJoinAndSelect("iv.contact", "co")
        .leftJoinAndSelect("iv.payment", "p")
        .leftJoinAndSelect("iv.carts", "cart")
        .where("b.id=:id", { id: req.user?.business.id })
        .orderBy("iv.created_at", "DESC")
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
}
