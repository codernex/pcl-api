// import {ProductGroup} from "../entities";
// import {ApiError, requestHandler} from "../utils";
// import {Controller} from "./base";

// export class ProductGroupController extends Controller<ProductGroup> {
//     constructor() {
//         super(ProductGroup);
//     }

//     create = requestHandler(
//         async (req, res, next) => {
//             try {
//                 this.validateErr(req.body, "name");

//                 const productGroup = await this.repository.save({
//                     ...req.body,
//                 });

//                 this.success(res, productGroup, 201);
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
//                 const productGroup = await this.repository.find();

//                 this.success(res, productGroup)
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
//                 const productGroup = await this.repository.findOne({
//                     where: {
//                         id: req.params.id,
//                     },
//                 });

//                 if (!productGroup) {
//                     return ApiError("Product Group Not Found", 404, next);
//                 }

//                 const updatedProductGroup = await this.repository.save({
//                     id: productGroup.id,
//                     ...req.body,
//                 });

//                 this.success(res, updatedProductGroup);
//             } catch (err) {
//                 return ApiError(err, 404, next);
//             }
//         },
//         {params: {id: String.toString()}, body: {} as any}
//     );

//     remove = requestHandler(
//         async (req, res, next) => {
//             try {
//                 const productGroup = await this.repository.findOne({
//                     where: {
//                         id: req.params.id,
//                     },
//                 });

//                 if (!productGroup) {
//                     return ApiError("Product Group Not Found", 404, next);
//                 }

//                 await this.repository.delete(productGroup.id);

//                 this.success(res, null, 200, "Deleted Successfully");
//             } catch (error) {
//                 return ApiError(error, 404, next);
//             }
//         },
//         {
//             params: {id: String.toString()} as any,
//         }
//     );
// }
