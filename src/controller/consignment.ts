import { In } from "typeorm";
import { Customer, LcAgent, Port, Supplier } from "../entities";
import { Consignment } from "../entities/consignment";
import { Track } from "../entities/track";
import { appDataSource } from "../orm.config";
import { requestHandler } from "../utils";
import { Controller } from "./base";

export class ConsignmentController extends Controller<Consignment> {
  constructor() {
    super(Consignment);
  }

  get = requestHandler(async (req, res, next) => {
    const data = await this.repository.find({
      order: {
        createdAt: "DESC",
      },
    });
    return this.success(res, data);
  });

  create = requestHandler(
    async (req, res, next) => {
      this.validateErr(
        req.body,
        "manifestNumber",
        "cNumber",
        "portId",
        "customerId",
        "exporterId",
        "agentId",
        "tracks"
      );

      const queryRunner = appDataSource.createQueryRunner();

      await queryRunner.connect();

      const port = await queryRunner.manager.findOne(Port, {
        where: {
          id: req.body.portId,
        },
      });

      const customer = await queryRunner.manager.findOne(Customer, {
        where: {
          id: req.body.customerId,
        },
      });

      const exporter = await queryRunner.manager.findOne(Supplier, {
        where: {
          id: req.body.exporterId,
        },
      });

      const agent = await queryRunner.manager.findOne(LcAgent, {
        where: {
          id: req.body.agentId,
        },
      });

      const tracks = await queryRunner.manager.find(Track, {
        where: {
          id: In(req.body.tracks.map((t: any) => t.id)),
        },
      });

      if (!port || !customer || !exporter || !agent || !tracks) {
        throw new Error("Invalid port, customer, exporter or agent, tracks");
      }

      await queryRunner.startTransaction();
      const consignment = new Consignment();
      try {
        consignment.port = port;
        consignment.customer = customer;
        consignment.exporter = exporter;
        consignment.lcAgent = agent;
        consignment.manifestNumber = req.body.manifestNumber;
        consignment.cNumber = req.body.cNumber;
        consignment.tracks = tracks;
        await queryRunner.manager.save(consignment);
        await queryRunner.commitTransaction();
      } catch {
        await queryRunner.rollbackTransaction();
      } finally {
        await queryRunner.release();
      }
      this.success(res, consignment, 201);
    },
    {
      body: {} as any,
    }
  );

  updateStatus = requestHandler(
    async (req, res, next) => {
      const consignment = await this.getRepository(Consignment).findOne({
        where: {
          id: req.params.id,
        },
      });
      if (!consignment) {
        return this.failed("Consignment not found", next);
      }
      consignment.status = req.body.status;
      await this.getRepository(Consignment).save(consignment);
      return this.success(res, consignment);
    },
    {
      params: {} as any,
      body: {} as any,
    }
  );
}
