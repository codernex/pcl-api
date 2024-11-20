import { Between, FindOptionsWhere } from "typeorm";
import { Customer, Product, Production, Project } from "../entities";
import { Factory } from "../entities/factory";
import { FactoryVolatileProduct } from "../entities/FactoryVolatileProduct";
import { OpeningQuantity } from "../entities/opening-quantity";
import { requestHandler } from "../utils";
import { Controller } from "./base";
import { toZonedTime } from "date-fns-tz";

export class ProductionController extends Controller<Production> {
  constructor() {
    super(Production);
  }

  create = requestHandler(
    async (req, res, next) => {
      this.validateErr(req.body, "productId", "quantity", "factoryId");

      const product = await this.getRepository(Product).findOne({
        where: {
          id: req.body.productId,
        },
      });
      const factory = await this.getRepository(Factory).findOne({
        where: {
          id: req.body.factoryId,
        },
      });

      if (!factory) {
        return this.failed("Factory not found", next);
      }

      if (!product) {
        return this.failed("Product not found", next);
      }

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

      const openingQuantity = await this.getRepository(OpeningQuantity)
        .createQueryBuilder("oq")
        .leftJoinAndSelect("oq.factory", "f")
        .leftJoinAndSelect("oq.product", "p")
        .where("f.id = :factoryId", { factoryId: req.body.factoryId })
        .andWhere("p.id = :productId", { productId: req.body.productId })
        .getOne();

      if (!openingQuantity) {
        return this.failed("Opening quantity not found", next);
      }

      production.product = product;
      production.quantity = req.body.quantity;
      production.factory = factory;

      product.stock = Number(product.stock) + Number(req.body.quantity);

      const volatile = await this.getRepository(FactoryVolatileProduct).findOne(
        {
          where: {
            factory: {
              id: factory.id,
            },
            originalId: product.id,
          },
        }
      );

      if (!volatile) {
        throw new Error("Something went wrong with volatile product");
      }
      volatile.stock = Number(volatile.stock) + Number(req.body.quantity);

      await this.getRepository(FactoryVolatileProduct).save(volatile);

      await this.getRepository(Product).save(product);

      await this.getRepository(Production).save(production);
      this.success(res, production);
    },
    { body: {} as any }
  );

  get = requestHandler(
    async (req, res, next) => {
      let where: FindOptionsWhere<Production> = {};
      if (req.query.startDate && req.query.endDate) {
        // Convert the endDate to 23:59:59
        let endDate = new Date(req.query.endDate);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt = Between(req.query.startDate, endDate);
      }
      const production = await this.repository.find({
        relations: {
          customer: true,
          project: true,
        },
        order: {
          createdAt: "DESC",
        },
        where,
      });
      this.success(res, production);
    },
    {
      query: {} as any,
    }
  );
}
