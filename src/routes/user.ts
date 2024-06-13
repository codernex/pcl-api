import {Router} from "express";
import {UserController} from "../controller";
import {isAuthenticated} from "../middleware/isAuth";

export const userRoutes = Router()
const {createUser, loginUser, currentUser, createAdmin,getUser} = new UserController()

userRoutes.post('/create-user-by-admin', isAuthenticated, createUser)
userRoutes.post('/create-admin', createAdmin)

userRoutes.post('/login', loginUser)
userRoutes.get('/current', isAuthenticated, currentUser)
userRoutes.get("/",getUser)