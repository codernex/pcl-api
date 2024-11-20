import { Router } from "express";
import { ProductionController } from "../controller";

export const productionRoutes = Router();


const {create,get} = new ProductionController()
productionRoutes.route('/').get(get).post(create)