import { Injectable } from "@nestjs/common";
import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from "prom-client";

@Injectable()
export class MetricsService {
  readonly register: Registry;

  readonly httpRequestsTotal: Counter<string>;
  readonly httpRequestDuration: Histogram<string>;
  readonly httpErrorsTotal: Counter<string>;
  readonly dbQueryDuration: Histogram<string>;
  readonly dbErrorsTotal: Counter<string>;
  readonly dbConnections: Gauge<string>;
  readonly providerRequestsTotal: Counter<string>;
  readonly providerErrorsTotal: Counter<string>;
  readonly providerLatency: Histogram<string>;

  constructor() {
    this.register = new Registry();
    collectDefaultMetrics({ register: this.register });

    this.httpRequestsTotal = new Counter({
      name: "http_requests_total",
      help: "Total number of HTTP requests",
      labelNames: ["method", "path", "statusCode"],
      registers: [this.register],
    });

    this.httpRequestDuration = new Histogram({
      name: "http_request_duration_seconds",
      help: "HTTP request duration in seconds",
      labelNames: ["method", "path", "statusCode"],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.register],
    });

    this.httpErrorsTotal = new Counter({
      name: "http_errors_total",
      help: "Total number of HTTP errors (4xx, 5xx)",
      labelNames: ["method", "path", "statusCode"],
      registers: [this.register],
    });

    this.dbQueryDuration = new Histogram({
      name: "db_query_duration_seconds",
      help: "Database query duration in seconds",
      labelNames: ["operation"],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
      registers: [this.register],
    });

    this.dbErrorsTotal = new Counter({
      name: "db_errors_total",
      help: "Total number of database errors",
      labelNames: ["operation"],
      registers: [this.register],
    });

    this.dbConnections = new Gauge({
      name: "db_connections_active",
      help: "Number of active database connections",
      registers: [this.register],
    });

    this.providerRequestsTotal = new Counter({
      name: "provider_requests_total",
      help: "Total provider requests",
      labelNames: ["provider", "operation"],
      registers: [this.register],
    });

    this.providerErrorsTotal = new Counter({
      name: "provider_errors_total",
      help: "Total provider errors",
      labelNames: ["provider", "operation"],
      registers: [this.register],
    });

    this.providerLatency = new Histogram({
      name: "provider_latency_seconds",
      help: "Provider request latency in seconds",
      labelNames: ["provider", "operation"],
      buckets: [0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30],
      registers: [this.register],
    });
  }

  recordHttpRequest(method: string, path: string, statusCode: number, durationMs: number): void {
    const labels = { method, path, statusCode: String(statusCode) };
    this.httpRequestsTotal.inc(labels);
    this.httpRequestDuration.observe(labels, durationMs / 1000);
    if (statusCode >= 400) {
      this.httpErrorsTotal.inc(labels);
    }
  }

  recordDbQuery(operation: string, durationMs: number, error = false): void {
    this.dbQueryDuration.observe({ operation }, durationMs / 1000);
    if (error) {
      this.dbErrorsTotal.inc({ operation });
    }
  }

  recordProviderRequest(provider: string, operation: string, durationMs: number, error = false): void {
    const labels = { provider, operation };
    this.providerRequestsTotal.inc(labels);
    this.providerLatency.observe(labels, durationMs / 1000);
    if (error) {
      this.providerErrorsTotal.inc(labels);
    }
  }

  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  async getContentType(): Promise<string> {
    return this.register.contentType;
  }
}
