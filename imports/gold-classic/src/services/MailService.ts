// ============================================================================
// GOLD PLATFORM — MAIL SERVICE
// ============================================================================
// خدمة إرسال البريد الإلكتروني — قابلة للتبديل بين المزوّدين
//
//  الوضع المتاح حالياً:
//   - Resend (REST API) — عند تعيين EMAIL_PROVIDER=resend و RESEND_API_KEY
//   - Demo           — الافتراضي؛ يسجل الكود ويعيده في الاستجابة (لا إرسال فعلي)
//
//  الأمان: لا يُعاد الكود في وضع الإرسال الفعلي — يُستقبل في صندوق البريد فقط.

import { config } from '../config';
import { logger } from '../config/logger';

export type EmailDelivery = 'email' | 'demo';

interface SendOtpOptions {
  email: string;
  code: string;
  lang?: 'AR' | 'FR' | 'EN';
}

// ============================================================================
// SEND OTP EMAIL
// ============================================================================

export async function sendOtpEmail(opts: SendOtpOptions): Promise<{ delivery: EmailDelivery }> {
  const lang = opts.lang || 'EN';
  const subject =
    lang === 'AR'
      ? 'جوهر — رمز تسجيل الدخول'
      : lang === 'FR'
      ? 'JOHAR — Code de connexion'
      : 'JOHAR — Login Code';

  const texts: Record<string, { line: string; hint: string }> = {
    AR: {
      line: `رمز تسجيل الدخول الخاص بك هو: ${opts.code}`,
      hint: 'الرمز صالح لمدة 10 دقائق ولا يُستخدم إلا مرة واحدة.',
    },
    FR: {
      line: `Votre code de connexion est : ${opts.code}`,
      hint: 'Ce code est valable 10 minutes et à usage unique.',
    },
    EN: {
      line: `Your login code is: ${opts.code}`,
      hint: 'This code is valid for 10 minutes and can be used only once.',
    },
  };

  if (config.mail.provider === 'resend' && config.mail.resendApiKey) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.mail.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: config.mail.from,
        to: [opts.email],
        subject,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;border:1px solid #c6a969;border-radius:12px;overflow:hidden">
            <div style="background:#0a0a0f;padding:24px;text-align:center">
              <h1 style="color:#c6a969;margin:0;font-size:22px">جوهر — JOHAR</h1>
            </div>
            <div style="padding:24px">
              <p style="font-size:16px;color:#222">${texts[lang].line}</p>
              <div style="font-size:28px;font-weight:700;letter-spacing:8px;color:#0a0a0f;text-align:center;padding:16px;background:#f5efe0;border-radius:8px;margin:16px 0">${opts.code}</div>
              <p style="font-size:12px;color:#777">${texts[lang].hint}</p>
            </div>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      logger.error('Resend API failed', { status: response.status, error: errText });
      throw new Error(`Resend API error ${response.status}`);
    }

    logger.info('OTP email sent via Resend', { email: opts.email });
    return { delivery: 'email' };
  }

  // وضع تجريبي — لا إرسال فعلي، الكود يُسجل ويُعاد في الاستجابة
  logger.info('OTP email [demo mode]', { email: opts.email, code: opts.code });
  return { delivery: 'demo' };
}