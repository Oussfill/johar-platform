import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import * as crypto from "crypto";
import * as express from "express";
import { AppModule } from "./app.module";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { HttpLoggingInterceptor } from "./common/interceptors/http-logging.interceptor";
import { RateLimitInterceptor } from "./common/guards/rate-limit.guard";
import { MetricsService } from "./common/metrics/metrics.service";

const logger = new Logger("Bootstrap");

async function bootstrap() {
  validateEnvironment();

  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === "production"
      ? ["error", "warn", "log"]
      : ["error", "warn", "log", "debug", "verbose"],
  });

  app.setGlobalPrefix("api/v1");

  app.enableCors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",")
      : ["http://localhost:3001"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
    maxAge: 86400,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      disableErrorMessages: process.env.NODE_ENV === "production",
    })
  );

  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new HttpLoggingInterceptor(app.get(MetricsService)),
    new RateLimitInterceptor()
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  app.use((req: any, _res: any, next: any) => {
    if (!req.headers["x-request-id"]) {
      req.headers["x-request-id"] = crypto.randomUUID();
    }
    next();
  });

  app.use((req: any, res: any, next: any) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()"
    );
    if (process.env.NODE_ENV === "production") {
      res.setHeader(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains; preload"
      );
    }
    next();
  });

  const config = new DocumentBuilder()
    .setTitle("JOHAR API")
    .setDescription("Global Gold & Jewelry Digital Infrastructure & Marketplace")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const swaggerPath = process.env.SWAGGER_PATH || "docs";
  if (swaggerPath !== "disabled") {
    SwaggerModule.setup(swaggerPath, app, document);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`JOHAR API running on http://localhost:${port}`);
  if (swaggerPath !== "disabled") {
    logger.log(`Swagger docs: http://localhost:${port}/${swaggerPath}`);
  }

  const shutdown = async (signal: string) => {
    logger.log(`Received ${signal}, shutting down gracefully...`);
    await app.close();
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  process.on("unhandledRejection", (reason: any) => {
    logger.error("Unhandled Rejection:", reason);
  });

  process.on("uncaughtException", (error: Error) => {
    logger.error("Uncaught Exception:", error);
    process.exit(1);
  });
}

function validateEnvironment() {
  const required = ["JWT_SECRET", "DATABASE_URL"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(", ")}`);
    logger.error("Set them in .env or your environment before starting.");
    logger.error("See .env.example for reference.");
    process.exit(1);
  }

  const jwtSecret = process.env.JWT_SECRET!;
  if (jwtSecret.length < 32) {
    logger.error(`JWT_SECRET must be at least 32 characters (current: ${jwtSecret.length})`);
    process.exit(1);
  }

  if (process.env.NODE_ENV === "production") {
    if (jwtSecret === "dev-secret" || jwtSecret.includes("change-me")) {
      logger.error("JWT_SECRET appears to be a development value. Change it for production!");
      process.exit(1);
    }
  }
}

bootstrap();
