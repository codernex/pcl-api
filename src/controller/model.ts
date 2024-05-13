import {Mode} from "fs";
import {Image, Model} from "../entities";
import {ApiError, deleteFile, requestHandler} from "../utils";
import {Controller} from "./base";

export class ModelController extends Controller<Model> {
    constructor() {
        super(Model);
    }

    create = requestHandler(
        async (req, res, next) => {
            try {
                let modelImage: Image | null = null;
                if (req.file) {
                    modelImage = await this.getRepository(Image).save({
                        ...req.file,
                    });
                }
                const model = await this.repository.save({
                    ...req.body,
                    isActive: req.body.isActive.toString() === "true",
                    image: modelImage,
                });

                this.success(res, model)
            } catch (err) {
                return ApiError(err.message, 404, next);
            }
        },
        {
            body: {} as any,
        }
    );

    get = requestHandler(
        async (req, res, next) => {
            try {
                const model = await this.repository.find();

                this.success(res, model);
            } catch (err) {
                return ApiError(err.message, 404, next);
            }
        },
        {
            body: {} as any,
        }
    );

    update = requestHandler(
        async (req, res, next) => {
            try {
                const {...rest} = req.body;
                const model = await this.repository.findOneOrFail({
                    where: {
                        id: req.params.id,
                    },
                });

                let image: Image | null = null;

                if (req.file && model.image) {
                    await deleteFile(model.image.path);

                    image = new Image();
                    Object.assign(image, {
                        ...req.file,
                    });
                } else {
                    image = model.image;
                }

                Object.assign(model, {
                    ...rest,
                    isActive: rest?.isActive.toString() === "true",
                    image,
                });

                await this.repository.save(model);
                this.success(res, model)
            } catch (err) {
                return ApiError(err.message, 404, next);
            }
        },
        {
            body: {} as Model,
            params: {} as any,
        }
    );

    remove = requestHandler(
        async (req, res, next) => {
            try {
                const model = await this.repository.findOneOrFail({
                    where: {
                        id: req.params.id,
                    },
                });

                await this.repository.remove(model);
                await this.getRepository(Image).remove(model?.image);
                this.success(res, null,200,"Model Deleted")
            } catch (err) {
                return ApiError(err.message, 404, next);
            }
        },
        {
            params: {} as any,
        }
    );
}
