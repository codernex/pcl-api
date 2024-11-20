import { Product } from "../entities";
import { Factory } from "../entities/factory";
import { FactoryVolatileProduct } from "../entities/FactoryVolatileProduct";
import { OpeningQuantity } from "../entities/opening-quantity";
import { requestHandler } from "../utils";
import { Controller } from "./base";

export class ProductController extends Controller<Product> {
  constructor() {
    super(Product);
  }

  create = requestHandler(
    async (req, res, next) => {
      this.validateErr(req.body, "name", "factories");

      const newProduct = new Product();

      Object.assign(newProduct, req.body);

      await Promise.all(
        req.body.factories.map(async (factory: any) => {
          const f = await this.getRepository(Factory).findOne({
            where: {
              id: factory.id,
            },
          });

          if (!f) {
            throw new Error("Factory not found");
          }

          const openingQuantity = new OpeningQuantity();
          openingQuantity.factory = f;
          openingQuantity.quantity = Number(factory.openingQuantity);
          newProduct.openingQuantity = newProduct.openingQuantity
            ? [...newProduct.openingQuantity, openingQuantity]
            : [openingQuantity];

          newProduct.stock = newProduct.openingQuantity.reduce((prev, curr) => {
            return prev + Number(curr.quantity);
          }, 0);

          await this.getRepository(Factory).save(f);
          await this.getRepository(OpeningQuantity).save(openingQuantity);
        })
      );

      const product = await this.repository.save(newProduct);

      await Promise.all(
        req.body.factories.map(async (factory: any) => {
          const f = await this.getRepository(Factory).findOne({
            where: {
              id: factory.id,
            },
          });

          if (!f) {
            throw new Error("Factory not found");
          }
          const volatile = new FactoryVolatileProduct();
          volatile.factory = f;
          volatile.stock = parseInt(factory.openingQuantity);
          volatile.name = product.name;
          volatile.originalId = product.id;
          await this.getRepository(FactoryVolatileProduct).save(volatile);
        })
      );
      const { openingQuantity, ...rest } = product;

      this.success(
        res,
        {
          ...rest,
        },
        201
      );
    },
    {
      body: {} as any,
    }
  );

  get = requestHandler(async (req, res, next) => {
    const data = await this.repository.find({
      order: {
        created_at: "DESC",
      },
      relations: {
        productions: true,
      },
    });

    return this.success(res, data);
  });

  getProductDetails = requestHandler(
    async (req, res, next) => {
      this.validateErr(req.params, "id");
      const product = await this.repository
        .createQueryBuilder("product")
        .leftJoinAndSelect("product.openingQuantity", "openingQuantity")
        .leftJoinAndSelect("openingQuantity.factory", "factory")
        .leftJoinAndSelect("product.productions", "production")
        .leftJoinAndSelect("production.factory", "productionFactory")
        .leftJoinAndSelect("production.product", "productionProduct")
        .leftJoinAndSelect("factory.deliveries", "delivery")
        .leftJoinAndSelect("delivery.factory", "deliveryFactory")
        .leftJoinAndSelect("delivery.products", "products")
        .where("product.id=:id", { id: req.params.id })
        .getOne();

      const productions = product?.productions
        .filter((p) => p.product?.id === product?.id)
        .map((p) => ({
          ...p,
          type: "production",
        }));
      const openingQuantity = product?.openingQuantity.map(
        ({ factory, ...o }) => ({
          openingQuantity: {
            ...o,
            factory: factory?.name, // Renaming to 'factory.name'
          },
          type: "openingQuantity", // Tagging the type for later sorting
        })
      );
      const deliveries = product?.openingQuantity
        .flatMap((p) => p.factory?.deliveries) // Flattening deliveries from factory
        .filter((d) => d.products?.find((p) => p.originalId === product.id)) // Filtering deliveries with the product
        .map(({ products, ...d }) => ({
          ...d,
          factory: d?.factory?.name,
          type: "delivery", // Tagging the type for later sorting
        }));

      if (
        !productions?.length &&
        !openingQuantity?.length &&
        !deliveries?.length
      ) {
        this.success(res, null, 200, "No data found");
        return;
      }

      this.success(res, {
        productions,
        deliveries,
        openingQuantity,
      });
    },
    {
      params: {
        id: 0,
      },
    }
  );
}
