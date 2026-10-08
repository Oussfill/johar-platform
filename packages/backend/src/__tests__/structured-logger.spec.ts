import { StructuredLogger } from "../common/logger/structured.logger";

describe("StructuredLogger - sensitive data redaction", () => {
  let logSpy: jest.SpyInstance;
  let errSpy: jest.SpyInstance;
  const originalFormat = process.env.LOG_FORMAT;

  beforeEach(() => {
    process.env.LOG_FORMAT = "json";
    logSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);
    errSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    logSpy.mockRestore();
    errSpy.mockRestore();
    if (originalFormat === undefined) delete process.env.LOG_FORMAT;
    else process.env.LOG_FORMAT = originalFormat;
  });

  it("(security regression) redacts sensitive keys but keeps safe fields", () => {
    const logger = new StructuredLogger("test");
    logger.log("login attempt", {
      requestId: "req-1",
      password: "hunter2secret",
      mfaSecret: "ABCDEFGHIJKL",
      token: "abcdefghijklmnop",
      otpauth: "otpauth://totp/JOHAR",
      iban: "DE89370400440532013000",
      organizationId: "org-safe-123",
    } as any);

    const call = logSpy.mock.calls[logSpy.mock.calls.length - 1];
    const entry = JSON.parse(call[0]);

    expect(entry.requestId).toBe("req-1");
    expect(entry.organizationId).toBe("org-safe-123");
    expect(entry.password).not.toContain("hunter2secret");
    expect(entry.mfaSecret).not.toContain("ABCDEFGHIJKL");
    expect(entry.token).not.toContain("abcdefghijklmnop");
    expect(entry.otpauth).not.toContain("otpauth");
    expect(entry.iban).not.toContain("DE89370400440532013000");
  });

  it("(security regression) redacts nested sensitive fields", () => {
    const logger = new StructuredLogger("test");
    logger.error("provider failure", undefined, {
      provider: { provider_secret: "super-secret-value", name: "stripe" },
    } as any);

    const call = errSpy.mock.calls[0];
    const entry = JSON.parse(call[0]);

    expect(entry.provider.name).toBe("stripe");
    expect(entry.provider.provider_secret).not.toContain("super-secret-value");
  });
});
