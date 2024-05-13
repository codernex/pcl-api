import {Router} from "express";
import {BusinessController} from "../controller";

export const businessRoutes = Router()
const {getBusiness,deleteBusiness} = new BusinessController()

businessRoutes.get('/', getBusiness)
businessRoutes.delete('/',deleteBusiness)