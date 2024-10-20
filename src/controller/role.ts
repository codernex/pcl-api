import { Role } from "../entities";
import { ApiError, requestHandler } from "../utils";
import { Controller } from "./base";

export class RoleController extends Controller<Role> {
  constructor() {
    super(Role);
  }

  createRole = requestHandler(
    async (req, res, next) => {
      try {
        this.validateErr(req.body, "hasAccess", "name");
        const role = new Role()
        Object.assign(role, req.body);
        await this.repository.save(role);
        return this.success(res, role, 201);
      } catch (err) {
        return ApiError(err, 400, next);
      }
    },
    {
      body: {} as any,
    }
  );

  getRoles = requestHandler(async (req, res, next) => {
    try {
      const roles = await this.repository.find();
      return this.success(res, roles);
    } catch (err) {
      return ApiError(err, 400, next);
    }
  });
}
