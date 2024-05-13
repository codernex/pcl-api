import {Brand, Image} from "../entities";
import {ApiError, requestHandler} from "../utils";
import {Controller} from "./base";

export class BrandController extends Controller<Brand> {
    constructor() {
        super(Brand);
    }

    createBrand = requestHandler(
        async (req, res, next) => {
            try {
                const file = req.file;
                let brandImage: Image | null = null;

                this.validateErr(req.body, "isActive", "name", "description");
                // Saving The Brand Image TO Database
                if (file) {
                    brandImage = await this.getRepository(Image).save({
                        ...file,
                    });
                }

                // Creating The Brand

                const brand = await this.repository.save({
                    ...req.body,
                    isActive: req.body.isActive.toString() === "true",
                    image: brandImage,
                });
                return this.success(res, brand, 201)
            } catch (err) {
                console.log(err);

                return ApiError(err.message, 500, next);
            }
        },
        {
            body: {} as any,
        }
    );

    getBrands = requestHandler(async (req, res, next) => {
        try {
            const brands = await this.repository.find({
                relations: {
                    image: true,
                },
            });
            return this.success(res, brands);
        } catch (err) {
            return ApiError(err.message, 404, next);
        }
    });
    deleteBrand = requestHandler(
        async (req, res, next) => {
            try {
                const brand = await this.repository.findOne({
                    where: {
                        id: req.params.id,
                    },
                    relations: {
                        image: true,
                    },
                });

                if (!brand) {
                    return ApiError("Brand Not Found", 404, next);
                }

                await brand.remove();
                await brand?.image?.remove();

                return this.success(res, null, 200, "Brand Deleted Successfully");
            } catch (err) {
                return ApiError(err, 404, next);
            }
        },
        {
            params: {id: String.toString()},
        }
    );

    updateBrand = requestHandler(
        async (req, res, next) => {
            try {
                const qb = this.repository.createQueryBuilder("brand");
                const file = req.file;
                const brand = await qb
                    .leftJoinAndSelect("brand.image", "image")
                    .where("brand.id = :id", {id: req.params.id})
                    .getOneOrFail();
                // Checking If The Image Is Provided
                if (file) {
                    const image = new Image();

                    Object.assign(image, file);
                    brand.image = image;
                }

                Object.assign(brand, {
                    ...req.body,
                    isActive: req.body.isActive.toString() === "true",
                });
                await brand.save();

                return this.success(res, brand, 200, "Brand Updated Successfully");
            } catch (err) {
                return ApiError(err, 404, next);
            }
        },
        {
            params: {
                id: String.toString(),
            },
            body: {} as Brand,
        }
    );
}
