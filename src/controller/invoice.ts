// import { format } from "date-fns";
// import {
//   Cart,
//   Customer,
//   Installments,
//   Invoice,
//   PaymentMethod,
//   PaymentOption,
//   PaymentStatus,
//   Product,
//   TransactionType,
// } from "../entities";
// import { Seasonal } from "../entities/seasonal";
// import {
//   ErrorHandler,
//   isDateValid,
//   monthDifference,
//   requestHandler,
// } from "../utils";
// import { AccountController } from "./account";
// import { Controller } from "./base";

// export class InvoiceController extends Controller<Invoice> {
//   constructor() {
//     super(Invoice);
//   }
//   getInvoice = requestHandler(
//     async (req, res, next) => {
//       try {
//         const qb = this.repository
//           .createQueryBuilder("iv")
//           .leftJoinAndSelect("iv.business", "b")
//           .leftJoinAndSelect("iv.contact", "co")
//           .leftJoinAndSelect("iv.payments", "p")
//           .leftJoinAndSelect("iv.carts", "cart")
//           .leftJoinAndSelect("iv.installments", "i")
//           .andWhere("b.id=:id", { id: req.user?.business.id });

//         if (req.query.startDate && req.query.endDate) {
//           const isDate = isDateValid(req.query.startDate, req.query.endDate);

//           if (!isDate) {
//             return this.failed("Start date should be less than end date", next);
//           }
//           qb.andWhere("DATE(iv.created_at) BETWEEN :startDate AND :endDate", {
//             startDate: req.query.startDate,
//             endDate: req.query.endDate,
//           });
//         }
//         const invoices = await qb.orderBy("iv.created_at", "DESC").getMany();

//         this.success(res, invoices);
//       } catch (error) {
//         this.failed(error, next);
//       }
//     },
//     { query: {} as any }
//   );

//   async updateProduct(id: string, quantity: number) {
//     await this.getRepository(Product)
//       .createQueryBuilder()
//       .update()
//       .set({
//         quantity: () => `quantity - ${quantity}`,
//       })
//       .where("id = :id", { id })
//       .execute();
//   }

//   /**
//    *
//    * @param paid_amount
//    * @param contact
//    * @param req
//    *  @returns
//    * Creating payment option for invoice
//    */

//   private createPayment(
//     amount: number,
//     paid_amount: number,
//     contact: Customer,
//     req: any,
//     discount: number
//   ) {
//     const payment = new PaymentOption();
//     payment.amount = amount;
//     payment.paid_amount = paid_amount;
//     payment.contact = contact;
//     payment.type =
//       req.body.salesType === "HIRE" ||
//       req.body.salesType === "SAVINGS_HIRE" ||
//       req.body.salesType === "SEASONAL"
//         ? "DOWN_PAYMENT"
//         : "SALES";
//     payment.recived_by = "Owner";
//     payment.reciver_id = contact.id;
//     payment.payment_method = req.body.payment_method;
//     payment.payment_status =
//       paid_amount < amount ? PaymentStatus.DUE : PaymentStatus.PAID;
//     payment.change_amount = paid_amount - amount > 0 ? paid_amount - amount : 0;
//     payment.due_amount = amount - paid_amount > 0 ? amount - paid_amount : 0;
//     payment.discount_amount = discount;
//     return payment;
//   }

//   /**
//    *
//    * @param carts
//    * @param invoice
//    * @param cartsData
//    * Adding product to cart
//    */
//   private async addToCarts(carts: Cart[], invoice: Invoice, cartsData: Cart[]) {
//     for (const { id, ...cart } of carts) {
//       const product = await this.getRepository(Product).findOneOrFail({
//         where: { id: id.toString() },
//       });
//       if (product.quantity < cart.quantity) {
//         throw new Error("Product quantity is not available");
//       }
//       await this.updateProduct(id?.toString(), cart.quantity);
//       const cartData = new Cart();
//       Object.assign(cartData, { ...cart, product_id: id });
//       cartData.invoice = invoice;
//       await this.getRepository(Cart).save(cartData);

//       cartsData.push(cartData);
//     }
//   }

//   /**
//    * Create Invoice
//    */
//   private createNewInvoice(
//     req: any,
//     total_amount: number,
//     paid_amount: number,
//     contact: Customer,
//     transport_cost: number,
//     discountAmount: number,
//     totalQty: number,
//     change_amount: number,
//     amount_after_discount: number,
//     due_amount: number
//   ): Invoice {
//     const invoice = new Invoice();

//     invoice.business = req.user.business;
//     invoice.total_amount = total_amount;
//     invoice.paid_amount = paid_amount;
//     invoice.contact = contact;
//     invoice.due_amount = due_amount > 0 ? due_amount : 0;
//     invoice.change_amount = change_amount > 0 ? change_amount : 0;
//     invoice.quantity = totalQty;
//     invoice.transport_cost = transport_cost;
//     invoice.discountType = req.body.discountType;
//     invoice.sales_type = req.body.salesType;
//     invoice.interest_rate = req.body.interest_rate;
//     invoice.discount =
//       req.body.discountType === "PERCENTAGE"
//         ? (discountAmount / total_amount) * 100
//         : discountAmount;
//     invoice.amount_after_discount = amount_after_discount;

//     if (due_amount > 0) {
//       invoice.status = PaymentStatus.DUE;
//     } else {
//       invoice.status = PaymentStatus.PAID;
//     }
//     return invoice;
//   }

//   /**
//    * Create Installment
//    */

//   private async createInstallment(
//     invoice: Invoice,
//     contact: Customer,
//     due_amount: number,
//     installment_period: number
//   ): Promise<Installments[]> {
//     const installment_amount = Math.round(due_amount / installment_period);
//     const installments: Installments[] = [];
//     for (let i = 1; i <= installment_period; i++) {
//       const installment = new Installments();
//       installment.amount = installment_amount;
//       installment.invoice = invoice;
//       installment.customer = contact;
//       installment.actual_amount = installment_amount;

//       // Calculate the due date for each installment
//       const dueDate = new Date();
//       dueDate.setMonth(dueDate.getMonth() + i); // Assuming monthly installments

//       // Set the due date in the installment
//       installment.date = format(dueDate, "dd-MM-yyyy");

//       // Save the installment to the database (assuming you have a repository for Installments)
//       await this.getRepository(Installments).save(installment);

//       installments.push(installment);
//     }
//     return installments;
//   }

//   private async createSeasonalSales(
//     invoice: Invoice,
//     contact: Customer,
//     due_amount: number,
//     payment_seasonal: number,
//     payment_till_date: string
//   ): Promise<Seasonal[]> {
//     const installment_amount = Math.round(due_amount / payment_seasonal);
//     const seasonals: Seasonal[] = [];
//     for (let i = payment_seasonal; i >= 1; i--) {
//       const seasonal = new Seasonal();
//       seasonal.amount = installment_amount;
//       seasonal.invoice = invoice;
//       seasonal.customer = contact;
//       seasonal.actual_amount = installment_amount;
//       // Calculate the due date for each installment
//       const currentDate = new Date();
//       const dueDate = new Date(payment_till_date);

//       const monthDiff = monthDifference(currentDate, dueDate);
//       currentDate.setMonth(currentDate.getMonth() + monthDiff / i); // Assuming monthly instal
//       // Set the due date in the installment
//       seasonal.date = format(currentDate, "dd-MM-yyyy");
//       // Save the installment to the database (assuming you have a repository for Installments)
//       await this.getRepository(Seasonal).save(seasonal);
//       seasonals.push(seasonal);
//     }
//     return seasonals;
//   }
// }
