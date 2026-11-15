import { toZonedTime } from "date-fns-tz";
import {
  Customer,
  Delivery,
  Documents,
  Product,
  Production,
  Project,
} from "../entities";
import { Factory } from "../entities/factory";
import { FactoryVolatileProduct } from "../entities/FactoryVolatileProduct";
import { VolatileProduct } from "../entities/volatile-product";
import { encodeCursor, parseCursorParams, requestHandler } from "../utils";
import { Controller } from "./base";
import { Between, FindOptionsWhere, In, LessThan } from "typeorm";
import { Slot } from "../entities/slot";

export class ProjectController extends Controller<Project> {
  constructor() {
    super(Project);
  }

  addProject = requestHandler(
    async (req, res, next) => {
      this.validateErr(
        req.body,
        "customerId",
        "products",
        "totalAmount",
        "quantity",
        "projectName"
      );

      const customer = await this.getRepository(Customer).findOne({
        where: {
          id: req.body.customerId,
        },
      });

      if (!customer) {
        return this.failed("Customer not found", next);
      }

      const paidAmount = parseFloat(req.body.paidAmount) || 0;
      const totalAmount = parseFloat(req.body.totalAmount) || 0;
      const dueAmount = Math.max(totalAmount - paidAmount, 0);
      const project = new Project();

      const volatileProducts = req.body.products.map(async ({ id, ...p }) => {
        const product = new VolatileProduct();
        product.originalId = id;
        product.quantity = p.quantity;
        product.deliveredQuantity = 0;
        product.name = p.name;
        product.unitRate = p.unitRate;

        await this.getRepository(VolatileProduct).save(product);
        return product;
      });

      const slot = new Slot();
      slot.project = project;
      slot.name = "Default Slot";
      slot.products = await Promise.all(volatileProducts);

      try {
        project.customer = customer;
        project.paidAmount = paidAmount;
        project.totalAmount = totalAmount;
        project.dueAmount = dueAmount;
        project.quantity = req.body.quantity;
        project.projectName = req.body.projectName;
        project.address = req.body.address;
        customer.due = Number(customer.due) + dueAmount;

        await Promise.all([
          this.getRepository(Customer).save(customer),
          this.repository.save(project),
          this.getRepository(Slot).save(slot),
        ]);
      } catch (error) {
        const err = error as any
        return this.failed(err.message, next);
      }

      return this.success(res, project, 201);
    },
    {
      body: {} as any,
    }
  );

  getProjects = requestHandler(async (req, res, next) => {
    try {
      const { cursor, limit } = parseCursorParams(req.query);
      const where: FindOptionsWhere<Project> = {};
      if (cursor) {
        where.id = LessThan(cursor);
      }

      const [items, totalCount] = await Promise.all([
        this.repository.find({
          where,
          order: {
            id: "DESC",
          },
          relations: {
            planProject: {
              product: true,
            },
            wastages: true,
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

  addDelivery = requestHandler(
    async (req, res, next) => {
      try {
        this.validateErr(
          req.body,
          "projectId",
          "products",
          "quantity",
          "challanNumber",
          "trackNumber",
          "customerId",
          "factoryId"
        );

        const project = await this.getRepository(Project).findOne({
          where: {
            id: req.body.projectId,
          },
        });

        const factory = await this.getRepository(Factory).findOne({
          where: {
            id: req.body.factoryId,
          },
        });

        const customer = await this.getRepository(Customer).findOne({
          where: {
            id: req.body.customerId,
          },
        });

        if (!customer) {
          return this.failed("Customer not found", next);
        }

        if (!project) {
          return this.failed("Project not found", next);
        }

        if (!factory) {
          return this.failed("Factory not found", next);
        }

        const products = await Promise.all(
          req.body.products.map(async (testP) => {
            try {
              const p = JSON.parse(testP);

              // Fetch the product and production data
              const product = await this.getRepository(VolatileProduct).findOne(
                {
                  where: { id: p.id },
                }
              );

              if (!product) {
                throw new Error("Something went wrong with product");
              }

              const originalProduct = await this.getRepository(Product).findOne(
                {
                  where: {
                    id: product.originalId,
                  },
                }
              );

              if (!originalProduct) {
                throw new Error("Something wrong with product");
              }

              if (!product) {
                return null; // Prevent further code execution for this product
              }

              // Check if requested quantity exceeds product quantity
              if (p.quantity > product.quantity) {
                throw new Error("Requested quantity exceeds product quantity");
              }

              // Check if delivered quantity exceeds product quantity
              if (product.deliveredQuantity + p.quantity > product.quantity) {
                throw new Error("Delivered quantity exceeds product quantity");
              }

              const factoryProduct = await this.getRepository(
                FactoryVolatileProduct
              ).findOne({
                where: {
                  originalId: originalProduct.id,
                  factory: {
                    id: factory.id,
                  },
                },
              });

              if (!factoryProduct) {
                throw new Error("Factory product not found");
              }

              if (p.quantity > factoryProduct.stock) {
                throw new Error(
                  "Stock exceed, Factory may not have enough stock"
                );
              }

              // Update product's delivered quantity
              product.pendingQuantity += p.quantity;

              originalProduct.stock = Math.max(
                originalProduct.stock - p.quantity,
                0
              );

              factoryProduct.stock = Math.max(
                factoryProduct.stock - p.quantity,
                0
              );
              await this.getRepository(Product).save(originalProduct);

              await this.getRepository(VolatileProduct).save(product);

              return { ...product, pendingQuantity: p.quantity };
            } catch (error) {
              const err = error as any
              throw new Error(err);
            }
          })
        );

        const successfulProducts = products.filter(
          (product) => product !== null
        );

        if (!successfulProducts) {
          throw new Error("An error occurred while processing the product");
        }

        const delivery = new Delivery();

        if (req.file) {
          delivery.url = req.file.filename;
        }

        delivery.quantity = req.body.quantity;
        delivery.products = successfulProducts;
        delivery.project = project;
        delivery.challanNumber = req.body.challanNumber;
        delivery.trackNumber = req.body.trackNumber;
        delivery.customer = customer;
        delivery.factory = factory;

        if (req.body.deliveryDate) {
          const parsedDate = new Date(req.body.deliveryDate);
          if (!isNaN(parsedDate.getTime())) {
            delivery.createAt = toZonedTime(
              req.body.deliveryDate,
              "Asia/Dhaka",
              {
                timeZone: "Asia/Dhaka",
              }
            );
          } else {
            // Handle invalid date if needed
            throw new Error("Invalid date format");
          }
        }

        await this.getRepository(Delivery).save(delivery);

        return this.success(res, delivery, 201);
      } catch (error) {
        const err = error as any
        return this.failed(err.message, next);
      }
    },
    {
      body: {} as any,
    }
  );

  getDelivery = requestHandler(
    async (req, res, next) => {
      try {
        const { cursor, limit } = parseCursorParams(req.query);
        let dateWhere: FindOptionsWhere<Delivery> = {};
        if (req.query.startDate && req.query.endDate) {
          // Convert the endDate to 23:59:59
          let endDate = new Date(req.query.endDate);
          endDate.setHours(23, 59, 59, 999);
          dateWhere.createAt = Between(req.query.startDate, endDate);
        }

        const countWhere: FindOptionsWhere<Delivery> = {
          project: true,
          products: true,
          customer: true,
          ...dateWhere,
        };

        const where: FindOptionsWhere<Delivery> = {
          ...countWhere,
        };
        if (cursor) {
          where.id = LessThan(cursor);
        }

        const deliveryRepo = this.getRepository(Delivery);
        const [items, totalCount] = await Promise.all([
          deliveryRepo.find({
            relations: {
              project: true,
              products: true,
              customer: true,
            },
            where,
            order: {
              id: "DESC",
            },
            take: limit + 1,
          }),
          deliveryRepo.count({ where: countWhere }),
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

  updateStatus = requestHandler(
    async (req, res, next) => {
      this.validateErr(req.body, "deliveryId");
      const delivery = await this.getRepository(Delivery).findOne({
        where: {
          id: req.body.deliveryId,
        },
        relations: {
          products: true,
        },
      });
      if (!delivery) {
        return this.failed("Delivery not found", next);
      }
      delivery.status = "RECIEVED";

      const products = await this.getRepository(VolatileProduct).find({
        where: {
          id: In(delivery.products.map((p) => p.id)),
        },
      });

      if (!products.length) {
        return this.failed("Products not found", next);
      }

      await Promise.all(
        products.map(async (p) => {
          const product = await this.getRepository(VolatileProduct).findOne({
            where: {
              id: p.id,
            },
          });
          if (!product) {
            throw new Error("Something went wrong");
          }
          product.deliveredQuantity += product.pendingQuantity;

          await this.getRepository(VolatileProduct).save(product);
        })
      );

      await this.getRepository(Delivery).save(delivery);
      this.success(res, delivery);
    },
    {
      body: { deliveryId: 0 } as any,
    }
  );

  uploadDocuments = requestHandler(
    async (req, res, next) => {
      this.validateErr(req.body, "projectId", "name");

      const file = req.file as Express.Multer.File;

      const project = await this.repository.findOne({
        where: {
          id: req.body.projectId,
        },
      });
      if (!project) {
        return this.failed("Project not found", next);
      }

      if (!file) {
        return this.failed("File not found", next);
      }

      const document = new Documents();
      document.name = req.body.name;
      document.url = file.filename;
      document.project = project;

      await this.getRepository(Documents).save(document);

      this.success(res, document, 201);
    },
    {
      body: {} as any,
    }
  );

  uploadDeliveryDocuments = requestHandler(
    async (req, res, next) => {
      this.validateErr(req.body, "deliveryId", "name");

      const file = req.file as Express.Multer.File;

      const project = await this.getRepository(Delivery).findOne({
        where: {
          id: req.body.projectId,
        },
      });
      if (!project) {
        return this.failed("Delivery not found", next);
      }

      if (!file) {
        return this.failed("File not found", next);
      }

      const document = new Documents();
      document.name = req.body.name;
      document.url = file.filename;
      document.delivery = project;

      await this.getRepository(Documents).save(document);

      this.success(res, document, 201);
    },
    {
      body: {} as any,
    }
  );

  addOrder = requestHandler(
    async (req, res, next) => {
      this.validateErr(req.body, "projectId", "products", "name");
      const project = await this.repository.findOne({
        where: {
          id: req.body.projectId,
        },
      });

      if (!project) {
        return this.failed("Project not found", next);
      }

      const volatileProducts = await Promise.all(
        req.body.products.map(async ({ id, ...p }) => {
          const product = new VolatileProduct();
          product.originalId = id;
          product.quantity = p.quantity;
          product.deliveredQuantity = 0;
          product.name = p.name;
          product.unitRate = p.unitRate;

          await this.getRepository(VolatileProduct).save(product);
          return product;
        })
      );

      const totalAmount = volatileProducts.reduce(
        (a, b) => a + (parseInt(b.unitRate) || 0) * (parseInt(b.quantity) || 0),
        0
      );
      const quantity = volatileProducts.reduce(
        (a, b) => a + parseInt(b.quantity) || 0,
        0
      );

      const customer = await this.getRepository(Customer).findOne({
        where: {
          id: project.customer.id,
        },
      });

      if (!customer) {
        return this.failed("Customer not found", next);
      }
      const slot = new Slot();
      slot.project = project;
      slot.products = volatileProducts;
      slot.name = req.body.name;

      project.quantity += quantity;
      project.totalAmount += totalAmount;
      project.dueAmount += totalAmount;
      customer.due += totalAmount;
      await this.getRepository(Project).save(project);
      await this.getRepository(Customer).save(customer);
      await this.getRepository(Slot).save(slot);
      this.success(res, project);
    },
    {
      body: {} as any,
    }
  );

  removeOrder = requestHandler(
    async (req, res, next) => {
      this.validateErr(req.body, "projectId", "productId", "slotId");

      const project = await this.repository.findOne({
        where: {
          id: req.body.projectId,
        },
      });
      if (!project) {
        throw new Error("Project not found");
      }

      const customer = await this.getRepository(Customer).findOne({
        where: {
          id: project?.customer?.id,
        },
      });

      if (!customer) {
        throw new Error("Customer not found");
      }

      const product = await this.getRepository(VolatileProduct).findOne({
        where: {
          id: req.body.productId,
        },
      });

      if (!product) {
        throw new Error("Product not found");
      }

      const slot = await this.getRepository(Slot).findOne({
        where: {
          id: req.body.slotId,
        },
      });

      if (!slot) {
        throw new Error("Slot not found");
      }
      slot.products = slot.products.filter((p) => p.id !== product.id);
      await this.getRepository(Slot).save(slot);

      const productAmount = product.unitRate * product.quantity;

      project.quantity -= product.quantity;
      project.totalAmount -= productAmount;
      project.dueAmount -= productAmount;
      customer.due -= productAmount;

      await this.getRepository(Customer).save(customer);
      await this.getRepository(Project).save(project);
      this.success(res, project);
    },
    {
      body: {} as any,
    }
  );
}
