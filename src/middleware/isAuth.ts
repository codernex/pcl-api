import * as jwt from "jsonwebtoken";
import sanitizedConfig from "../config";
import { UserController } from "../controller";
import { ApiError, requestHandler } from "../utils";

export const isAuthenticated = requestHandler(async (req, res, next) => {
  try {
    let token: string | undefined;
    const authorizationHeader = req.headers.authorization;
    const cookies = req.cookies;

    if (authorizationHeader) {
      const parts = authorizationHeader.split(" ");
      if (parts.length === 2 && parts[0] === "Bearer") {
        token = parts[1];
      }
    }

    if ((!token || token === "undefined" || token === "null") && cookies) {
      token = cookies["__auth_token"] || cookies["__auth"];
    }

    const userController = new UserController();

    if (!token) {
      return ApiError("Unauthorized Access", 401, next);
    }

    const decodedData = jwt.verify(
      token,
      sanitizedConfig.JWT_SECRET
    ) as jwt.JwtPayload;

    const user = await userController.findUserById(decodedData.sub);

    if (!user) {
      return ApiError("Unauthorized Access", 401, next);
    }

    req.user = user;

    next();
  } catch (err: any) {
    console.log(err);

    return ApiError("Unauthorized Access", 401, next);
  }
});

export const permissions = [
  "user",
  "user.view",
  "user.create",
  "user.update",
  "user.delete",
  "roles.create",
  "roles.view",
  "product",
  "roles.update",
  "product.view",
  "product.delete",
  "product.update",
  "product.create",
  "category.create",
  "category.view",
  "category.update",
  "category.delete",
  "brand.create",
  "brand.view",
  "brand.update",
  "brand.delete",
  "color.create",
  "color.view",
  "color.update",
  "color.delete",
  "product-group.create",
  "product-group.view",
  "product-group.update",
  "product-group.delete",
  "model.create",
  "model.view",
  "model.update",
  "model.delete",
  "warranty.create",
  "warranty.view",
  "warranty.update",
  "warranty.delete",
  "unit.create",
  "unit.view",
  "unit.update",
  "unit.delete",
  "sales",
  "sales.create",
  "sales.view",
  "contact",
  "contact.view",
  "contact.update",
  "contact.delete",
  "contact.create",
  "report.view",
  "purchase.create",
  "purchase.view",
  "product.transfer",
  "finance",
  "finance.view",
  "settings",
  "dashboard.view",
] as const;

type Permission = (typeof permissions)[number];
// export const authorizedRoles = (...permission: Permission[]) => {
//     return requestHandler(async (req, res, next) => {
//         if (req.user?.role === "admin") {
//             next();
//         } else {
//             const permissionArr = req.user?.accessController?.hasPermission.split(
//                 ","
//             ) as Permission[];
//
//             if (!permissionArr?.length) {
//                 return ApiError("Unauthorized Access", 401, next);
//             }
//
//             const hasPermission = permissionArr.some((p) => permission.includes(p));
//             if (hasPermission) {
//                 next();
//             } else {
//                 return ApiError("Unauthorized Access", 401, next);
//             }
//         }
//     });
// };
