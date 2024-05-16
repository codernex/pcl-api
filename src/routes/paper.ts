import { Router } from "express";

export const paperRoutes = Router();

import { PaperController } from "../controller";

const { getPaper, createPaper, updatePaper, getDefaultPaper } =
  new PaperController();

paperRoutes.route("/").get(getPaper).post(createPaper);
paperRoutes.get("/default", getDefaultPaper);
paperRoutes.route("/:id").patch(updatePaper);
