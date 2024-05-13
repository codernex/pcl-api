import {Warranty} from "../entities";
import {ApiError, requestHandler} from "../utils";
import {Controller} from "./base";

export class WarrantyController extends Controller<Warranty> {
    constructor() {
        super(Warranty);
    }

    createWarranty = requestHandler(
        async (req, res, next) => {
            try {
                const warranty = await this.repository.save({
                    ...req.body,
                });
                return this.success(res, warranty, 201)
            } catch (err) {
                return ApiError(err, 404, next);
            }
        },
        {
            body: {} as any,
        }
    );

    getWarranties = requestHandler(
        async (req, res, next) => {
            try {
                const warranty = await this.repository
                    .createQueryBuilder("warranty")
                    .cache(true)
                    .getMany();

                return this.success(res, warranty)
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
                await this.repository.update(req.params.id, {...req.body});
                return this.success(res, null, 200, "Warranty updated successfully")
            } catch (err) {
                return ApiError(err, 404, next);
            }
        },
        {
            body: {} as any,
            params: {} as any,
        }
    );

    remove = requestHandler(
        async (req, res, next) => {
            try {
                await this.repository.delete(req.params.id);
                return this.success(res, null, 200, "Warranty deleted successfully")
            } catch (err) {
                return ApiError(err, 404, next);
            }
        },
        {
            params: {} as any,
        }
    );
}
