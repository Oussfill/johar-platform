import {
  EmailProvider,
  SmsProvider,
  StorageProvider,
  PaymentProvider,
  KycProvider,
  SanctionsProvider,
} from "./provider.interfaces";

export class MockEmailProvider implements EmailProvider {
  async send(to: string, subject: string, html: string) {
    console.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}`);
    return { success: true, messageId: `mock-email-${Date.now()}` };
  }
}

export class MockSmsProvider implements SmsProvider {
  async send(to: string, message: string) {
    console.log(`[MOCK SMS] To: ${to}, Message: ${message}`);
    return { success: true, messageId: `mock-sms-${Date.now()}` };
  }
}

export class MockStorageProvider implements StorageProvider {
  private store = new Map<string, Buffer>();

  async upload(key: string, data: Buffer, contentType: string) {
    this.store.set(key, data);
    console.log(`[MOCK STORAGE] Uploaded: ${key} (${contentType})`);
    return { url: `https://mock-storage.example.com/${key}`, key };
  }

  async download(key: string) {
    const data = this.store.get(key);
    if (!data) throw new Error(`File not found: ${key}`);
    return data;
  }

  async delete(key: string) {
    this.store.delete(key);
    console.log(`[MOCK STORAGE] Deleted: ${key}`);
  }

  async getSignedUrl(key: string, expiresIn = 3600) {
    return `https://mock-storage.example.com/${key}?expires=${Date.now() + expiresIn * 1000}`;
  }
}

export class MockPaymentProvider implements PaymentProvider {
  async createCharge(amount: number, currency: string, source: string) {
    console.log(`[MOCK PAYMENT] Charge: ${amount} ${currency} from ${source}`);
    return { id: `mock-charge-${Date.now()}`, status: "succeeded" };
  }

  async getCharge(id: string) {
    return { id, status: "succeeded", amount: 1000 };
  }

  async refund(id: string, amount?: number) {
    console.log(`[MOCK PAYMENT] Refund: ${id}, amount: ${amount || "full"}`);
    return { id: `mock-refund-${Date.now()}`, status: "succeeded" };
  }
}

export class MockKycProvider implements KycProvider {
  async verifyIdentity(data: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    documentType: string;
    documentNumber: string;
  }) {
    console.log(`[MOCK KYC] Verifying: ${data.firstName} ${data.lastName}`);
    return { verified: true, confidence: 0.95, details: { provider: "mock" } };
  }
}

export class MockSanctionsProvider implements SanctionsProvider {
  async screen(data: {
    name: string;
    dateOfBirth?: string;
    nationality?: string;
    documentNumber?: string;
  }) {
    console.log(`[MOCK SANCTIONS] Screening: ${data.name}`);
    return { hits: [], riskLevel: "LOW" };
  }
}
