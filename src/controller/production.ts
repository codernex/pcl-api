import { toZonedTime } from "date-fns-tz";
import { Between, FindOptionsWhere, LessThan } from "typeorm";
import { Customer, Product, Production, Project } from "../entities";
import { Factory } from "../entities/factory";
import { FactoryVolatileProduct } from "../entities/FactoryVolatileProduct";
import { ProductionProduct } from "../entities/production-product";
import { encodeCursor, parseCursorParams, requestHandler } from "../utils";
import { Controller } from "./base";

export class ProductionController extends Controller<Production> {
  constructor() {
    super(Production);
  }

  create = requestHandler(
    async (req, res, next) => {
      this.validateErr(req.body, "products", "quantity", "factoryId");

      const factory = await this.getRepository(Factory).findOne({
        where: {
          id: req.body.factoryId,
        },
      });

      if (!factory) {
        return this.failed("Factory not found", next);
      }

      const productionProduct = await Promise.all(
        req.body.products.map(async (p) => {
          const newProduct = new ProductionProduct();

          newProduct.name = p.name;
          newProduct.quantity = p.quantity;
          newProduct.originalId = p.id;

          const product = await this.getRepository(Product).findOne({
            where: {
              id: p.id,
            },
          });
          if (!product) {
            throw new Error(
              "Someing went wrong while creating produciton product"
            );
          }

          const volatile = await this.getRepository(
            FactoryVolatileProduct
          ).findOne({
            where: {
              factory: {
                id: factory.id,
              },
              originalId: product.id,
            },
          });
          if (!volatile) {
            throw new Error(
              "Someing went wrong while creating produciton product"
            );
          }

          volatile.stock = Number(volatile.stock) + Number(p.quantity);
          product.stock += parseInt(p.quantity);
          await this.getRepository(FactoryVolatileProduct).save(volatile);
          await this.getRepository(Product).save(product);
          return await this.getRepository(ProductionProduct).save(newProduct);
        })
      );

      const production = new Production();
      if (req.body.projectId) {
        const project = await this.getRepository(Project).findOne({
          where: {
            id: req.body.projectId,
          },
        });
        if (!project) {
          return this.failed("Project not found", next);
        }
        production.project = project;
      }

      if (req.body.customerId) {
        const project = await this.getRepository(Customer).findOne({
          where: {
            id: req.body.customerId,
          },
        });
        if (!project) {
          return this.failed("Project not found", next);
        }
        production.customer = project;
      }
      if (req.body.productionDate) {
        const parsedDate = new Date(req.body.productionDate);
        if (!isNaN(parsedDate.getTime())) {
          production.createdAt = toZonedTime(
            req.body.productionDate,
            "Asia/Dhaka",
            {
              timeZone: "Asia/Dhaka",
            }
          );
        } else {
          // Handle invalid date if needed
          return this.failed("Invalid date format", next);
        }
      }

      production.products = productionProduct;
      production.quantity = req.body.quantity;
      production.factory = factory;

      if (req.body.shift === "day") {
        production.dayShift = parseInt(req.body.quantity) || 0;
      } else {
        production.nightShift = parseInt(req.body.quantity) || 0;
      }

      await this.getRepository(Production).save(production);
      this.success(res, production);
    },
    { body: {} as any }
  );

  get = requestHandler(
    async (req, res, next) => {
      try {
        const { cursor, limit } = parseCursorParams(req.query);
        let where: FindOptionsWhere<Production> = {};
        if (req.query.startDate && req.query.endDate) {
          // Convert the endDate to 23:59:59
          let endDate = new Date(req.query.endDate);
          endDate.setHours(23, 59, 59, 999);
          where.createdAt = Between(req.query.startDate, endDate);
        }

        const countWhere = { ...where };
        if (cursor) {
          where.id = LessThan(cursor);
        }

        const [items, totalCount] = await Promise.all([
          this.repository.find({
            relations: {
              customer: true,
              project: true,
            },
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
}
