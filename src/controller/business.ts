import {Controller} from "./base";
import {Business} from "../entities";
import {ApiError, requestHandler} from "../utils";

export class BusinessController extends Controller<Business> {

    constructor() {
        super(Business);
    }

    getBusiness = requestHandler(async (req, res, next) => {
        try {
            const business = await this.repository
                .createQueryBuilder("b")
                .leftJoinAndSelect("b.users", "u")
                .leftJoinAndSelect("b.products", "p")
                .where("u.id=:userId", {userId: req?.user?.id})
                .cache(true)
                .getMany();

            return this.success(res, business);
        } catch (err) {
            return ApiError(err, 404, next);
        }
    })

    deleteBusiness = requestHandler(async (req, res, next) => {
        try {
            if (!req.user) {
                return ApiError("User Not Found", 404, next);
            }
            await this.repository.delete(req.user?.business.id)

            this.success(res, null, 200, "Business Deleted")
        } catch (err) {
            return ApiError(err, 404, next);
        }
    })
}