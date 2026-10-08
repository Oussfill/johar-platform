import { ExecutionContext, CallHandler } from "@nestjs/common";
import { of, firstValueFrom } from "rxjs";
import { HttpLoggingInterceptor } from "./http-logging.interceptor";

describe("HttpLoggingInterceptor - metric label cardinality", () => {
  const originalFormat = process.env.LOG_FORMAT;

  beforeEach(() => {
    process.env.LOG_FORMAT = "json";
    jest.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalFormat === undefined) delete process.env.LOG_FORMAT;
    else process.env.LOG_FORMAT = originalFormat;
  });

  function createContext(request: any, statusCode = 200): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({ statusCode }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  }

  function createCallHandler(): CallHandler {
    return { handle: () => of({}) };
  }

  it("(security regression) records the route template, not the raw URL with ids", async () => {
    const metrics = { recordHttpRequest: jest.fn() } as any;
    const interceptor = new HttpLoggingInterceptor(metrics);

    const request = {
      method: "GET",
      url: "/api/v1/assets/11111111-2222-3333-4444-555555555555",
      route: { path: "/api/v1/assets/:id" },
      ip: "127.0.0.1",
      headers: {},
    };

    await firstValueFrom(interceptor.intercept(createContext(request), createCallHandler()));

    expect(metrics.recordHttpRequest).toHaveBeenCalledWith(
      "GET",
      "/api/v1/assets/:id",
      200,
      expect.any(Number)
    );
    const recordedPath = metrics.recordHttpRequest.mock.calls[0][1];
    expect(recordedPath).not.toContain("11111111");
  });

  it("(security regression) falls back to a bounded label when no route matched", async () => {
    const metrics = { recordHttpRequest: jest.fn() } as any;
    const interceptor = new HttpLoggingInterceptor(metrics);

    const request = {
      method: "GET",
      url: "/api/v1/does-not-exist/99999999",
      ip: "127.0.0.1",
      headers: {},
    };

    await firstValueFrom(interceptor.intercept(createContext(request, 404), createCallHandler()));

    expect(metrics.recordHttpRequest).toHaveBeenCalledWith(
      "GET",
      "unmatched",
      404,
      expect.any(Number)
    );
  });
});
