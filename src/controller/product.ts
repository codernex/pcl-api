import {
  Brand,
  Category,
  Model,
  Product,
  ProductGroup,
  Unit,
} from "../entities";
import { appDataSource } from "../orm.config";
import { ApiError, deleteFile, prettyError, requestHandler } from "../utils";
import { Controller } from "./base";

export class ProductController extends Controller<Product> {
  constructor() {
    super(Product);
  }

  createProduct = requestHandler(
    async (req, res, next) => {
      try {
        this.validateErr(
          req.body,
          "category",
          "selling_price",
          "name",
          "model",
          "productGroup",
          "product_type"
        );

        const { selling_price, ...data } = req.body;

        // Finding user
        if (!req.user) {
          return ApiError("Unauthorized access", 401, next);
        }

        // Products
        const product = new Product();

        // Fetching category
        const category = await this.getRepository(Category).findOneOrFail({
          where: {
            id: req.body.category,
          },
        });

        // Fetching product group
        const productGroup = await this.getRepository(
          ProductGroup
        ).findOneOrFail({
          where: {
            id: req.body.productGroup,
          },
        });

        // Fetching product model
        const model = await this.getRepository(Model).findOneOrFail({
          where: {
            id: req.body.model,
          },
        });

        // Fetching unit
        const unit = await this.getRepository(Unit).findOneOrFail({
          where: {
            id: req.body.unit,
          },
        });

        // Fetching Brand
        const brand = await this.getRepository(Brand).findOneOrFail({
          where: {
            id: req.body.brand,
          },
        });

        if (!brand) {
          return ApiError("Brand not found", 404, next);
        }

        Object.assign(product, {
          ...data,
          isActive: req.body?.isActive?.toString() === "true",
          alert_quantity: req.body?.alert_quantity
            ? Number.parseFloat(req.body.alert_quantity)
            : 0,
          selling_price: Number.parseFloat(selling_price),
        });
        product.model = model;
        product.category = category;
        product.unit = unit;
        product.business = req.user.business;
        product.productGroup = productGroup;
        product.brand = brand;

        await product.save();

        this.success(res, product, 201);
      } catch (error) {
        return ApiError(
          prettyError(error.message, "Something went wrong"),
          404,
          next
        );
      }
    },
    {
      body: {} as any,
    }
  );
  updateProduct = requestHandler(
    async (req, res, next) => {
      try {
        const products = await this.repository.find({
          where: {
            name: req.params.name,
          },
        });

        if (!products.length) {
          return ApiError("Product not found", 404, next);
        }

        await Promise.all(
          products.map(async (p) => {
            await this.repository
              .createQueryBuilder()
              .relation("model")
              .of(p)
              .set(req.body.model);

            await this.repository
              .createQueryBuilder()
              .relation("productGroup")
              .of(p)
              .set(req.body.productGroup);

            await this.repository
              .createQueryBuilder()
              .relation("brand")
              .of(p)
              .set(req.body.brand);

            await this.repository
              .createQueryBuilder()
              .relation("unit")
              .of(p)
              .set(req.body.unit);
            // Updating the main entity
            await this.repository
              .createQueryBuilder()
              .update()
              .set({
                name: req.body?.name,
                selling_price: req.body?.selling_price,
                alert_quantity: req.body?.alert_quantity
                  ? Number.parseFloat(req.body.alert_quantity)
                  : 0,
                product_type: req.body?.product_type,
              })
              .where("id = :id", { id: p.id }) // Using the product's ID for the update
              .execute();
          })
        );
        res.status(200).json({
          success: true,
          status: 200,
          message: "Product updated successfully",
        });
      } catch (err) {
        return ApiError(err.message, 404, next);
      }
    },
    {
      body: {} as any,
      params: {
        name: String.toString(),
      } as any,
    }
  );
  deleteProduct = requestHandler(
    async (req, res, next) => {
      try {
        this.validateErr(req.params, "id");

        const product = await this.repository.findOneOrFail({
          where: {
            id: req.params.id,
          },
        });

        for (const image of product?.images) {
          await deleteFile(image.path, next);
        }

        await product.remove();

        this.success(res, product, 200);
      } catch (error) {
        return ApiError(prettyError(error, "Product"), 404, next);
      }
    },
    {
      params: {
        id: String.toString(),
      },
    }
  );
  getProducts = requestHandler(
    async (req, res, next) => {
      try {
        const qb = this.repository
          .createQueryBuilder("p")
          .leftJoinAndSelect("p.images", "i")
          .leftJoinAndSelect("p.brand", "b")
          .leftJoinAndSelect("p.productGroup", "pg")
          .leftJoinAndSelect("p.category", "cat")
          .leftJoinAndSelect("p.unit", "u")
          .leftJoinAndSelect("p.business", "business")
          .leftJoinAndSelect("p.model", "m");

        qb.where("business.id=:businessId", {
          businessId: req?.user?.business?.id,
        });

        const products = await qb.getMany();
        this.success(res, products);
      } catch (error) {
        return ApiError(error.message, 404, next);
      }
    },
    {
      query: {
        cat: String.toString(),
        brand: String.toString(),
        model: String.toString(),
        color: String.toString(),
        group: String.toString(),
        seller: String.toString(),
      },
    }
  );
  getAllProducts = requestHandler(
    async (req, res, next) => {
      try {
        const qb = this.repository
          .createQueryBuilder("p")
          .leftJoinAndSelect("p.images", "i")
          .leftJoinAndSelect("p.brand", "b")
          .leftJoinAndSelect("p.productGroup", "pg")
          .leftJoinAndSelect("p.category", "cat")
          .leftJoinAndSelect("p.unit", "u")
          .leftJoinAndSelect("p.business", "business")
          .leftJoinAndSelect("p.model", "m");
        const products = await qb.getMany();
        this.success(res, products);
      } catch (error) {
        return ApiError(error.message, 404, next);
      }
    },
    {
      query: {
        cat: String.toString(),
        brand: String.toString(),
        model: String.toString(),
        color: String.toString(),
        group: String.toString(),
        seller: String.toString(),
      },
    }
  );

  getProduct = requestHandler(
    async (req, res, next) => {
      try {
        const product = await this.repository
          .createQueryBuilder("p")
          .leftJoinAndSelect("p.images", "i")
          .leftJoinAndSelect("p.brand", "b")
          .leftJoinAndSelect("p.productGroup", "pg")
          .leftJoinAndSelect("p.category", "cat")
          .leftJoinAndSelect("p.unit", "u")
          .leftJoinAndSelect("p.model", "m")
          .leftJoinAndSelect("p.user", "user")
          .leftJoinAndSelect("p.reviews", "r")
          .leftJoinAndSelect("user.profileImage", "up")
          .where("p.id = :id", { id: req.params.id })
          .getOne();
        this.success(res, product);
      } catch (e) {
        return ApiError(e.message, 404, next);
      }
    },
    {
      params: {} as any,
    }
  );

  static async getProductById(id: string) {
    return await appDataSource
      .getRepository(Product)
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.images", "i")
      .leftJoinAndSelect("p.business", "business")
      .leftJoinAndSelect("p.brand", "b")
      .leftJoinAndSelect("p.productGroup", "pg")
      .leftJoinAndSelect("p.category", "cat")
      .leftJoinAndSelect("p.unit", "u")
      .leftJoinAndSelect("p.model", "m")
      .where("p.id = :id", { id })
      .getOneOrFail();
  }

  getProductsByWarehouse = requestHandler(
    async (req, res, next) => {
      try {
        const product = await this.repository.find({
          where: {
            warehouse: {
              id: req.query.warehouseId,
            },
          },
        });

        this.success(res, product);
      } catch (e) {
        return ApiError(e.message, 404, next);
      }
    },
    {
      query: {} as any,
    }
  );
}
