import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Request, Response } from "express";
import { StructuredLogger } from "../logger/structured.logger";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private logger = new StructuredLogger("ExceptionFilter");

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: "Internal server error" };

    const requestId = String(request.headers["x-request-id"] || "unknown");
    const tenant = (request as any).tenant;

    const errorCode = (message as any).error || "ERROR";
    const rawMessage = (message as any).message || message;
    const errorMessage = Array.isArray(rawMessage) ? rawMessage.join(", ") : String(rawMessage);

    this.logger.error(`${request.method} ${request.url} ${status}`, undefined, {
      requestId,
      userId: tenant?.userId,
      organizationId: tenant?.organizationId,
      method: request.method,
      path: request.url,
      statusCode: status,
      errorCode,
    });

    const errorResponse = {
      success: false,
      error: {
        code: errorCode,
        message: typeof errorMessage === "string" ? errorMessage : JSON.stringify(errorMessage),
      },
      requestId,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(errorResponse);
  }
}
