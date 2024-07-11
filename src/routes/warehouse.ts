import { Router } from "express";
import { WarehouseController } from "../controller/warehouse";

export const warehouseRoutes = Router();

const { create, get } = new WarehouseController();

warehouseRoutes.route("/").get(get).post(create);
