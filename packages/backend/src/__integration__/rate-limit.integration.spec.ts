import { Controller, Get, INestApplication, Module } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { RateLimitInterceptor } from "../common/guards/rate-limit.guard";

@Controller("__lim")
class LimController {
  @Get()
  ok() {
    return { ok: true };
  }
}

@Module({ controllers: [LimController] })
class LimModule {}

describe("Rate limiting (RateLimitInterceptor)", () => {
  let app: INestApplication;
  let http: any;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [LimModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalInterceptors(new RateLimitInterceptor());
    await app.init();
    http = app.getHttpServer();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it("(security regression) returns 429 with headers past the limit", async () => {
    const LIMIT = 100;
    let limited: any;

    for (let i = 0; i < LIMIT + 10; i++) {
      const res = await request(http).get("/__lim");
      if (res.status === 429) {
        limited = res;
        break;
      }
    }

    expect(limited).toBeDefined();
    expect(limited.status).toBe(429);
    expect(limited.body.error.code).toBe("RATE_LIMIT_EXCEEDED");

    const after = await request(http).get("/__lim");
    expect(after.status).toBe(429);
    expect(after.headers["x-ratelimit-limit"]).toBe(String(LIMIT));
    expect(after.headers["x-ratelimit-remaining"]).toBe("0");
    expect(after.headers["x-ratelimit-reset"]).toBeDefined();
  }, 60000);
});
