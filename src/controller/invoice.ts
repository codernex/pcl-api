import { In } from "typeorm";
import {
  Cart,
  Contacts,
  Invoice,
  PaymentMethod,
  PaymentOption,
  PaymentStatus,
  Product,
} from "../entities";
import { ApiError, requestHandler } from "../utils";
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
          "paid_amount",
          "payment_method",
          "customer_id",
          "transport_cost"
        );

        this.isValidEnum(PaymentMethod, req.body.payment_method);
        /**
         * Error Handling part done
         */

        const transport_cost = Number.parseFloat(req.body.transport_cost);
        const paid_amount = Number.parseFloat(req.body.paid_amount);
        const total_amount =
          Number.parseFloat(req.body.total_amount) + transport_cost;
        const change_amount = paid_amount - total_amount;
        const due_amount = total_amount - paid_amount;
        console.log("🚀 ~ InvoiceController ~ due_amount:", due_amount);
        console.log("🚀 ~ InvoiceController ~ change_amount:", change_amount);
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
        const contact = await this.getRepository(Contacts)
          .createQueryBuilder()
          .where("id = :id", { id: req.body.customer_id })
          .getOneOrFail();
        const payment = new PaymentOption();
        payment.amount = paid_amount;
        payment.contact = contact;
        payment.type = "SELLS";
        payment.recived_by = req.user.id.toString();
        payment.reciver_id = req.user.id;
        payment.payment_method = req.body.payment_method;
        if (due_amount > 0) {
          if (contact.credit_limit < due_amount) {
            throw new Error("Credit limit exceeded");
          }
          contact.due = due_amount;
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
        invoice.transport_cost=transport_cost?transport_cost:0

        if (due_amount > 0) {
          invoice.status = PaymentStatus.DUE;
        } else {
          invoice.status = PaymentStatus.PAID;
        }

        // Creating cart for invoice
        for (const { id, ...cart } of carts) {
          const product = await this.getRepository(Product).findOneOrFail({
            where: { id: id.toString() },
          });
          if (product.quantity < cart.quantity) {
            throw new Error("Product quantity is not available");
          }
          await this.updateProduct(id?.toString(), cart.quantity);
          const cartData = new Cart();
          Object.assign(cartData, { ...cart, product_id: id });
          cartData.invoice = invoice;
          await this.getRepository(Cart).save(cartData);
        }

        await this.repository.save(invoice);
        this.success(res, invoice, 201);
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
        .where("b.id=:id", { id: req.user?.business.id })
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
