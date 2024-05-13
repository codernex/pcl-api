import {NextFunction, Request, Response} from "express";
import {ErrorHandler} from "../utils";
import sanitizedConfig from "../config";

function errorMiddleware(
    err: ErrorHandler,
    _req: Request,
    res: Response,
    _next: NextFunction
) {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Server Error";

    if (sanitizedConfig.NODE_ENV === "production") {
        process.stderr.write(
            "==================== \n" +
            "Error: " +
            err.message +
            "\n" +
            "Stack: " +
            err.stack +
            "\n" +
            "==================== \n"
        );
    }
    return res.status(err.statusCode).json({
        success: false,
        status: err.statusCode,
        error: err.message
    });
}

export default errorMiddleware;
