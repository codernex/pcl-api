import { Product } from "../entities";
import { Documents, OtherCost, Track } from "../entities/track";
import { VolatileProduct } from "../entities/volatile-product";
import { requestHandler } from "../utils";
import { Controller } from "./base";

export class TrackController extends Controller<Track> {
  constructor() {
    super(Track);
  }

  create = requestHandler(
    async (req, res, next) => {
      this.validateErr(req.body, "trackNumber", "tierCount");
      const tier = await this.repository.save(req.body);
      this.success(res, tier, 201);
    },
    {
      body: {} as any,
    }
  );

  get = requestHandler(async (req, res, next) => {
    const data = await this.repository.find();
    return this.success(res, data);
  });

  addProductToTrack = requestHandler(
    async (req, res, next) => {
      this.validateErr(req.body, "trackId", "productId");

      const product = await this.getRepository(Product).findOne({
        where: {
          id: req.body.productId,
        },
      });

      const track = await this.getRepository(Track).findOne({
        where: {
          id: req.body.trackId,
        },
      });

      if (!product || !track) {
        return this.failed("Product or track not found", next, 404);
      }

      const volatileProduct = new VolatileProduct();
      volatileProduct.name = product.name;
      track.addProduct(volatileProduct);

      await this.getRepository(Track).save(track);

      this.success(res, track, 201);
    },
    {
      body: {} as any,
    }
  );

  removeProductFromTrack = requestHandler(
    async (req, res, next) => {
      this.validateErr(req.body, "trackId", "productId");

      const product = await this.getRepository(VolatileProduct).findOne({
        where: {
          id: req.body.productId,
        },
      });

      const track = await this.getRepository(Track).findOne({
        where: {
          id: req.body.trackId,
        },
      });

      if (!product || !track) {
        return this.failed("Product or track not found", next, 404);
      }
      track.removeProduct(product);

      await this.getRepository(Track).save(track);
      this.success(res, track, 201);
    },
    {
      body: {} as any,
    }
  );

  updateTrackCost = requestHandler(
    async (req, res, next) => {
      this.validateErr(req.params, "trackId");

      const track = await this.getRepository(Track).findOne({
        where: {
          id: req.params.trackId,
        },
      });

      if (!track) {
        return this.failed("Track not found", next, 404);
      }

      Object.assign(track, req.body);

      if (req.body.otherCost) {
        req.body.otherCost.map(async (cost) => {
          const otherCost = new OtherCost();
          otherCost.amount = cost.amount;
          otherCost.name = cost.name;
          otherCost.track = track;
          await this.getRepository(OtherCost).save(otherCost);
        });
      }

      await this.getRepository(Track).save(track);

      this.success(res, track, 200);
    },
    {
      body: {} as any,
      params: {} as any,
    }
  );

  uploadDocument = requestHandler(
    async (req, res, next) => {
      const track = await this.getRepository(Track).findOne({
        where: {
          id: req.params.trackId,
        },
      });

      if (!track) {
        return this.failed("Track not found", next, 404);
      }

      const file = req.file as Express.Multer.File;
      if (!file) {
        return this.failed("No files uploaded", next, 400);
      }

      const document = new Documents();
      document.name = req.body.name;
      document.url = file.filename;
      document.track = track;

      await this.getRepository(Documents).save(document);

      this.success(res, document, 201);
    },
    {
      body: {} as any,
      params: {} as any,
    }
  );
}
