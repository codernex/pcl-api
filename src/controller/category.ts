import {Category, Image} from "../entities";
import {ApiError, deleteFile, requestHandler,} from "../utils";
import {Controller} from "./base";

export class CategoryController extends Controller<Category> {
    constructor() {
        super(Category);
    }
    
    createCategory = requestHandler(
        async (req, res, next) => {
            try {
                let categoryImage: Image | null = null;

                this.validateErr(
                    req.body,
                    "name",
                    "isActive",
                    "brand",
                    "productGroup"
                );
                if (req.file) {
                    categoryImage = await this.getRepository(Image).save({
                        ...req.file,
                    });
                }

                const category = await this.repository.save({
                    ...req.body,
                    isActive: req.body.isActive.toString() === "true",
                    image: categoryImage,
                });

                return this.success(res, category, 201)
            } catch (err) {
                return ApiError(err.message, 404, next);
            }
        },
        {
            body: {} as any,
        }
    );

    updateCategory = requestHandler(
        async (req, res, next) => {
            try {
                const category = await this.repository.findOneOrFail({
                    where: {
                        id: req.params.id,
                    },
                });

                let image: Image | null;

                if (req.file && category.image) {
                    await deleteFile(category.image.path);
                    image = new Image();
                    Object.assign(image, req.file);
                } else {
                    image = category.image;
                }

                Object.assign(category, {...req.body, image});

                await this.repository.save(category);

                return this.success(res, category)
            } catch (error) {
                return ApiError(error, 404, next);
            }
        },
        {
            params: {id: String.toString()},
            body: {} as any,
        }
    );

    getCategories = requestHandler(
        async (req, res, next) => {
            try {
                const category = await this.repository.find({
                    relations: {
                        image: true,
                    },
                });

                return this.success(res, category)
            } catch (err) {
                return ApiError(err.message, 404, next);
            }
        },
        {
            body: {} as any,
        }
    );

    removeCategory = requestHandler(
        async (req, res, next) => {
            try {
                const category = await this.repository.findOneOrFail({
                    where: {
                        id: req.params.id,
                    },
                });

                await this.repository.remove(category);
                await this.getRepository(Image).remove(category.image);
                this.success(res, null, 200, "Category deleted successfully")
            } catch (error) {
                return ApiError(error, 404, next);
            }
        },
        {
            params: {} as any,
        }
    );
}
