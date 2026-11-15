import { FindOptionsWhere, LessThan } from "typeorm";
import { Customer, Project } from "../entities";
import { Factory } from "../entities/factory";
import { Wastage } from "../entities/wastage";
import { WastageProduct } from "../entities/wastage-product";
import { encodeCursor, parseCursorParams, requestHandler } from "../utils";
import { Controller } from "./base";

export class WastageController extends Controller<Wastage> {
  constructor() {
    super(Wastage);
  }

  get = requestHandler(async (req, res, next) => {
    try {
      const { cursor, limit } = parseCursorParams(req.query);
      const where: FindOptionsWhere<Wastage> = {};
      if (cursor) {
        where.id = LessThan(cursor);
      }

      const [items, totalCount] = await Promise.all([
        this.repository.find({
          where,
          relations: {
            customer: true,
            factory: true,
            project: true,
          },
          order: {
            id: "DESC",
          },
          take: limit + 1,
        }),
        this.repository.count(),
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

  create = requestHandler(
    async (req, res, next) => {
      this.validateErr(req.body, "products", "factoryId");
      let project: Project | null = null;
      let customer: Customer | null = null;
      if (req.body.customerId) {
        customer = await this.getRepository(Customer).findOne({
          where: {
            id: req.body.customerId,
          },
        });
      }

      if (req.body.projectId) {
        project = await this.getRepository(Project).findOne({
          where: {
            id: req.body.projectId,
          },
        });
      }

      

      if (req.body.projectId && !project) {
        return this.failed("Project not found", next);
      }

      if (req.body.customerId && !customer) {
        return this.failed("Customer not found", next);
      }

      const factory = await this.getRepository(Factory).findOne({
        where: {
          id: req.body.factoryId,
        },
      });

      if (!factory) {
        return this.failed("Factory not found", next);
      }

      const volatileProducts = await Promise.all(
        req.body.products.map(async ({ id, ...p }) => {
          const product = new WastageProduct();
          product.originalId = id;
          product.quantity = p.quantity;

          if(project){
            
          }else{
            
          }
          await this.getRepository(WastageProduct).save(product);
          return product;
        })
      );

      const wastage = new Wastage();
      wastage.products = volatileProducts;
      if (customer) {
        wastage.customer = customer;
      }

      if (project) {
        wastage.project = project;
      }
      wastage.factory = factory;
      wastage.quantity = req.body.quantity;
      wastage.reason = req.body?.reason || "Not Specified";
      await this.getRepository(Wastage).save(wastage);
      this.success(res, wastage);
    },
    {
      body: {} as any,
    }
  );
}
