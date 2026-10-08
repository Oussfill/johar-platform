export abstract class EmailProvider {
  abstract send(to: string, subject: string, html: string): Promise<{ success: boolean; messageId?: string }>;
}

export abstract class SmsProvider {
  abstract send(to: string, message: string): Promise<{ success: boolean; messageId?: string }>;
}

export abstract class StorageProvider {
  abstract upload(key: string, data: Buffer, contentType: string): Promise<{ url: string; key: string }>;
  abstract download(key: string): Promise<Buffer>;
  abstract delete(key: string): Promise<void>;
  abstract getSignedUrl(key: string, expiresIn?: number): Promise<string>;
}

export abstract class PaymentProvider {
  abstract createCharge(amount: number, currency: string, source: string): Promise<{ id: string; status: string }>;
  abstract getCharge(id: string): Promise<{ id: string; status: string; amount: number }>;
  abstract refund(id: string, amount?: number): Promise<{ id: string; status: string }>;
}

export abstract class KycProvider {
  abstract verifyIdentity(data: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    documentType: string;
    documentNumber: string;
  }): Promise<{ verified: boolean; confidence: number; details?: any }>;
}

export abstract class SanctionsProvider {
  abstract screen(data: {
    name: string;
    dateOfBirth?: string;
    nationality?: string;
    documentNumber?: string;
  }): Promise<{ hits: any[]; riskLevel: string }>;
}
