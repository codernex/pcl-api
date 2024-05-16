import {Controller} from "./base";
import {Business, Role, User, UserRole} from "../entities";
import {ApiError, requestHandler, sendToken} from "../utils";
import {permissions} from "../middleware/isAuth";
import * as bcrypt from 'bcryptjs'

export class UserController extends Controller<User> {

    constructor() {
        super(User);
    }

    createAdmin = requestHandler(async (req, res, next) => {
        try {
            this.validateErr(req.body, "email", "mobile", "password", "name", "businessName")

            const business = new Business()
            business.name = req.body.businessName

            const user = new User();
            if (req.body.secret !== "pos@123") {
                throw new Error("Invalid Secret Key");
            }
            user.access = await this.adminAccessController();
            user.role = UserRole.ADMIN
            user.business = business

            Object.assign(user, req.body);

            await this.repository.save(user)

            return this.success(res, user, 201)
        } catch (err) {
            return ApiError(err, 400, next)
        }
    }, {
        body: {} as User & { secret?: string, businessName: string }
    })

    createUser = requestHandler(async (req, res, next) => {
        try {
            this.validateErr(req.body, "email", "mobile", "password", "name")


            const user = new User();

            user.access = await this.userAccessController();
            Object.assign(user, req.body);

            await this.repository.save(user)

            return this.success(res, user, 201)
        } catch (err) {
            return ApiError(err, 400, next)
        }
    }, {
        body: {} as User & { secret?: string }
    })

    public loginUser = requestHandler(
        async (req, res, next) => {
            try {
                const {identity} = req.body;
                if (!identity.length) {
                    return ApiError("Please Enter a valid mobile or email", 404, next);
                }
                const user = await this.repository.findOne({
                    where: identity.includes("@")
                        ? {email: identity}
                        : {mobile: identity},
                    relations: {
                        access: true,
                    },
                });

                if (!user) {
                    return ApiError("Invalid username or password", 404, next);
                }

                // Checking If User IS Verified

                // Checking If User IS Created By Google Or Facebook


                // Checking If Password Match
                if (user.password && req.body.password) {
                    const isPasswordMatch = bcrypt.compareSync(
                        req.body.password,
                        user.password
                    );

                    if (!isPasswordMatch) {
                        return ApiError("Invalid username or password", 404, next);
                    }
                }

                sendToken(res, user, next);
            } catch (err: any) {
                return ApiError(err.message, 404, next);
            }
        },
        {
            body: {
                identity: String.toString(),
                password: String.toString(),
            },
        }
    );

    currentUser = requestHandler(async (req, res, next) => {
        if (!req.user) {
            return ApiError("Unauthorized access", 404, next);
        }

        return this.success(res, req.user)
    });
    public findUserById = async (id: string | undefined) => {
        const user= await this.repository.createQueryBuilder("u").where("u.id = :id", {id}).leftJoinAndSelect("u.business", "b").getOneOrFail();     
        return user
    }

    public async userAccessController() {
        const rolesExist = await this.getRepository(Role).createQueryBuilder().where("name ='User'").getOne()

        if (rolesExist) {
            return rolesExist
        }
        const role = new Role();
        role.name = "User";
        role.hasAccess = '';
        return role
    }

    public async adminAccessController() {
        const rolesExist = await this.getRepository(Role).createQueryBuilder().where("name ='Admin'").getOne()

        if (rolesExist) {
            return rolesExist
        }
        const role = new Role();
        role.name = "Admin";
        role.hasAccess = permissions.join(',');
        return role
    }
}