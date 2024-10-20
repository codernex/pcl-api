// import {Unit} from "../entities";
// import {ApiError, requestHandler} from "../utils";
// import {Controller} from "./base";

// export class UnitController extends Controller<Unit> {
//     constructor() {
//         super(Unit);
//     }

//     create = requestHandler(
//         async (req, res, next) => {
//             try {
//                 const unit = await this.repository.save({
//                     ...req.body,
//                 });

//                 return this.success(res, unit, 201)
//             } catch (err) {
//                 return ApiError(err.message, 404, next);
//             }
//         },
//         {
//             body: {} as any,
//         }
//     );

//     get = requestHandler(
//         async (req, res, next) => {
//             try {
//                 const unit = await this.repository.find();

//                 return this.success(res, unit)
//             } catch (err) {
//                 return ApiError(err.message, 404, next);
//             }
//         },
//         {
//             body: {} as any,
//         }
//     );
//     update = requestHandler(
//         async (req, res, next) => {
//             try {
//                 await this.repository.update(req.params.id, {...req.body})
//                 return this.success(res, null, 200, "Unit updated successfully")
//             } catch (err) {
//                 return ApiError(err, 404, next);
//             }
//         }, {
//             body: {} as any,
//             params: {} as any
//         }
//     )

//     remove = requestHandler(
//         async (req, res, next) => {
//             try {
//                 await this.repository.delete(req.params.id);
//                 return this.success(res, null, 200, "Unit deleted successfully")
//             } catch (err) {
//                 return ApiError(err, 404, next);
//             }
//         }, {
//             params: {} as any
//         }
//     )
// }
