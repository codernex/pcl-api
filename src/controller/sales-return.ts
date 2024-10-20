// import {
//   SalesReturn
// } from "../entities";
// import { ErrorHandler, isDateValid, requestHandler } from "../utils";
// import { Controller } from "./base";

// export class SalesReturnController extends Controller<SalesReturn> {
//   constructor() {
//     super(SalesReturn);
//   }


//   getSalesReturn = requestHandler(
//     async (req, res, next) => {
//       try {
//         const qb = this.repository
//           .createQueryBuilder("s")
//           .leftJoinAndSelect("s.invoice", "i")
//           .leftJoinAndSelect("s.customer", "c")
//           .leftJoinAndSelect("s.products", "p");
//         if (req.query.startDate && req.query.endDate) {
//           const isValid = isDateValid(req.query.startDate, req.query.endDate);

//           if (!isValid) {
//             throw new ErrorHandler("Invalid Date", 404);
//           }

//           qb.andWhere(`DATE(s.created_at) BETWEEN :startDate AND :endDate`, {
//             startDate: req.query.startDate,
//             endDate: req.query.endDate,
//           });
//         }
//         const salesReturn = await qb.orderBy("s.id", "DESC").getMany();
//         this.success(res, salesReturn);
//       } catch (error) {
//         return this.failed(error, next);
//       }
//     },
//     {
//       query: {} as any,
//     }
//   );
// }
