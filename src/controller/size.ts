import {Size} from "../entities";
import {ApiError, requestHandler} from "../utils";
import {Controller} from "./base";

export class SizeController extends Controller<Size> {
    constructor() {
        super(Size);
    }

    create = requestHandler(
        async (req, res, next) => {
            try {
                const size = await this.repository.save({
                    ...req.body,
                });

                this.success(res, size, 201);
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
                const size = await this.repository.find();

                this.success(res, size)
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

                const size = await this.repository.save({
                    ...req.body, id: req.params.id,
                });
                this.success(res, size, 200)
            } catch (err) {
                return ApiError(err.message, 404, next);
            }
        }, {
            body: {} as any,
            params: {} as any
        }
    )

    remove = requestHandler(
        async (req, res, next) => {
            try {
                await this.repository.delete(req.params.id);
                this.success(res, null, 200, "Deleted Successfully")
            } catch (err) {
                return ApiError(err.message, 404, next);
            }
        }, {
            params: {} as any
        }
    )
}
