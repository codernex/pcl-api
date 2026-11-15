import { Between, FindOptionsWhere, LessThan } from "typeorm";
import { Product, Production } from "../entities";
import { Factory } from "../entities/factory";
import { FactoryVolatileProduct } from "../entities/FactoryVolatileProduct";
import { OpeningQuantity } from "../entities/opening-quantity";
import { encodeCursor, parseCursorParams, requestHandler } from "../utils";
import { Controller } from "./base";
import { VolatileProduct } from "../entities/volatile-product";

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

  get = requestHandler(
    async (req, res, next) => {
      try {
        const { cursor, limit } = parseCursorParams(req.query);
        let where: FindOptionsWhere<Product> = {};
        if (req.query.startDate && req.query.endDate) {
          // Convert the endDate to 23:59:59
          let endDate = new Date(req.query.endDate);
          endDate.setHours(23, 59, 59, 999);
          where.created_at = Between(req.query.startDate, endDate);
        }

        const countWhere = { ...where };
        if (cursor) {
          where.id = LessThan(cursor);
        }

        const [items, totalCount] = await Promise.all([
          this.repository.find({
            order: {
              id: "DESC",
            },
            where,
            take: limit + 1,
          }),
          this.repository.count({ where: countWhere }),
        ]);

        const hasMore = items.length > limit;
        if (hasMore) items.pop();
        const nextCursor =
          hasMore && items.length > 0
            ? encodeCursor(items[items.length - 1].id)
            : null;

        return this.successPaginated(res, {
          items,
          nextCursor,
          hasMore,
          totalCount,
        });
      } catch (err) {
        return this.failed(err, next);
      }
    },
    {
      query: {} as any,
    }
  );

  getProductDetails = requestHandler(
    async (req, res, next) => {
      this.validateErr(req.params, "id");
      const product = await this.repository
        .createQueryBuilder("product")
        .leftJoinAndSelect("product.openingQuantity", "openingQuantity")
        .leftJoinAndSelect("openingQuantity.factory", "factory")
        .leftJoinAndSelect("factory.deliveries", "delivery")
        .leftJoinAndSelect("delivery.factory", "deliveryFactory")
        .leftJoinAndSelect("delivery.products", "products")
        .where("product.id=:id", { id: req.params.id })
        .getOne();

      const productions = await this.getRepository(Production)
        .createQueryBuilder("pr")
        .leftJoinAndSelect("pr.factory", "factory")
        .leftJoinAndSelect("pr.products", "products")
        .where("products.originalId=:id", { id: req.params.id })
        .getMany();
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
        !deliveries?.length ||
        !product
      ) {
        this.success(res, null, 200, "No data found");
        return;
      }

      this.success(res, {
        productions: productions.map((p) => ({
          ...p,
          quantity: p.products.find((pr) => pr.originalId === product.id)
            ?.quantity,
        })),
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

  getVolatileProducts = requestHandler(async (req, res, next) => {
    try {
      const { cursor, limit } = parseCursorParams(req.query);
      const where: FindOptionsWhere<VolatileProduct> = {};
      if (cursor) {
        where.id = LessThan(cursor);
      }
      const repo = this.getRepository(VolatileProduct);
      const [items, totalCount] = await Promise.all([
        repo.find({
          where,
          order: { id: "DESC" },
          take: limit + 1,
        }),
        repo.count(),
      ]);

      const hasMore = items.length > limit;
      if (hasMore) items.pop();
      const nextCursor =
        hasMore && items.length > 0
          ? encodeCursor(items[items.length - 1].id)
          : null;

      return this.successPaginated(res, {
        items,
        nextCursor,
        hasMore,
        totalCount,
      });
    } catch (err) {
      return this.failed(err, next);
    }
  });
}
