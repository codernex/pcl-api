import { NextFunction, Response } from "express";
import * as fs from "fs/promises";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import sanitizedConfig from "../config";
import { User } from "../entities";
import { APIResponse, CustomRequest, Handler } from "../types";

/**
 *
 * @param handler An Express Request Handler Function
 * @param config An Optional Object That Takes Zod Schema as Request Query, Body, Params To Validate
 * @returns Promise<void> | Promise<NextFunction>
 */

export const requestHandler = <TQuery, TBody, TParams>(
  handler: Handler<TQuery, TBody, TParams>,
  config?: {
    query?: TQuery;
    body?: TBody;
    params?: TParams;
  }
) => {
  return async (
    req: CustomRequest<TQuery, TBody, TParams>,
    res: Response<APIResponse>,
    next: NextFunction
  ) => {
    await Promise.resolve(handler(req, res, next));
  };
};

export class ErrorHandler extends Error {
  constructor(
    public message: string,
    public statusCode: number
  ) {
    super(message);

    Error.captureStackTrace(this);
  }
}

export function ApiError(
  err: any,
  statusCode: number = 500,
  next: NextFunction
) {
  return next(new ErrorHandler(prettyError(err, "API Error"), statusCode));
}

export const sendToken = (
  res: Response,
  user: User | null,
  next: NextFunction
) => {
  if (!user) {
    return ApiError("User not found", 404, next);
  }
  const token = jwt.sign(
    { sub: user.id, mobile: user.mobile },
    sanitizedConfig.JWT_SECRET,
    {
      expiresIn: "365d",
    }
  );

  if (!token) {
    return ApiError(
      "Please Login Again There are some unexpected error",
      404,
      next
    );
  }

  const { password, ...userWithoutPass } = user;
  res.status(200).json({
    user: userWithoutPass,
    accessToken: token,
  });
};

export function generateOTP(len: number): string {
  let otp: string = "";

  for (let i = 0; i < len; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }

  return otp;
}

export const smsApiError: Record<number, string> = {
  1002: "Sender Id/Masking Not Found",
  1003: "API Not Found",
  1004: "SPAM Detected",
  1005: "Internal Error",
  1006: "Internal Error",
  1007: "Balance Insufficient",
  1008: "Message is empty",
  1009: "Message Type Not Set (text/unicode)",
  1010: "Invalid User & Password",
  1011: "Invalid User Id",
  1012: "Invalid Number",
  1013: "API limit error",
  1014: "No matching template",
  1015: "SMS Content Validation Fails",
  404: "Mobile Not found",
  500: "Internal Error",
};

/**
 * Upload Using Multer
 */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

export const uploadImage = multer({
  storage: storage,
  fileFilter: function (req, file, callback) {
    const ext = path.extname(file.originalname);
    if (
      ext !== ".png" &&
      ext !== ".jpg" &&
      ext !== ".gif" &&
      ext !== ".jpeg" &&
      ext !== ".svg" &&
      ext !== ".webp" &&
      ext !== ".avif" &&
      ext !== ".pdf"
    ) {
      return callback(new Error("Only images and PDF are allowed"));
    }
    callback(null, true);
  },
});

/**
 * Delete File
 */

export const deleteFile = async (
  filePath: string | undefined,
  next?: NextFunction
) => {
  try {
    if (!filePath) throw new Error("File not found");
    await fs.unlink(filePath);
  } catch (error) {
    throw new Error(error);
  }
};

export const prettyError = (err: any, from?: string) => {
  let errMessage: string = "";
  if (err instanceof Error) {
    errMessage = err.message;
  } else if (typeof err === "string") {
    errMessage = err;
  }
  console.log(err);

  const cause = errMessage.split("'")[1] || errMessage.split('"')[1];
  if (err?.errno === 1451) {
    errMessage =
      "Cannot delete this data, Maybe some other data connected with this";
  }
  if (errMessage.includes("Duplicate")) {
    errMessage = `${from} already exists with ${cause}`;
  } else if (errMessage.includes("not find")) {
    errMessage = `${cause} not found with ${JSON.stringify(err?.criteria)}`;
  } else {
    errMessage = errMessage;
  }
  return errMessage;
};

export const generateRandomNumber = (length: number) => {
  let result = "";
  const characters = "0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return parseInt(result);
};
