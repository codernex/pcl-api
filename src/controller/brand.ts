import { Brand, Category, Image } from "../entities";
import { ApiError, requestHandler } from "../utils";
import { Controller } from "./base";

export class BrandController extends Controller<Brand> {
  constructor() {
    super(Brand);
  }

  createBrand = requestHandler(
    async (req, res, next) => {
      try {
        const file = req.file;
        let brandImage: Image | null = null;

        this.validateErr(req.body, "isActive", "name", "categories");
        // Saving The Brand Image TO Database
        if (file) {
          brandImage = await this.getRepository(Image).save({
            ...file,
          });
        }
        const { categories, ...rest } = req.body;

        // Creating The Brand

        const brand = new Brand();
        Object.assign(brand, {
          ...rest,
          image: brandImage,
          isActive: req.body.isActive.toString() === "true",
        });

        if (categories && categories instanceof Array) {
          for (const categoryId of categories) {
            const category = await this.getRepository(Category).findOneOrFail({
              where: {
                id: categoryId,
              },
            });
            brand.addCategory(category);
          }
        } else {
          throw new Error("Categories must be an array");
        }

        await this.repository.save(brand);

        return this.success(res, brand, 201);
      } catch (err) {
        console.log(err);

        return ApiError(err.message, 500, next);
      }
    },
    {
      body: {} as any,
    }
  );

  getBrands = requestHandler(async (req, res, next) => {
    try {
      const brands = await this.repository.find({
        relations: {
          image: true,
          categories: true,
        },
      });
      return this.success(res, brands);
    } catch (err) {
      return ApiError(err.message, 404, next);
    }
  });
  deleteBrand = requestHandler(
    async (req, res, next) => {
      try {
        const brand = await this.repository.findOne({
          where: {
            id: req.params.id,
          },
          relations: {
            image: true,
          },
        });

        if (!brand) {
          return ApiError("Brand Not Found", 404, next);
        }

        await brand.remove();
        await brand?.image?.remove();

        return this.success(res, null, 200, "Brand Deleted Successfully");
      } catch (err) {
        return ApiError(err, 404, next);
      }
    },
    {
      params: { id: String.toString() },
    }
  );

  updateBrand = requestHandler(
    async (req, res, next) => {
      try {
        const qb = this.repository.createQueryBuilder("brand");
        const file = req.file;
        const brand = await qb
          .leftJoinAndSelect("brand.image", "image")
          .where("brand.id = :id", { id: req.params.id })
          .getOneOrFail();
        // Checking If The Image Is Provided
        if (file) {
          const image = new Image();
          Object.assign(image, file);
          brand.image = image;
        }

        const { image, categories, formData, ...rest } = req.body as any;

        Object.assign(brand, {
          ...rest,
          isActive: req.body?.isActive?.toString() === "true",
        });
        if (categories && categories instanceof Array) {
          for (const categoryId of categories) {
            console.log(categoryId);

            const category = await this.getRepository(Category).findOneOrFail({
              where: {
                id: categoryId,
              },
            });
            brand.addCategory(category);
          }
        } else {
          throw new Error("Categories must be an array");
        }
        await brand.save();

        return this.success(res, brand, 200, "Brand Updated Successfully");
      } catch (err) {
        return ApiError(err, 404, next);
      }
    },
    {
      params: {
        id: String.toString(),
      },
      body: {} as Brand,
    }
  );
}
