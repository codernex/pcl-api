import { FindOptionsWhere, ILike, LessThan } from "typeorm";
import {
  CrmActivity,
  CrmActivityStatus,
  CrmActivityType,
  CrmDeal,
  CrmDealPriority,
  CrmDealSource,
  CrmDealStage,
  Customer,
  User,
} from "../entities";
import {
  ApiError,
  ErrorHandler,
  encodeCursor,
  parseCursorParams,
  requestHandler,
} from "../utils";
import { Controller } from "./base";

export class CrmController extends Controller<CrmDeal> {
  constructor() {
    super(CrmDeal);
  }

  getDeals = requestHandler(async (req, res, next) => {
    try {
      const q = req.query as any;
      const { cursor, limit } = parseCursorParams(q);
      const stage = q.stage as CrmDealStage | undefined;
      const priority = q.priority as CrmDealPriority | undefined;
      const search = q.search as string | undefined;
      const customerId = q.customerId ? parseInt(q.customerId as string) : undefined;
      const assignedToId = q.assignedToId ? parseInt(q.assignedToId as string) : undefined;
      const all = q.all === "true";

      const where: FindOptionsWhere<CrmDeal> = {};
      if (cursor && !all) {
        where.id = LessThan(cursor);
      }
      if (stage && Object.values(CrmDealStage).includes(stage)) {
        where.stage = stage;
      }
      if (priority && Object.values(CrmDealPriority).includes(priority)) {
        where.priority = priority;
      }
      if (customerId) {
        where.customer = { id: customerId };
      }
      if (assignedToId) {
        where.assignedTo = { id: assignedToId };
      }

      // If search query is provided, search by title, companyName, or contactName
      let findWhere: FindOptionsWhere<CrmDeal> | FindOptionsWhere<CrmDeal>[] = where;
      if (search && search.trim()) {
        const queryTerm = `%${search.trim()}%`;
        findWhere = [
          { ...where, title: ILike(queryTerm) },
          { ...where, companyName: ILike(queryTerm) },
          { ...where, contactName: ILike(queryTerm) },
        ];
      }

      if (all) {
        const items = await this.repository.find({
          where: findWhere,
          relations: {
            customer: true,
            assignedTo: true,
            activities: true,
          },
          order: {
            id: "DESC",
          },
        });
        return this.success(res, items, 200);
      }

      const [items, totalCount] = await Promise.all([
        this.repository.find({
          where: findWhere,
          relations: {
            customer: true,
            assignedTo: true,
            activities: true,
          },
          order: {
            id: "DESC",
          },
          take: limit + 1,
        }),
        this.repository.count({ where: findWhere }),
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
      return ApiError(err, 500, next);
    }
  });

  getDealById = requestHandler(
    async (req, res, next) => {
      try {
        const deal = await this.repository.findOne({
          where: { id: parseInt(req.params.id) },
          relations: {
            customer: true,
            assignedTo: true,
            activities: {
              user: true,
            },
          },
          order: {
            activities: {
              created_at: "DESC",
            },
          },
        });

        if (!deal) {
          throw new ErrorHandler("CRM Deal not found", 404);
        }

        return this.success(res, deal, 200);
      } catch (err) {
        return ApiError(err, 500, next);
      }
    },
    {
      params: { id: "" },
    }
  );

  createDeal = requestHandler(
    async (req, res, next) => {
      try {
        this.validateErr(req.body, "title");

        const deal = new CrmDeal();
        deal.title = req.body.title;
        deal.description = req.body.description || null;
        deal.value = Number(req.body.value) || 0;
        deal.stage = req.body.stage || CrmDealStage.LEAD;
        deal.priority = req.body.priority || CrmDealPriority.MEDIUM;
        deal.probability = req.body.probability !== undefined ? Number(req.body.probability) : 20;
        deal.source = req.body.source || CrmDealSource.DIRECT_SALES;
        deal.expectedCloseDate = req.body.expectedCloseDate || null;
        deal.contactName = req.body.contactName || null;
        deal.contactEmail = req.body.contactEmail || null;
        deal.contactPhone = req.body.contactPhone || null;
        deal.companyName = req.body.companyName || null;

        if (req.body.customerId) {
          const customer = await this.getRepository(Customer).findOne({
            where: { id: parseInt(req.body.customerId) },
          });
          if (customer) {
            deal.customer = customer;
            if (!deal.companyName) deal.companyName = customer.company_name;
            if (!deal.contactName) deal.contactName = customer.name;
            if (!deal.contactPhone) deal.contactPhone = customer.mobile;
            if (!deal.contactEmail) deal.contactEmail = customer.email;
          }
        }

        if (req.body.assignedToId) {
          const user = await this.getRepository(User).findOne({
            where: { id: parseInt(req.body.assignedToId) },
          });
          if (user) {
            deal.assignedTo = user;
          }
        } else if (req.user) {
          deal.assignedTo = req.user;
        }

        const savedDeal = await this.repository.save(deal);

        // Auto create initial creation activity
        const activity = new CrmActivity();
        activity.type = CrmActivityType.NOTE;
        activity.title = "Deal Created";
        activity.description = `Opportunity "${savedDeal.title}" created with initial stage: ${savedDeal.stage}.`;
        activity.deal = savedDeal;
        if (savedDeal.customer) activity.customer = savedDeal.customer;
        if (req.user) activity.user = req.user;
        await this.getRepository(CrmActivity).save(activity);

        return this.success(res, savedDeal, 201);
      } catch (err) {
        return ApiError(err, 500, next);
      }
    },
    {
      body: {} as any,
    }
  );

  updateDeal = requestHandler(
    async (req, res, next) => {
      try {
        const deal = await this.repository.findOne({
          where: { id: parseInt(req.params.id) },
        });

        if (!deal) {
          throw new ErrorHandler("Deal not found", 404);
        }

        if (req.body.title !== undefined) deal.title = req.body.title;
        if (req.body.description !== undefined) deal.description = req.body.description;
        if (req.body.value !== undefined) deal.value = Number(req.body.value);
        if (req.body.stage !== undefined) deal.stage = req.body.stage;
        if (req.body.priority !== undefined) deal.priority = req.body.priority;
        if (req.body.probability !== undefined) deal.probability = Number(req.body.probability);
        if (req.body.source !== undefined) deal.source = req.body.source;
        if (req.body.expectedCloseDate !== undefined) deal.expectedCloseDate = req.body.expectedCloseDate;
        if (req.body.contactName !== undefined) deal.contactName = req.body.contactName;
        if (req.body.contactEmail !== undefined) deal.contactEmail = req.body.contactEmail;
        if (req.body.contactPhone !== undefined) deal.contactPhone = req.body.contactPhone;
        if (req.body.companyName !== undefined) deal.companyName = req.body.companyName;
        if (req.body.lostReason !== undefined) deal.lostReason = req.body.lostReason;

        if (req.body.customerId !== undefined) {
          if (req.body.customerId) {
            const customer = await this.getRepository(Customer).findOne({
              where: { id: parseInt(req.body.customerId) },
            });
            deal.customer = customer || null;
          } else {
            deal.customer = null;
          }
        }

        if (req.body.assignedToId !== undefined) {
          if (req.body.assignedToId) {
            const user = await this.getRepository(User).findOne({
              where: { id: parseInt(req.body.assignedToId) },
            });
            deal.assignedTo = user || null;
          } else {
            deal.assignedTo = null;
          }
        }

        if (deal.stage === CrmDealStage.WON && !deal.actualCloseDate) {
          deal.actualCloseDate = new Date().toISOString().split("T")[0];
          deal.probability = 100;
        }

        const updated = await this.repository.save(deal);
        return this.success(res, updated, 200);
      } catch (err) {
        return ApiError(err, 500, next);
      }
    },
    {
      params: { id: "" },
      body: {} as any,
    }
  );

  updateDealStage = requestHandler(
    async (req, res, next) => {
      try {
        this.validateErr(req.body, "stage");
        const deal = await this.repository.findOne({
          where: { id: parseInt(req.params.id) },
          relations: { customer: true },
        });

        if (!deal) {
          throw new ErrorHandler("Deal not found", 404);
        }

        const oldStage = deal.stage;
        const newStage = req.body.stage as CrmDealStage;
        deal.stage = newStage;

        if (req.body.probability !== undefined) {
          deal.probability = Number(req.body.probability);
        } else if (newStage === CrmDealStage.WON) {
          deal.probability = 100;
          deal.actualCloseDate = new Date().toISOString().split("T")[0];
        } else if (newStage === CrmDealStage.LOST) {
          deal.probability = 0;
          if (req.body.lostReason) deal.lostReason = req.body.lostReason;
        }

        const updated = await this.repository.save(deal);

        // Log stage transition activity
        const activity = new CrmActivity();
        activity.type = newStage === CrmDealStage.WON ? CrmActivityType.TASK : CrmActivityType.NOTE;
        activity.title = `Stage changed: ${oldStage} → ${newStage}`;
        activity.description = `Opportunity moved to stage ${newStage}.${req.body.note ? ` Note: ${req.body.note}` : ""}`;
        activity.deal = updated;
        if (updated.customer) activity.customer = updated.customer;
        if (req.user) activity.user = req.user;
        await this.getRepository(CrmActivity).save(activity);

        return this.success(res, updated, 200);
      } catch (err) {
        return ApiError(err, 500, next);
      }
    },
    {
      params: { id: "" },
      body: {} as any,
    }
  );

  deleteDeal = requestHandler(
    async (req, res, next) => {
      try {
        const deal = await this.repository.findOne({
          where: { id: parseInt(req.params.id) },
        });

        if (!deal) {
          throw new ErrorHandler("Deal not found", 404);
        }

        await this.repository.remove(deal);
        return this.success(res, { message: "Deal deleted successfully" }, 200);
      } catch (err) {
        return ApiError(err, 500, next);
      }
    },
    {
      params: { id: "" },
    }
  );

  getCrmStats = requestHandler(async (req, res, next) => {
    try {
      const deals = await this.repository.find({
        select: ["id", "stage", "value", "created_at"],
      });

      const totalDeals = deals.length;
      let activePipelineValue = 0;
      let activeDealsCount = 0;
      let wonRevenue = 0;
      let wonCount = 0;
      let lostCount = 0;

      const stageCounts: Record<string, { count: number; value: number }> = {
        [CrmDealStage.LEAD]: { count: 0, value: 0 },
        [CrmDealStage.QUALIFIED]: { count: 0, value: 0 },
        [CrmDealStage.PROPOSAL]: { count: 0, value: 0 },
        [CrmDealStage.NEGOTIATION]: { count: 0, value: 0 },
        [CrmDealStage.WON]: { count: 0, value: 0 },
        [CrmDealStage.LOST]: { count: 0, value: 0 },
      };

      deals.forEach((deal) => {
        const val = Number(deal.value) || 0;
        if (stageCounts[deal.stage]) {
          stageCounts[deal.stage].count += 1;
          stageCounts[deal.stage].value += val;
        }

        if (deal.stage === CrmDealStage.WON) {
          wonCount += 1;
          wonRevenue += val;
        } else if (deal.stage === CrmDealStage.LOST) {
          lostCount += 1;
        } else {
          activeDealsCount += 1;
          activePipelineValue += val;
        }
      });

      const winRate =
        wonCount + lostCount > 0
          ? Math.round((wonCount / (wonCount + lostCount)) * 100)
          : totalDeals > 0
          ? Math.round((wonCount / totalDeals) * 100)
          : 0;

      return this.success(
        res,
        {
          totalDeals,
          activeDealsCount,
          activePipelineValue,
          wonCount,
          wonRevenue,
          lostCount,
          winRate,
          stageCounts,
        },
        200
      );
    } catch (err) {
      return ApiError(err, 500, next);
    }
  });

  // --- CRM Activities ---

  getActivities = requestHandler(async (req, res, next) => {
    try {
      const q = req.query as any;
      const dealId = q.dealId ? parseInt(q.dealId as string) : undefined;
      const customerId = q.customerId ? parseInt(q.customerId as string) : undefined;
      const limit = q.limit ? parseInt(q.limit as string) : 50;

      const where: FindOptionsWhere<CrmActivity> = {};
      if (dealId) where.deal = { id: dealId };
      if (customerId) where.customer = { id: customerId };

      const activities = await this.getRepository(CrmActivity).find({
        where,
        relations: {
          deal: true,
          customer: true,
          user: true,
        },
        order: {
          created_at: "DESC",
        },
        take: limit,
      });

      return this.success(res, activities, 200);
    } catch (err) {
      return ApiError(err, 500, next);
    }
  });

  createActivity = requestHandler(
    async (req, res, next) => {
      try {
        this.validateErr(req.body, "title", "type");

        const activity = new CrmActivity();
        activity.title = req.body.title;
        activity.type = req.body.type || CrmActivityType.CALL;
        activity.description = req.body.description || null;
        activity.status = req.body.status || CrmActivityStatus.COMPLETED;
        activity.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
        activity.completedAt = req.body.status === CrmActivityStatus.COMPLETED ? new Date() : null;

        if (req.body.dealId) {
          const deal = await this.repository.findOne({
            where: { id: parseInt(req.body.dealId) },
            relations: { customer: true },
          });
          if (deal) {
            activity.deal = deal;
            if (deal.customer && !req.body.customerId) {
              activity.customer = deal.customer;
            }
          }
        }

        if (req.body.customerId) {
          const customer = await this.getRepository(Customer).findOne({
            where: { id: parseInt(req.body.customerId) },
          });
          if (customer) activity.customer = customer;
        }

        if (req.user) {
          activity.user = req.user;
        }

        const saved = await this.getRepository(CrmActivity).save(activity);
        return this.success(res, saved, 201);
      } catch (err) {
        return ApiError(err, 500, next);
      }
    },
    {
      body: {} as any,
    }
  );

  deleteActivity = requestHandler(
    async (req, res, next) => {
      try {
        const repo = this.getRepository(CrmActivity);
        const activity = await repo.findOne({
          where: { id: parseInt(req.params.id) },
        });

        if (!activity) {
          throw new ErrorHandler("Activity not found", 404);
        }

        await repo.remove(activity);
        return this.success(res, { message: "Activity deleted successfully" }, 200);
      } catch (err) {
        return ApiError(err, 500, next);
      }
    },
    {
      params: { id: "" },
    }
  );
}
