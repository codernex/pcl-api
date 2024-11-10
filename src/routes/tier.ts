import { Router } from "express";
import { TrackController } from "../controller";
import { uploadImage } from "../utils";

export const tierRoutes = Router();
const { create, get, addProductToTrack, updateTrackCost, uploadDocument } =
  new TrackController();

tierRoutes.route("/").get(get).post(create);
tierRoutes.post("/product", addProductToTrack);
tierRoutes.patch("/cost/:trackId", updateTrackCost);
tierRoutes.patch("/documents/:trackId", uploadImage.single("file"),uploadDocument);
