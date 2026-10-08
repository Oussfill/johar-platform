// ============================================================================
// GOLD PLATFORM — REQUEST VALIDATION MIDDLEWARE
// ============================================================================
// Middleware للتحقق من صحة بيانات الطلب باستخدام Zod
// تطبيق مبدأ Defense-in-Depth على مستوى إدخال البيانات

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import { Language } from '@prisma/client';

// ============================================================================
// VALIDATION MIDDLEWARE FACTORY
// ============================================================================

/**
 * إنشاء middleware تحقق من صحة بيانات الطلب
 * @param schema مخطط Zod للتحقق
 * @param source مصدر البيانات في الطلب (body, query, params)
 */
export function validateRequest(
  schema: ZodSchema,
  source: 'body' | 'query' | 'params' = 'body',
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = schema.parse(req[source]);
      (req as any).validatedData = data;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const lang = ((req as any).preferredLanguage as Language) || Language.EN;
        const formattedErrors = formatZodErrors(error, lang);

        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: getLocalizedMessage('errors.validation_error', lang),
            details: formattedErrors,
          },
          meta: {
            language: lang,
            currency: (req as any).preferredCurrency || 'USD',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }
      next(error);
    }
  };
}

// ============================================================================
// ZOD ERROR FORMATTING
// ============================================================================

function formatZodErrors(
  error: ZodError,
  lang: Language,
): Array<{ field: string; message: string }> {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: getLocalizedMessage(`errors.${err.code}`, lang) || err.message,
  }));
}

function getLocalizedMessage(key: string, lang: Language): string {
  const messages: Record<Language, Record<string, string>> = {
    AR: {
      'errors.validation_error': 'خطأ في التحقق من البيانات',
      'errors.invalid_type': 'نوع البيانات غير صالح',
      'errors.too_small': 'القيمة صغيرة جداً',
      'errors.too_big': 'القيمة كبيرة جداً',
      'errors.required': 'هذا الحقل مطلوب',
      'errors.invalid_string': 'النص غير صالح',
      'errors.invalid_enum_value': 'القيمة غير مسموح بها',
    },
    FR: {
      'errors.validation_error': 'Erreur de validation des données',
      'errors.invalid_type': 'Type de données invalide',
      'errors.too_small': 'Valeur trop petite',
      'errors.too_big': 'Valeur trop grande',
      'errors.required': 'Ce champ est requis',
      'errors.invalid_string': 'Texte invalide',
      'errors.invalid_enum_value': 'Valeur non autorisée',
    },
    EN: {
      'errors.validation_error': 'Data Validation Error',
      'errors.invalid_type': 'Invalid data type',
      'errors.too_small': 'Value too small',
      'errors.too_big': 'Value too large',
      'errors.required': 'This field is required',
      'errors.invalid_string': 'Invalid string',
      'errors.invalid_enum_value': 'Value not allowed',
    },
  };

  return messages[lang]?.[key] || messages[Language.EN][key] || key;
}

// ============================================================================
// COMMON VALIDATION SCHEMAS
// ============================================================================

// مخطط التحقق من معرّف UUID
export const uuidSchema = z.string().uuid('Invalid UUID format');

// مخطط التحقق من Gold ID
export const goldIdSchema = z
  .string()
  .regex(/^GOLD-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/, 'Invalid Gold ID format');

// مخطط التحقق من تسجيل الأصل الجديد
export const assetRegistrationSchema = z.object({
  serialNumber: z.string().min(1).max(100),
  manufacturerSerial: z.string().max(100).optional(),
  productType: z.enum(['BAR', 'COIN', 'JEWELLERY', 'BULLION', 'GEMSTONE', 'SCRAP', 'CUSTOM']),
  metalType: z.enum(['GOLD', 'SILVER', 'PLATINUM', 'PALLADIUM', 'GEMSTONE']),
  karat: z.number().int().min(1).max(24).optional(),
  weightGross: z.number().positive('Weight must be positive'),
  weightNet: z.number().positive('Net weight must be positive'),
  dimensions: z
    .object({
      length_mm: z.number().positive().optional(),
      width_mm: z.number().positive().optional(),
      thickness_mm: z.number().positive().optional(),
      diameter_mm: z.number().positive().optional(),
    })
    .optional(),
  color: z.string().max(30).optional(),
  originEntityId: uuidSchema.optional(),
  nfcUid: z.string().max(50).optional(),
  productImage: z.string().max(12_000_000).optional(),
  nameTranslations: z.object({
    ar: z.string().min(1),
    fr: z.string().min(1),
    en: z.string().min(1),
  }),
  descriptionTranslations: z
    .object({
      ar: z.string().optional(),
      fr: z.string().optional(),
      en: z.string().optional(),
    })
    .optional(),
});

// مخطط التحقق من طلب نقل الخزينة
export const transferRequestSchema = z.object({
  assetId: uuidSchema,
  toEntityId: uuidSchema,
  reason: z.string().min(1).max(500),
  estimatedValue: z.number().positive(),
  valueCurrency: z.enum(['DZD', 'EUR', 'USD']),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  transportMethod: z
    .enum([
      'ARMORED_VEHICLE',
      'SECURED_PARCEL',
      'BANK_TRANSFER',
      'PERSONAL_CARRY',
      'DIPLOMATIC_POUCH',
      'AIR_FREIGHT',
      'SEA_FREIGHT',
    ])
    .optional(),
});

// مخطط التحقق من تحليل المجوهرات بالـ AI
export const aiJewelleryAnalysisSchema = z.object({
  metalType: z.enum(['GOLD', 'SILVER', 'PLATINUM', 'PALLADIUM']),
  weightGross: z.number().positive(),
  karat: z.number().int().min(1).max(24).optional(),
  images: z.array(z.string().url()).max(10).optional(),
  estimatedGemstones: z
    .array(
      z.object({
        type: z.string(),
        carat: z.number().positive(),
        quality: z.string(),
      }),
    )
    .max(20)
    .optional(),
});

// مخطط التحقق من عمليات الدمج (Merge)
export const mergeAssetsSchema = z.object({
  assetIds: z.array(uuidSchema).min(2, 'At least 2 assets are required').max(50),
  newSerialNumber: z.string().max(100).optional(),
  productType: z
    .enum(['BAR', 'COIN', 'JEWELLERY', 'BULLION', 'GEMSTONE', 'SCRAP', 'CUSTOM'])
    .optional(),
  nameTranslations: z
    .object({
      ar: z.string().min(1).optional(),
      fr: z.string().min(1).optional(),
      en: z.string().min(1).optional(),
    })
    .optional(),
  descriptionTranslations: z
    .object({
      ar: z.string().optional(),
      fr: z.string().optional(),
      en: z.string().optional(),
    })
    .optional(),
  reason: z.string().max(1000).optional(),
});

// مخطط التحقق من عمليات التقسيم (Split)
export const splitAssetsSchema = z.object({
  splits: z
    .array(
      z.object({
        weightGross: z.number().positive('Weight must be positive'),
        weightNet: z.number().positive('Net weight must be positive').optional(),
        serialNumber: z.string().max(100).optional(),
        nameTranslations: z
          .object({
            ar: z.string().min(1).optional(),
            fr: z.string().min(1).optional(),
            en: z.string().min(1).optional(),
          })
          .optional(),
        descriptionTranslations: z
          .object({
            ar: z.string().optional(),
            fr: z.string().optional(),
            en: z.string().optional(),
          })
          .optional(),
      }),
    )
    .min(2, 'At least 2 split parts are required')
    .max(50),
  reason: z.string().max(1000).optional(),
});
