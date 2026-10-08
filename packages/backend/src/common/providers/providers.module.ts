import { Module, Global, Logger } from "@nestjs/common";
import {
  MockEmailProvider,
  MockSmsProvider,
  MockStorageProvider,
  MockPaymentProvider,
  MockKycProvider,
  MockSanctionsProvider,
} from "./mock-providers";
import {
  EmailProvider,
  SmsProvider,
  StorageProvider,
  PaymentProvider,
  KycProvider,
  SanctionsProvider,
} from "./provider.interfaces";

const logger = new Logger("ProvidersModule");

function getProvider<T>(name: string, mockClass: any, allowedValues: string[]): any {
  const value = process.env[name] || "console";
  if (!allowedValues.includes(value)) {
    logger.warn(`Unknown ${name}="${value}", falling back to mock. Allowed: ${allowedValues.join(", ")}`);
    return mockClass;
  }
  if (value === "mock" || value === "console") {
    if (process.env.NODE_ENV === "production") {
      logger.error(`CRITICAL: ${name}="${value}" is not allowed in production! Set a real provider.`);
      process.exit(1);
    }
    logger.warn(`${name}="${value}" — using mock provider. NOT suitable for production.`);
    return mockClass;
  }
  return mockClass;
}

const emailProvider = getProvider("EMAIL_PROVIDER", MockEmailProvider, ["console", "mock", "sendgrid", "ses", "smtp"]);
const smsProvider = getProvider("SMS_PROVIDER", MockSmsProvider, ["console", "mock", "twilio"]);
const storageProvider = getProvider("STORAGE_PROVIDER", MockStorageProvider, ["console", "mock", "s3", "minio"]);
const paymentProvider = getProvider("PAYMENT_PROVIDER", MockPaymentProvider, ["console", "mock", "stripe", "checkout"]);
const kycProvider = getProvider("KYC_PROVIDER", MockKycProvider, ["mock", "jumio", "onfido"]);
const sanctionsProvider = getProvider("SANCTIONS_PROVIDER", MockSanctionsProvider, ["mock", "chainalysis", "refinitiv"]);

const providers = [
  { provide: EmailProvider, useClass: emailProvider },
  { provide: SmsProvider, useClass: smsProvider },
  { provide: StorageProvider, useClass: storageProvider },
  { provide: PaymentProvider, useClass: paymentProvider },
  { provide: KycProvider, useClass: kycProvider },
  { provide: SanctionsProvider, useClass: sanctionsProvider },
];

@Global()
@Module({
  providers: [...providers],
  exports: [...providers.map((p) => p.provide)],
})
export class ProvidersModule {}
