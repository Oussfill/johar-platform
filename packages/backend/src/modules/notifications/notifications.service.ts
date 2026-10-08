import { Injectable } from "@nestjs/common";

@Injectable()
export class NotificationsService {
  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    console.log(`[EMAIL] To: ${to}, Subject: ${subject}`);
  }

  async sendSms(phone: string, message: string): Promise<void> {
    console.log(`[SMS] To: ${phone}, Message: ${message}`);
  }

  async sendPush(userId: string, title: string, body: string): Promise<void> {
    console.log(`[PUSH] User: ${userId}, Title: ${title}`);
  }
}
