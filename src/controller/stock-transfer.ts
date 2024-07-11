import { In } from "typeorm";
import { Product, ProductType, StockTransfer, Warehouse } from "../entities";
import { requestHandler } from "../utils";
import { Controller } from "./base";

export class StockTransferController extends Controller<StockTransfer> {
  constructor() {
    super(StockTransfer);
  }

  get = requestHandler(async (req, res, next) => {
    const transfers = await this.repository.find({ relations: ["products"] });
    this.success(res, transfers);
  });

  transferBusinessToWarehouse = requestHandler(
    async (req, res, next) => {
      try {
        this.validateErr(req.body, "stocks", "warehouseId");

        if (!req.user) {
          return this.failed("Unauthorized access", next, 401);
        }

        if (!req.body.stocks || !Array.isArray(req.body.stocks)) {
          return this.failed("Stocks are required", next, 400);
        }

        const products: Product[] = [];

        const warehouse = await this.getRepository(Warehouse).findOneOrFail({
          where: {
            id: req.body.warehouseId,
          },
        });

        for (const item of req.body.stocks) {
          const product = await this.getRepository(Product).findOneOrFail({
            where: {
              id: item.id,
            },
          });
          if (product.quantity < item.quantity) {
            return this.failed("Insufficient stock", next, 400);
          }

          if (product.product_type === ProductType.NON_BARCODE) {
            product.warehouseQty = item.quantity;
            product.quantity = product.quantity - item.quantity;
            if (product.quantity === 0) {
              product.business = null;
            }
            product.warehouse = warehouse;
          } else {
            product.business = null;
            product.warehouse = warehouse;
          }
          products.push(product);
        }

        const transfer = new StockTransfer();
        transfer.products = [...products] as any;
        transfer.transfered_form = req.user.business.name;
        transfer.transfered_to = warehouse.name;
        transfer.quantity = req.body.stocks.reduce((a, b) => a + b.quantity, 0);
        await this.repository.save(transfer);

        this.success(res, transfer, 201);
      } catch (error) {
        this.failed(error, next, 400);
      }
    },
    {
      body: {} as any,
    }
  );

  transferWarhouseToBusiness = requestHandler(
    async (req, res, next) => {
      try {
        this.validateErr(req.body, "stocks", "warehouseId");

        if (!req.user) {
          return this.failed("Unauthorized access", next, 401);
        }

        if (!req.body.stocks || !Array.isArray(req.body.stocks)) {
          return this.failed("Stocks are required", next, 400);
        }

        const warehouse = await this.getRepository(Warehouse).findOneOrFail({
          where: {
            id: req.body.warehouseId,
          },
        });

        const products: Product[] = [];

        for (const item of req.body.stocks) {
          const product = warehouse.products.find((p) => p.id === item.id);
          if (!product) {
            throw new Error("Product not found");
          }
          if (product.warehouseQty < item.quantity) {
            throw new Error("Insufficient quantity in warehouse");
          }

          if (product.product_type === ProductType.NON_BARCODE) {
            product.warehouseQty -= item.quantity;
            product.quantity += item.quantity;
            if (product.quantity === 0) {
              product.warehouse = null;
            }
            product.business = req.user?.business;
          } else {
            product.warehouse = null;
            product.business = req.user?.business;
          }
          products.push(product);
        }

        const transfer = new StockTransfer();
        transfer.products = [...products] as any;
        transfer.transfered_form = warehouse.name;
        transfer.transfered_to = req.user.business.name;
        transfer.quantity = req.body.stocks.reduce((a, b) => a + b.quantity, 0);
        await this.repository.save(transfer);

        this.success(res, transfer, 201);
      } catch (error) {
        this.failed(error, next, 400);
      }
    },
    {
      body: {} as any,
    }
  );
}
