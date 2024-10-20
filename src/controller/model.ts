// import { Brand, Image, Model } from "../entities";
// import { ApiError, deleteFile, requestHandler } from "../utils";
// import { Controller } from "./base";

// export class ModelController extends Controller<Model> {
//   constructor() {
//     super(Model);
//   }

//   create = requestHandler(
//     async (req, res, next) => {
//       try {
//         let modelImage: Image | null = null;
//         if (req.file) {
//           modelImage = await this.getRepository(Image).save({
//             ...req.file,
//           });
//         }
//         const { brands, ...rest } = req.body;
//         const model = new Model();
//         Object.assign(model, {
//           ...rest,
//           image: modelImage,
//           isActive: req.body.isActive.toString() === "true",
//         });

//         if (brands && brands instanceof Array) {
//           for (const brandId of brands) {
//             const brand = await this.getRepository(Brand).findOneOrFail({
//               where: {
//                 id: brandId,
//               },
//             });
//             model.addBrand(brand);
//           }
//         } else {
//           throw new Error("Brand must be an array");
//         }

//         await this.repository.save(model);

//         this.success(res, model);
//       } catch (err) {
//         return ApiError(err.message, 404, next);
//       }
//     },
//     {
//       body: {} as any,
//     }
//   );

//   get = requestHandler(
//     async (req, res, next) => {
//       try {
//         const model = await this.repository.find({
//           relations: {
//             image: true,
//             brands: true,
//           },
//         });

//         this.success(res, model);
//       } catch (err) {
//         return ApiError(err.message, 404, next);
//       }
//     },
//     {
//       body: {} as any,
//     }
//   );

//   update = requestHandler(
//     async (req, res, next) => {
//       try {
//         const { brands, ...rest } = req.body;
//         const model = await this.repository.findOneOrFail({
//           where: {
//             id: req.params.id,
//           },
//         });

//         let image: Image | null = null;

//         if (req.file && model.image) {
//           await deleteFile(model.image.path);

//           image = new Image();
//           Object.assign(image, {
//             ...req.file,
//           });
//         } else {
//           image = model.image;
//         }

//         Object.assign(model, {
//           ...rest,
//           isActive: rest?.isActive.toString() === "true",
//           image,
//         });

//         if (brands && brands instanceof Array) {
//           for (const brandId of brands) {
//             const brand = await this.getRepository(Brand).findOneOrFail({
//               where: {
//                 id: brandId,
//               },
//             });
//             model.addBrand(brand);
//           }
//         } else {
//           throw new Error("Brand must be an array");
//         }

//         await this.repository.save(model);
//         this.success(res, model);
//       } catch (err) {
//         return ApiError(err.message, 404, next);
//       }
//     },
//     {
//       body: {} as any,
//       params: {} as any,
//     }
//   );

//   remove = requestHandler(
//     async (req, res, next) => {
//       try {
//         const model = await this.repository.findOneOrFail({
//           where: {
//             id: req.params.id,
//           },
//         });

//         await this.repository.remove(model);
//         await this.getRepository(Image).remove(model?.image);
//         this.success(res, null, 200, "Model Deleted");
//       } catch (err) {
//         return ApiError(err.message, 404, next);
//       }
//     },
//     {
//       params: {} as any,
//     }
//   );
// }
