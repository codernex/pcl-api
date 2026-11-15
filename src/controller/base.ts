import { NextFunction, Response } from "express";
import { appDataSource } from "../orm.config";
import { EntityTarget, ObjectLiteral, QueryRunner, Repository } from "typeorm";
import { ApiError, CursorPaginatedResult, ErrorHandler } from "../utils";
import { APIResponse } from "../types";

export abstract class Controller<T extends ObjectLiteral> {
  protected repository: Repository<T>;
  protected queryRunner: QueryRunner;
  constructor(Entity: EntityTarget<T>) {
    this.repository = appDataSource.getRepository(Entity);
    this.queryRunner = appDataSource.createQueryRunner();
  }

  protected getRepository = <U extends ObjectLiteral>(
    Entity: EntityTarget<U>
  ) => appDataSource.getRepository(Entity);

  protected success = <T>(
    res: Response<APIResponse>,
    data?: T,
    status = 200,
    message?: string
  ) => {
    res.status(status).json({
      status,
      success: true,
      message,
      data,
    });
  };

  protected successPaginated = <T>(
    res: Response<APIResponse>,
    result: CursorPaginatedResult<T>,
    status = 200
  ) => {
    res.status(status).json({
      status,
      success: true,
      data: result.items,
      pagination: {
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
        totalCount: result.totalCount,
      },
    });
  };

  protected failed = (
    err: any,
    next: NextFunction,
    statusCode: number = 404
  ) => {
    ApiError(err, statusCode, next);
  };

  protected isValidEnum<T>(
    enumObject: T extends { [key: string]: any } ? T : never,
    type: keyof T
  ) {
    if (!type) {
      return;
    }

    const isValid = Object.values(enumObject).includes(type as any);

    if (!isValid) {
      const err = `${type.toString()} should be one of ${Object.values(
        enumObject
      )}`;
      throw new ErrorHandler(err, 404);
    }
  }

  protected validateErr = <
    TBody extends Record<string, any>,
    K extends keyof TBody,
  >(
    body: TBody,
    ...arr: K[]
  ) => {
    const errMessage: string[] = [];
    arr.forEach((item) => {
      if (body instanceof Array) {
        for (const obj of body) {
          if (!obj[item]) {
            errMessage.push(`${item.toString()} is required`);
          }
        }
      } else {
        if (!body[item]) {
          errMessage.push(`${item.toString()} is required`);
        }
      }
    });

    if (errMessage.length) {
      throw new ErrorHandler(errMessage.join(", "), 404);
    }
  };
}
