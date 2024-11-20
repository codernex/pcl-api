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
import { requestHandler } from "../utils";
import { Controller } from "./base";
import { Between, FindOptionsWhere } from "typeorm";

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

      try {
        project.customer = customer;
        project.paidAmount = paidAmount;
        project.totalAmount = totalAmount;
        project.dueAmount = dueAmount;
        project.quantity = req.body.quantity;
        project.products = await Promise.all(volatileProducts);
        project.projectName = req.body.projectName;
        project.address = req.body.address;
        customer.due = Number(customer.due) + dueAmount;

        await Promise.all([
          this.getRepository(Customer).save(customer),
          this.repository.save(project),
        ]);
      } catch (error) {
        return this.failed(error.message, next);
      }

      return this.success(res, project, 201);
    },
    {
      body: {} as any,
    }
  );

  getProjects = requestHandler(async (req, res, next) => {
    const projects = await this.repository.find({
      order: {
        createdAt: "desc",
      },
      relations: {
        planProject: {
          product: true,
        },
      },
    });
    this.success(res, projects, 200);
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
              product.deliveredQuantity += p.quantity;

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

              return { ...product, deliveredQuantity: p.quantity };
            } catch (error) {
              console.log(error);

              throw new Error(error);
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
        return this.failed(error.message, next);
      }
    },
    {
      body: {} as any,
    }
  );

  getDelivery = requestHandler(
    async (req, res, next) => {
      let where: FindOptionsWhere<Delivery> = {};
      if (req.query.startDate && req.query.endDate) {
        // Convert the endDate to 23:59:59
        let endDate = new Date(req.query.endDate);
        endDate.setHours(23, 59, 59, 999);
        where.createAt = Between(req.query.startDate, endDate);
      }
      const delivery = await this.getRepository(Delivery).find({
        relations: {
          project: true,
          products: true,
          customer: true,
        },
        where: {
          project: true,
          products: true,
          customer: true,
          ...where,
        },
        order: {
          createAt: "desc",
        },
      });
      this.success(res, delivery);
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
      });
      if (!delivery) {
        return this.failed("Delivery not found", next);
      }
      delivery.status = "RECIEVED";
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
}
