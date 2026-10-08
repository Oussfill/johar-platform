// ============================================================================
// GOLD PLATFORM — WINSTON LOGGER CONFIGURATION
// ============================================================================

import winston from 'winston';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta,
    });
  }),
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: logFormat,
  defaultMeta: { service: 'johar-platform' },
  transports: [
    // في بيئة Serverless (Netlify) نستخدم console فقط — الملفات غير قابلة للكتابة
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production'
        ? logFormat
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
    }),
  ],
});

// ============================================================================
// AI DISCLAIMER — إخلاء المسؤولية الخاص بالذكاء الاصطناعي
// ============================================================================
export const AI_DISCLAIMER = {
  ar: 'تقييم الذكاء الاصطناعي هو مساعدة تحليلية ولا يحل محل الاختبار المختبري المطلوب قانوناً أو التقييم المهني.',
  fr: "L'évaluation par intelligence artificielle est une aide analytique et ne remplace pas les tests de laboratoire requis par la loi ni l'expertise professionnelle.",
  en: 'AI-generated assessment is an analytical aid and does not replace legally required laboratory testing or professional appraisal.',
} as const;

export type DisclaimerLanguage = keyof typeof AI_DISCLAIMER;
