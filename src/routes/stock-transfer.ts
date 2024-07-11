import { Router } from "express";
import { StockTransferController } from "../controller";

export const stockTransferRoutes = Router();

const { transferBusinessToWarehouse, get, transferWarhouseToBusiness } =
  new StockTransferController();
stockTransferRoutes.get("/", get);

stockTransferRoutes.post("/business-to-warehouse", transferBusinessToWarehouse);
stockTransferRoutes.post("/warehouse-to-business", transferWarhouseToBusiness);
