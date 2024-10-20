// import {
//   Supplier,
//   Image,
//   Product,
//   ProductType,
//   Purchase,
//   PurchaseStatus,
//   TransactionType,
// } from "../entities";
// import {
//   PaymentMethod,
//   PaymentOption,
//   PaymentStatus,
// } from "../entities/paymentoption";
// import { PurchasedCart } from "../entities/purchased.cart";
// import { ApiError, generateRandomNumber, requestHandler } from "../utils";
// import { AccountController } from "./account";
// import { Controller } from "./base";
// import { ProductController } from "./product";

// interface ProductInfo {
//   product_id: string;
//   codes: string[];
//   quantity: number;
//   purchase_price: string;
//   product_type: string;
// }

// type PurchaseProduct = Product & {
//   purchase_qty: number;
// };

// export class PurchaseController extends Controller<Purchase> {
//   constructor() {
//     super(Purchase);
//   }
//   createPurchaseWithBarcode = requestHandler(
//     async (req, res, next) => {
//       try {
//         this.validateErr(
//           req.body,
//           "contact_id",
//           "status",
//           "products",
//           "product_type",
//           "amount",
//           "quantity"
//         );
//         this.isValidEnum(PurchaseStatus, req.body.status);

//         if (!req.user) {
//           throw new Error("Unauthorized access");
//         }

//         const { products: productsInfo } = req.body as {
//           products: ProductInfo[];
//         };

//         const amount = parseInt(req.body.amount) || 0;
//         const paid_amount = parseInt(req.body.paid_amount) || 0;
//         const due_amount = Math.max(amount - paid_amount, 0);

//         // Updating  contact in database
//         const contactData = await this.getRepository(Supplier)
//           .createQueryBuilder()
//           .where("id=:contactId", { contactId: req.body.contact_id })
//           .getOneOrFail();

//         contactData.due += due_amount;
//         // Creating Payment for purchase
//         const payment = this.createPayment(
//           contactData,
//           paid_amount,
//           amount,
//           req.user.id
//         );

//         // New Purchase record
//         const purchase = this.handlePurchase(
//           req,
//           contactData,
//           payment,
//           due_amount,
//           paid_amount,
//           amount
//         );

//         // Adding products to purchase
//         // Updating / creating new products in database
//         const products: PurchaseProduct[] = [];
//         for (const p of productsInfo) {
//           const productData = await ProductController.getProductById(
//             p.product_id
//           );

//           // Handling product
//           if (productData.product_type === ProductType.BARCODE) {
//             await this.handleBarcodeProducts(productData, products, p);
//           } else {
//             await this.handleNonBarcodeProducts(productData, products, p);
//           }
//         }

//         // Adding products to purchase
//         products.forEach(({ purchase_qty, ...p }) => {
//           purchase.addProduct(p as Product);

//           const cartExist = purchase.purchasedCart?.findIndex(
//             (pc) =>
//               pc.name === p.name &&
//               pc.product_type === p.product_type &&
//               pc.brand === p.brand?.name &&
//               pc.category === p.category?.name &&
//               pc.model === p.model?.name
//           );

//           if (!!purchase?.purchasedCart?.length && cartExist !== -1) {
//             purchase.purchasedCart[cartExist].quantity += purchase_qty;
//             purchase.purchasedCart[cartExist].sku_id += `, ${p.sku_id}`;
//           } else {
//             const cart = new PurchasedCart();
//             Object.assign<any, Partial<PurchasedCart>>(cart, {
//               name: p.name,
//               quantity: purchase_qty,
//               product_type: p.product_type,
//               selling_price: p.selling_price,
//               purchase_price: p.purchase_price,
//               sku_id: p.sku_id,
//               model: p.model?.name,
//               brand: p.brand?.name,
//               category: p.category?.name,
//             });
//             purchase.addCart(cart);
//           }
//         });

//         // Handling Account Update
//         await AccountController.updateBalance(
//           paid_amount,
//           req.body.accountId,
//           TransactionType.CREDIT,
//           "PURCHASE",
//           "Purchase From Supplier"
//         );

//         // Saving Purchase
//         await this.repository.save(purchase);
//         this.success(res, purchase, 201);
//       } catch (error) {
//         return ApiError(error, 404, next);
//       }
//     },
//     { body: {} as any }
//   );

//   // Get all purchases
//   getPurchase = requestHandler(async (req, res, next) => {
//     try {
//       const data = await this.repository
//         .createQueryBuilder("p")
//         .leftJoinAndSelect("p.business", "b")
//         .leftJoinAndSelect("p.products", "products")
//         .leftJoinAndSelect("p.supplier", "s")
//         .leftJoinAndSelect("p.purchasedCart", "pc")
//         .leftJoinAndSelect("p.memo", "memo")
//         .where("b.id = :id", { id: req.user?.business.id })
//         .orderBy("p.created_at", "DESC")
//         .getMany();

//       this.success(res, data);
//     } catch (error) {
//       return ApiError(error, 404, next);
//     }
//   });

//   // Get Purchase By Supplier
//   getPurchaseBySupplier = requestHandler(
//     async (req, res, next) => {
//       try {
//         const data = await this.repository
//           .createQueryBuilder("p")
//           .leftJoinAndSelect("p.business", "b")
//           .leftJoinAndSelect("p.products", "products")
//           .leftJoinAndSelect("p.supplier", "s")
//           .leftJoinAndSelect("p.purchasedCart", "pc")
//           .leftJoinAndSelect("p.memo", "memo")
//           .where("b.id = :id", { id: req.user?.business.id })
//           .andWhere("s.id = :sid", { sid: Number(req.params.id) })
//           .orderBy("p.created_at", "DESC")
//           .getMany();
//         this.success(res, data);
//       } catch (error) {
//         return ApiError(error, 404, next);
//       }
//     },
//     {
//       params: {
//         id: "",
//       },
//     }
//   );

//   // New Purchase

//   private handlePurchase(
//     req: any,
//     contactData: Supplier,
//     payment: PaymentOption,
//     due_amount: number,
//     paid_amount: number,
//     amount: number
//   ) {
//     const image = this.createImage(req);
//     const purchase = new Purchase();
//     if (image) {
//       purchase.memo = image;
//     }
//     purchase.memo_sl = req.body.memo_sl;
//     purchase.payment = payment;
//     purchase.business = req.user.business;
//     purchase.status = req.body.status;
//     purchase.amount = amount;
//     purchase.supplier = contactData;
//     purchase.quantity = Number(req.body.quantity);
//     purchase.paid_amount = paid_amount;
//     purchase.due = due_amount > 0 ? due_amount : 0;
//     return purchase;
//   }

//   // Creating memo image

//   private createImage(req: any): Image | null {
//     if (!req.file) return null;
//     const image = new Image();
//     Object.assign(image, req.file);
//     return image;
//   }

//   // Creaing payment for purchase
//   private createPayment(
//     contact: Supplier,
//     paid_amount: number,
//     amount: number,
//     reciver_id: number
//   ): PaymentOption {
//     const payment = new PaymentOption();
//     payment.type = "Purchase";
//     payment.reciver_id = reciver_id;
//     payment.amount = amount;
//     payment.paid_amount = paid_amount;
//     payment.recived_by = "Supplier";
//     payment.supplier = contact;
//     payment.payment_status =
//       paid_amount < amount ? PaymentStatus.DUE : PaymentStatus.PAID;
//     payment.payment_method = PaymentMethod.CASH;
//     payment.due_amount = amount - paid_amount > 0 ? amount - paid_amount : 0;
//     payment.change_amount = paid_amount - amount > 0 ? paid_amount - amount : 0;
//     return payment;
//   }

//   // Handling Barcode Products
//   private async handleBarcodeProducts(
//     product: Product,
//     products: PurchaseProduct[],
//     p: ProductInfo
//   ) {
//     const { id, ...productData } = product;
//     const purchasePrice = Number.parseInt(p.purchase_price);

//     for (const code of p.codes) {
//       const isFirstBarcode = !productData.sku_id;
//       const newProductData = {
//         ...productData,
//         sku_id: code,
//         purchase_price: purchasePrice,
//         purchase_qty: 1,
//         quantity: 1,
//       };

//       if (isFirstBarcode) {
//         products.push(newProductData as PurchaseProduct);
//         continue;
//       }

//       // If product is already barcode
//       const newProduct = {
//         ...newProductData,
//         product_type: ProductType.BARCODE,
//         selling_price: productData.selling_price,
//       };
//       products.push(newProduct as PurchaseProduct);
//     }
//   }

//   // Handling Non Barcode Products
//   private async handleNonBarcodeProducts(
//     productData: Product,
//     products: PurchaseProduct[],
//     p: ProductInfo
//   ) {
//     productData.sku_id = productData.sku_id
//       ? productData.sku_id
//       : generateRandomNumber(12).toString();
//     productData.purchase_price = Number.parseInt(p.purchase_price);
//     productData.quantity += parseInt(p.quantity.toString());
//     productData.product_type = ProductType.NON_BARCODE;
//     products.push({
//       ...productData,
//       purchase_qty: p.quantity,
//     } as PurchaseProduct);
//   }

//   // Return Previous purchase

//   returnPurchase = requestHandler(
//     async (req, res, next) => {
//       try {
//         const purchase = await this.getRepository(Purchase).findOneOrFail({
//           where: { id: req.params.id },
//           relations: {
//             products: true,
//           },
//         });
//         /**
//          * Purchase Return Status
//          */
//         if (req.body.returnType === "partial") {
//           purchase.status = PurchaseStatus.PARTIAL_RETURN;
//         } else {
//           purchase.status = PurchaseStatus.RETURNED;
//         }

//         if (req.body?.returnQty > purchase.quantity) {
//           throw new Error("Invalid quantity");
//         }

//         /**
//          * Product quantity update
//          */
//         purchase.returned_qty += req.body?.returnQty;
//         purchase.products.forEach((p) => {
//           if (p.product_type === ProductType.NON_BARCODE) {
//             if (req.body.returnType === "partial" && req.body.returnQty > 0) {
//               p.quantity =
//                 p.quantity - req.body?.returnQty > 0
//                   ? p.quantity - req.body?.returnQty
//                   : 0;
//             } else if (req.body.returnType === "all") {
//               p.quantity =
//                 p.quantity - purchase.quantity > 0
//                   ? p.quantity - purchase.quantity
//                   : 0;
//             }
//           } else if (p.product_type === ProductType.BARCODE) {
//             if (req.body.returnType === "partial") {
//               if (req.body?.sku_ids?.includes(p.sku_id)) {
//                 p.quantity = 0;
//                 p.is_returned = true;
//               }
//             } else if (req.body.returnType === "all") {
//               p.quantity = 0;
//               p.is_returned = true;
//             }
//           }
//         });
//         purchase.returned_at = new Date(Date.now()).toISOString();
//         await this.getRepository(Purchase).save(purchase);
//         this.success(res, purchase);
//       } catch (error) {
//         return ApiError(error, 404, next);
//       }
//     },
//     {
//       params: {} as { id: number },
//       body: {
//         returnQty: 0,
//         returnType: "all",
//         sku_ids: [],
//       } as any,
//     }
//   );
// }
