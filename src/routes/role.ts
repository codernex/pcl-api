import { Router } from "express";
import { RoleController } from "../controller";

export const roleRoutes = Router();
const { createRole, getRoles } = new RoleController();

roleRoutes.route("/").post(createRole).get(getRoles);
