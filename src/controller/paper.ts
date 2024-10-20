// import { InvoicePaper } from "../entities";
// import { requestHandler } from "../utils";
// import { Controller } from "./base";

// export class PaperController extends Controller<InvoicePaper> {
//   constructor() {
//     super(InvoicePaper);
//   }

//   createPaper = requestHandler(
//     async (req, res, next) => {
//       try {
//         this.validateErr(req.body, "name", "width", "height");
//         const paper = await this.repository.save({
//           ...req.body,
//           default: req.body.default === true,
//           business: req.user?.business,
//         });
//         return this.success(res, paper, 201);
//       } catch (err) {
//         this.failed(err, next);
//       }
//     },
//     {
//       body: {} as any,
//     }
//   );

//   getPaper = requestHandler(async (req, res, next) => {
//     try {
//       const papers = await this.repository.find({
//         where: { business: { id: req.user?.business?.id } },
//         relations: { business: true },
//       });
//       return this.success(res, papers);
//     } catch (err) {
//       this.failed(err, next);
//     }
//   });

//   updatePaper = requestHandler(
//     async (req, res, next) => {
//       try {
//         await this.repository
//           .createQueryBuilder()
//           .update()
//           .set(req.body)
//           .where({ id: req.params.id })
//           .execute();
//         return this.success(res, null, 200, "Paper updated");
//       } catch (err) {
//         this.failed(err, next);
//       }
//     },
//     {
//       body: {} as any,
//       params: {} as any,
//     }
//   );

//   getDefaultPaper = requestHandler(async (req, res, next) => {
//     try {
//       const paper = await this.repository.findOne({
//         where: { default: true, business: { id: req.user?.business?.id } },
//         relations: { business: true },
//       });
//       return this.success(res, paper);
//     } catch (err) {
//       this.failed(err, next);
//     }
//   });
// }
