// ============================================================================
// GOLD PLATFORM — WORKER CONTROLLER
// ============================================================================
// Controller إدارة العمال وشؤونهم المالية
// - إدارة أنواع العمال (WorkerType) والراتب الأساسي لكل نوع
// - إدارة سجل العمال (Worker) مع راتب مخصص يحدده الأدمن
// - نظام الرواتب (SalaryPayment) مرتبط بنظام المالية

import { Request, Response } from 'express';
import { Language, Currency } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { isValidUuid } from '../utils/guards';

type Lang = Language | 'AR' | 'FR' | 'EN';

const ERRORS: Record<Language, Record<string, string>> = {
  AR: {
    not_found: 'السجل غير موجود',
    invalid_data: 'بيانات غير صالحة',
    duplicate_code: 'الرمز مستخدم بالفعل',
    internal: 'خطأ داخلي في النظام',
    missing_salary: 'الراتب مطلوب',
    invalid_id: 'معرّف غير صالح',
  },
  FR: {
    not_found: 'Enregistrement introuvable',
    invalid_data: 'Données invalides',
    duplicate_code: 'Code déjà utilisé',
    internal: 'Erreur interne du système',
    missing_salary: 'Le salaire est requis',
    invalid_id: 'Identifiant invalide',
  },
  EN: {
    not_found: 'Record not found',
    invalid_data: 'Invalid data',
    duplicate_code: 'Code already in use',
    internal: 'Internal system error',
    missing_salary: 'Salary is required',
    invalid_id: 'Invalid id',
  },
};

function msg(lang: Lang, key: string): string {
  return (ERRORS[lang as Language] && ERRORS[lang as Language][key]) || ERRORS.EN[key] || key;
}

function bad(res: Response, code: string, message: string, lang: Lang) {
  res.status(400).json({
    success: false,
    error: { code, message },
    meta: { language: lang, currency: 'USD', timestamp: new Date().toISOString() },
  });
}

function notFound(res: Response, code: string, message: string, lang: Lang) {
  res.status(404).json({
    success: false,
    error: { code, message },
    meta: { language: lang, currency: 'USD', timestamp: new Date().toISOString() },
  });
}

function toNumber(v: any): number | null {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function pickName(t: any, lang: Lang): string {
  if (!t || typeof t !== 'object') return '';
  return (t[lang] || t.en || t.fr || t.ar || '');
}

function isCurrency(v: string): v is Currency {
  return v === 'DZD' || v === 'EUR' || v === 'USD';
}

function currencyOf(lang: Lang, fallback: string): Currency {
  return isCurrency(fallback) ? fallback : 'DZD';
}

// ============================================================================
// أنواع العمال — Worker Types
// ============================================================================

export async function getWorkerTypes(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  try {
    const types = await prisma.workerType.findMany({
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { workers: true } } },
    });
    res.json({
      success: true,
      data: {
        types: types.map((t) => ({
          id: t.id,
          code: t.code,
          name: t.nameTranslations,
          baseSalary: Number(t.baseSalary),
          salaryCurrency: t.salaryCurrency,
          isActive: t.isActive,
          workersCount: t._count.workers,
        })),
      },
      meta: { language: lang, currency: 'USD', timestamp: new Date().toISOString() },
    });
  } catch (e) {
    logger.error('getWorkerTypes failed', { error: e });
    res.status(500).json({ success: false, error: { code: 'INTERNAL', message: msg(lang, 'internal') } });
  }
}

export async function createWorkerType(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  try {
    const { code, nameTranslations, baseSalary, salaryCurrency } = req.body || {};
    const trimmed = String(code || '').trim();
    if (!trimmed || !nameTranslations?.ar || !nameTranslations?.en) {
      bad(res, 'INVALID_DATA', msg(lang, 'invalid_data'), lang);
      return;
    }
    const salary = toNumber(baseSalary);
    if (salary === null || salary < 0) {
      bad(res, 'INVALID_SALARY', msg(lang, 'missing_salary'), lang);
      return;
    }
    const existing = await prisma.workerType.findUnique({ where: { code: trimmed } });
    if (existing) {
      bad(res, 'DUPLICATE_CODE', msg(lang, 'duplicate_code'), lang);
      return;
    }
    const type = await prisma.workerType.create({
      data: {
        code: trimmed,
        nameTranslations: nameTranslations as any,
        baseSalary: salary,
        salaryCurrency: currencyOf(lang, salaryCurrency),
      },
    });
    await prisma.auditLog.create({
      data: {
        userId: (req as any).userId,
        action: 'WORKER_TYPE_CREATED',
        entityType: 'WorkerType',
        entityId: type.id,
        description: `Worker type created: ${trimmed}`,
        newValues: { code: trimmed, baseSalary: salary },
        severity: 'INFO',
        category: 'OPERATION',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
    res.status(201).json({
      success: true,
      data: { id: type.id, code: type.code, baseSalary: Number(type.baseSalary) },
      meta: { language: lang, currency: 'USD', timestamp: new Date().toISOString() },
    });
  } catch (e) {
    logger.error('createWorkerType failed', { error: e });
    res.status(500).json({ success: false, error: { code: 'INTERNAL', message: msg(lang, 'internal') } });
  }
}

export async function updateWorkerType(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  try {
    const { id } = req.params;
    const { code, nameTranslations, baseSalary, salaryCurrency, isActive } = req.body || {};
    const existing = await prisma.workerType.findUnique({ where: { id } });
    if (!existing) {
      notFound(res, 'NOT_FOUND', msg(lang, 'not_found'), lang);
      return;
    }
    const data: any = {};
    if (code !== undefined) data.code = String(code).trim();
    if (nameTranslations !== undefined) data.nameTranslations = nameTranslations;
    if (baseSalary !== undefined) {
      const salary = toNumber(baseSalary);
      if (salary === null || salary < 0) {
        bad(res, 'INVALID_SALARY', msg(lang, 'missing_salary'), lang);
        return;
      }
      data.baseSalary = salary;
    }
    if (salaryCurrency !== undefined && isCurrency(salaryCurrency)) data.salaryCurrency = salaryCurrency;
    if (typeof isActive === 'boolean') data.isActive = isActive;
    const updated = await prisma.workerType.update({ where: { id }, data });
    await prisma.auditLog.create({
      data: {
        userId: (req as any).userId,
        action: 'WORKER_TYPE_UPDATED',
        entityType: 'WorkerType',
        entityId: id,
        description: `Worker type updated: ${updated.code}`,
        newValues: data,
        severity: 'INFO',
        category: 'OPERATION',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
    res.json({
      success: true,
      data: { id: updated.id, code: updated.code, baseSalary: Number(updated.baseSalary), isActive: updated.isActive },
      meta: { language: lang, currency: 'USD', timestamp: new Date().toISOString() },
    });
  } catch (e) {
    logger.error('updateWorkerType failed', { error: e });
    res.status(500).json({ success: false, error: { code: 'INTERNAL', message: msg(lang, 'internal') } });
  }
}

export async function deleteWorkerType(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  try {
    const { id } = req.params;
    const existing = await prisma.workerType.findUnique({ where: { id } });
    if (!existing) {
      notFound(res, 'NOT_FOUND', msg(lang, 'not_found'), lang);
      return;
    }
    await prisma.workerType.update({ where: { id }, data: { isActive: false } });
    await prisma.auditLog.create({
      data: {
        userId: (req as any).userId,
        action: 'WORKER_TYPE_DELETED',
        entityType: 'WorkerType',
        entityId: id,
        description: `Worker type deactivated: ${existing.code}`,
        severity: 'INFO',
        category: 'OPERATION',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
    res.json({ success: true, data: { id, isActive: false }, meta: { language: lang, currency: 'USD', timestamp: new Date().toISOString() } });
  } catch (e) {
    logger.error('deleteWorkerType failed', { error: e });
    res.status(500).json({ success: false, error: { code: 'INTERNAL', message: msg(lang, 'internal') } });
  }
}

// ============================================================================
// العمال — Workers
// ============================================================================

export async function listWorkers(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  try {
    const { page = '1', limit = '50', status, workerTypeId, search } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit as string, 10) || 50));
    const where: any = {};
    if (status) where.status = status;
    if (workerTypeId) where.workerTypeId = workerTypeId;
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    const [workers, total] = await Promise.all([
      prisma.worker.findMany({
        where,
        include: { workerType: true },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.worker.count({ where }),
    ]);
    res.json({
      success: true,
      data: {
        workers: workers.map((w) => ({
          id: w.id,
          firstName: w.firstName,
          lastName: w.lastName,
          phone: w.phone,
          email: w.email,
          workerType: {
            id: w.workerType.id,
            code: w.workerType.code,
            name: w.workerType.nameTranslations,
          },
          salary: Number(w.salary),
          salaryCurrency: w.salaryCurrency,
          hireDate: w.hireDate,
          status: w.status,
        })),
        pagination: { currentPage: pageNum, totalPages: Math.ceil(total / limitNum), totalItems: total },
      },
      meta: { language: lang, currency: 'USD', timestamp: new Date().toISOString() },
    });
  } catch (e) {
    logger.error('listWorkers failed', { error: e });
    res.status(500).json({ success: false, error: { code: 'INTERNAL', message: msg(lang, 'internal') } });
  }
}

export async function getWorker(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  try {
    const { id } = req.params;
    const worker = await prisma.worker.findUnique({
      where: { id },
      include: { workerType: true, salaryPayments: { orderBy: { createdAt: 'desc' }, take: 24 } },
    });
    if (!worker) {
      notFound(res, 'NOT_FOUND', msg(lang, 'not_found'), lang);
      return;
    }
    res.json({
      success: true,
      data: {
        id: worker.id,
        firstName: worker.firstName,
        lastName: worker.lastName,
        phone: worker.phone,
        email: worker.email,
        workerType: {
          id: worker.workerType.id,
          code: worker.workerType.code,
          name: worker.workerType.nameTranslations,
        },
        salary: Number(worker.salary),
        salaryCurrency: worker.salaryCurrency,
        hireDate: worker.hireDate,
        status: worker.status,
        notes: worker.notes,
        payments: worker.salaryPayments.map((p) => ({
          id: p.id,
          amount: Number(p.amount),
          currency: p.currency,
          periodStart: p.periodStart,
          periodEnd: p.periodEnd,
          status: p.status,
          method: p.method,
          paidAt: p.paidAt,
        })),
      },
      meta: { language: lang, currency: 'USD', timestamp: new Date().toISOString() },
    });
  } catch (e) {
    logger.error('getWorker failed', { error: e });
    res.status(500).json({ success: false, error: { code: 'INTERNAL', message: msg(lang, 'internal') } });
  }
}

export async function createWorker(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  try {
    const { firstName, lastName, phone, email, workerTypeId, salary, salaryCurrency, hireDate } = req.body || {};
    if (!firstName || !lastName || !workerTypeId) {
      bad(res, 'INVALID_DATA', msg(lang, 'invalid_data'), lang);
      return;
    }
    const salaryVal = toNumber(salary);
    if (salaryVal === null || salaryVal < 0) {
      bad(res, 'INVALID_SALARY', msg(lang, 'missing_salary'), lang);
      return;
    }
    const type = await prisma.workerType.findUnique({ where: { id: workerTypeId } });
    if (!type) {
      bad(res, 'INVALID_TYPE', msg(lang, 'invalid_data'), lang);
      return;
    }
    const worker = await prisma.worker.create({
      data: {
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        phone: phone ? String(phone) : undefined,
        email: email ? String(email) : undefined,
        workerTypeId,
        salary: salaryVal,
        salaryCurrency: currencyOf(lang, salaryCurrency),
        hireDate: hireDate ? new Date(hireDate) : undefined,
      },
    });
    await prisma.auditLog.create({
      data: {
        userId: (req as any).userId,
        action: 'WORKER_CREATED',
        entityType: 'Worker',
        entityId: worker.id,
        description: `Worker created: ${worker.firstName} ${worker.lastName} (${type.code}) salary=${salaryVal}`,
        newValues: { firstName: worker.firstName, workerTypeId, salary: salaryVal },
        severity: 'INFO',
        category: 'OPERATION',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
    res.status(201).json({
      success: true,
      data: { id: worker.id, firstName: worker.firstName, lastName: worker.lastName, salary: Number(worker.salary) },
      meta: { language: lang, currency: 'USD', timestamp: new Date().toISOString() },
    });
  } catch (e) {
    logger.error('createWorker failed', { error: e });
    res.status(500).json({ success: false, error: { code: 'INTERNAL', message: msg(lang, 'internal') } });
  }
}

export async function updateWorker(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, email, workerTypeId, salary, salaryCurrency, hireDate, status, notes } = req.body || {};
    const existing = await prisma.worker.findUnique({ where: { id } });
    if (!existing) {
      notFound(res, 'NOT_FOUND', msg(lang, 'not_found'), lang);
      return;
    }
    const data: any = {};
    if (firstName !== undefined) data.firstName = String(firstName).trim();
    if (lastName !== undefined) data.lastName = String(lastName).trim();
    if (phone !== undefined) data.phone = phone ? String(phone) : null;
    if (email !== undefined) data.email = email ? String(email) : null;
    if (workerTypeId !== undefined) {
      const type = await prisma.workerType.findUnique({ where: { id: workerTypeId } });
      if (!type) {
        bad(res, 'INVALID_TYPE', msg(lang, 'invalid_data'), lang);
        return;
      }
      data.workerTypeId = workerTypeId;
    }
    if (salary !== undefined) {
      const salaryVal = toNumber(salary);
      if (salaryVal === null || salaryVal < 0) {
        bad(res, 'INVALID_SALARY', msg(lang, 'missing_salary'), lang);
        return;
      }
      data.salary = salaryVal;
    }
    if (salaryCurrency !== undefined && isCurrency(salaryCurrency)) data.salaryCurrency = salaryCurrency;
    if (hireDate !== undefined) data.hireDate = hireDate ? new Date(hireDate) : null;
    if (status !== undefined && ['ACTIVE', 'ON_LEAVE', 'TERMINATED'].includes(status)) data.status = status;
    if (notes !== undefined) data.notes = notes || null;
    const updated = await prisma.worker.update({ where: { id }, data });
    await prisma.auditLog.create({
      data: {
        userId: (req as any).userId,
        action: 'WORKER_UPDATED',
        entityType: 'Worker',
        entityId: id,
        description: `Worker updated: ${updated.firstName} ${updated.lastName}`,
        newValues: data,
        severity: 'INFO',
        category: 'OPERATION',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
    res.json({
      success: true,
      data: { id: updated.id, salary: Number(updated.salary), status: updated.status },
      meta: { language: lang, currency: 'USD', timestamp: new Date().toISOString() },
    });
  } catch (e) {
    logger.error('updateWorker failed', { error: e });
    res.status(500).json({ success: false, error: { code: 'INTERNAL', message: msg(lang, 'internal') } });
  }
}

export async function deleteWorker(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  try {
    const { id } = req.params;
    const existing = await prisma.worker.findUnique({ where: { id } });
    if (!existing) {
      notFound(res, 'NOT_FOUND', msg(lang, 'not_found'), lang);
      return;
    }
    await prisma.worker.update({ where: { id }, data: { status: 'TERMINATED' } });
    await prisma.auditLog.create({
      data: {
        userId: (req as any).userId,
        action: 'WORKER_TERMINATED',
        entityType: 'Worker',
        entityId: id,
        description: `Worker terminated: ${existing.firstName} ${existing.lastName}`,
        severity: 'INFO',
        category: 'OPERATION',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
    res.json({ success: true, data: { id, status: 'TERMINATED' }, meta: { language: lang, currency: 'USD', timestamp: new Date().toISOString() } });
  } catch (e) {
    logger.error('deleteWorker failed', { error: e });
    res.status(500).json({ success: false, error: { code: 'INTERNAL', message: msg(lang, 'internal') } });
  }
}

// ============================================================================
// الرواتب — Payroll
// ============================================================================

export async function getPayroll(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  try {
    const { periodStart, periodEnd, status } = req.query;
    const where: any = {};
    if (periodStart || periodEnd) {
      where.periodStart = {};
      if (periodStart) where.periodStart.gte = new Date(String(periodStart));
      if (periodEnd) where.periodEnd = new Date(String(periodEnd));
    }
    if (status) where.status = status;
    const payments = await prisma.salaryPayment.findMany({
      where,
      include: { worker: { include: { workerType: true } } },
      orderBy: [{ periodEnd: 'desc' }, { createdAt: 'desc' }],
      take: 500,
    });
    const totals = {
      count: payments.length,
      total: payments.reduce((s, p) => s + Number(p.amount), 0),
      totalPending: payments.filter((p) => p.status === 'PENDING').reduce((s, p) => s + Number(p.amount), 0),
      totalPaid: payments.filter((p) => p.status === 'PAID').reduce((s, p) => s + Number(p.amount), 0),
    };
    res.json({
      success: true,
      data: {
        payments: payments.map((p) => ({
          id: p.id,
          worker: {
            id: p.worker.id,
            name: `${p.worker.firstName} ${p.worker.lastName}`,
            workerType: p.worker.workerType.code,
          },
          amount: Number(p.amount),
          currency: p.currency,
          periodStart: p.periodStart,
          periodEnd: p.periodEnd,
          status: p.status,
          method: p.method,
          paidAt: p.paidAt,
        })),
        totals,
      },
      meta: { language: lang, currency: 'USD', timestamp: new Date().toISOString() },
    });
  } catch (e) {
    logger.error('getPayroll failed', { error: e });
    res.status(500).json({ success: false, error: { code: 'INTERNAL', message: msg(lang, 'internal') } });
  }
}

export async function runPayroll(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  try {
    const { periodStart, periodEnd } = req.body || {};
    if (!periodStart || !periodEnd) {
      bad(res, 'INVALID_PERIOD', msg(lang, 'invalid_data'), lang);
      return;
    }
    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    const workers = await prisma.worker.findMany({
      where: { status: 'ACTIVE' },
      include: { workerType: true },
    });
    let created = 0;
    let skipped = 0;
    for (const w of workers) {
      const dup = await prisma.salaryPayment.findFirst({
        where: { workerId: w.id, periodStart: start, periodEnd: end, status: { in: ['PENDING', 'PAID'] } },
      });
      if (dup) { skipped++; continue; }
      await prisma.salaryPayment.create({
        data: {
          workerId: w.id,
          amount: Number(w.salary),
          currency: w.salaryCurrency,
          periodStart: start,
          periodEnd: end,
        },
      });
      created++;
    }
    await prisma.auditLog.create({
      data: {
        userId: (req as any).userId,
        action: 'PAYROLL_RUN_CREATED',
        entityType: 'SalaryPayment',
        description: `Payroll run created: ${created} payments (${workers.length} active workers), skipped ${skipped}`,
        newValues: { periodStart: start.toISOString(), periodEnd: end.toISOString(), created, skipped },
        severity: 'INFO',
        category: 'OPERATION',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
    res.status(201).json({
      success: true,
      data: { created, skipped, activeWorkers: workers.length },
      meta: { language: lang, currency: 'USD', timestamp: new Date().toISOString() },
    });
  } catch (e) {
    logger.error('runPayroll failed', { error: e });
    res.status(500).json({ success: false, error: { code: 'INTERNAL', message: msg(lang, 'internal') } });
  }
}

export async function paySalary(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  try {
    const { id } = req.params;
    const { method } = req.body || {};
    const payment = await prisma.salaryPayment.findUnique({ where: { id }, include: { worker: true } });
    if (!payment) {
      notFound(res, 'NOT_FOUND', msg(lang, 'not_found'), lang);
      return;
    }
    if (payment.status === 'PAID') {
      bad(res, 'ALREADY_PAID', msg(lang, 'invalid_data'), lang);
      return;
    }
    const paid = await prisma.salaryPayment.update({
      where: { id },
      data: { status: 'PAID', paidBy: (req as any).userId, paidAt: new Date(), method: method || 'CASH' },
    });
    await prisma.auditLog.create({
      data: {
        userId: (req as any).userId,
        action: 'SALARY_PAID',
        entityType: 'SalaryPayment',
        entityId: id,
        description: `Salary paid to ${payment.worker.firstName} ${payment.worker.lastName}: ${paid.amount} ${paid.currency}`,
        newValues: { amount: Number(paid.amount), currency: paid.currency, method: paid.method },
        severity: 'INFO',
        category: 'OPERATION',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
    res.json({
      success: true,
      data: { id: paid.id, status: 'PAID', amount: Number(paid.amount), paidAt: paid.paidAt },
      meta: { language: lang, currency: 'USD', timestamp: new Date().toISOString() },
    });
  } catch (e) {
    logger.error('paySalary failed', { error: e });
    res.status(500).json({ success: false, error: { code: 'INTERNAL', message: msg(lang, 'internal') } });
  }
}

export async function cancelSalary(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  try {
    const { id } = req.params;
    const payment = await prisma.salaryPayment.findUnique({ where: { id }, include: { worker: true } });
    if (!payment) {
      notFound(res, 'NOT_FOUND', msg(lang, 'not_found'), lang);
      return;
    }
    const cancelled = await prisma.salaryPayment.update({ where: { id }, data: { status: 'CANCELLED' } });
    await prisma.auditLog.create({
      data: {
        userId: (req as any).userId,
        action: 'SALARY_CANCELLED',
        entityType: 'SalaryPayment',
        entityId: id,
        description: `Salary cancelled for ${payment.worker.firstName} ${payment.worker.lastName}`,
        severity: 'WARNING',
        category: 'OPERATION',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
    res.json({
      success: true,
      data: { id: cancelled.id, status: 'CANCELLED' },
      meta: { language: lang, currency: 'USD', timestamp: new Date().toISOString() },
    });
  } catch (e) {
    logger.error('cancelSalary failed', { error: e });
    res.status(500).json({ success: false, error: { code: 'INTERNAL', message: msg(lang, 'internal') } });
  }
}

// ============================================================================
// الملخص المالي للعمال — يعتمد عليه نظام المالية الديناميكي
// ============================================================================

export async function getPayrollOverview(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const activeWorkers = await prisma.worker.count({ where: { status: 'ACTIVE' } });
    const monthlyGross = await prisma.worker.aggregate({
      where: { status: 'ACTIVE' },
      _sum: { salary: true },
    });
    const paidThisMonth = await prisma.salaryPayment.aggregate({
      where: { status: 'PAID', paidAt: { gte: monthStart, lt: nextMonth } },
      _sum: { amount: true },
      _count: true,
    });
    const outstanding = await prisma.salaryPayment.aggregate({
      where: { status: 'PENDING' },
      _sum: { amount: true },
      _count: true,
    });

    res.json({
      success: true,
      data: {
        payroll: {
          activeWorkers,
          monthlyGrossPayroll: monthlyGross._sum.salary ? Number(monthlyGross._sum.salary) : 0,
          paidThisMonth: paidThisMonth._sum.amount ? Number(paidThisMonth._sum.amount) : 0,
          paidThisMonthCount: paidThisMonth._count,
          outstandingTotal: outstanding._sum.amount ? Number(outstanding._sum.amount) : 0,
          outstandingCount: outstanding._count,
        },
      },
      meta: { language: lang, currency: 'USD', timestamp: new Date().toISOString() },
    });
  } catch (e) {
    logger.error('getPayrollOverview failed', { error: e });
    res.status(500).json({ success: false, error: { code: 'INTERNAL', message: msg(lang, 'internal') } });
  }
}

// استخراج نوع العامل باللغة المطلوبة (يُستخدم في النطاق الأمامي)
export function workerTypeName(t: any, lang: Lang): string {
  return pickName(t, lang);
}