import {Color} from "../entities";
import {ApiError, requestHandler} from "../utils";
import {Controller} from "./base";

export class ColorController extends Controller<Color> {
    constructor() {
        super(Color);
    }

    create = requestHandler(
        async (req, res, next) => {
            try {
                const color = await this.repository.save({
                    ...req.body,
                });

                return this.success(res, color, 201)
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
                const color = await this.repository.find();

                return this.success(res, color);
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
                this.validateErr(req.params, "id");

                await this.repository
                    .createQueryBuilder()
                    .update()
                    .set({
                        ...req.body,
                    })
                    .where("id=:id", {id: req.params.id})
                    .execute();
                this.success(res, null, 200, "Color updated successfully");
            } catch (error) {
                return ApiError(error, 404, next);
            }
        },
        {
            body: {} as any,
            params: {id: String.toString()},
        }
    );

    remove = requestHandler(
        async (req, res, next) => {
            try {
                this.validateErr(req.params, "id");
                await this.repository.delete(req.params.id);
                this.success(res, null, 200, "Color deleted successfully");
            } catch (error) {
                return ApiError(error, 404, next);
            }
        },
        {
            params: {id: String.toString()},
        }
    );
}
