// ============================================================================
// GOLD PLATFORM — HR & LABOR MANAGEMENT CONTROLLER
// ============================================================================
// Controller لإدارة الموارد البشرية والحضور وال咙ات في منصة GOLD
// يتضمن: قائمة الموظفين، سجلات الحضور، طلبات الاعتماد، أداء الموظفين

import { Request, Response } from 'express';
import { Language, Currency } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { isValidUuid } from '../utils/guards';

// ============================================================================
// GET /api/v1/hr/employees — جلب قائمة الموظفين مع البحث والتصفية
// ============================================================================

export async function getEmployees(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const search = (req.query.search as string) || '';
    const roleFilter = (req.query.role as string) || '';
    const skip = (page - 1) * limit;

    // بناء شروط البحث — البحث بالاسم أو البريد الإلكتروني
    const where: any = { isActive: true };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (roleFilter) {
      where.role = { roleCode: roleFilter };
    }

    const [employees, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          role: {
            select: {
              id: true,
              roleCode: true,
              nameEn: true,
              nameAr: true,
              nameFr: true,
              hierarchy: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    const response: any = {
      success: true,
      data: {
        employees: employees.map((emp) => ({
          id: emp.id,
          email: emp.email,
          firstName: emp.firstName,
          lastName: emp.lastName,
          phone: emp.phone,
          role: emp.role,
          preferredLanguage: emp.preferredLanguage,
          preferredCurrency: emp.preferredCurrency,
          mfaEnabled: emp.mfaEnabled,
          isActive: emp.isActive,
          lastLoginAt: emp.lastLoginAt,
          createdAt: emp.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Failed to fetch employees', { error });

    const errorMsg =
      lang === 'AR'
        ? 'فشل في جلب قائمة الموظفين'
        : lang === 'FR'
        ? 'Échec de la récupération de la liste des employés'
        : 'Failed to fetch employees list';

    res.status(500).json({
      success: false,
      error: { code: 'FETCH_EMPLOYEES_FAILED', message: errorMsg },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}

// ============================================================================
// GET /api/v1/hr/employees/:id — جلب موظف واحد بالتفاصيل الكاملة
// ============================================================================

export async function getEmployee(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    const { id } = req.params;

    if (!isValidUuid(id)) {
      res.status(404).json({
        success: false,
        error: { code: 'EMPLOYEE_NOT_FOUND', message: 'Employee not found' },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    const employee = await prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          select: {
            id: true,
            roleCode: true,
            nameEn: true,
            nameAr: true,
            nameFr: true,
            description: true,
            permissions: true,
            hierarchy: true,
          },
        },
        auditLogs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            action: true,
            entityType: true,
            entityId: true,
            description: true,
            createdAt: true,
          },
        },
        userVerifications: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            verificationType: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!employee) {
      const notFoundMsg =
        lang === 'AR'
          ? 'لم يتم العثور على الموظف'
          : lang === 'FR'
          ? 'Employé non trouvé'
          : 'Employee not found';

      res.status(404).json({
        success: false,
        error: { code: 'EMPLOYEE_NOT_FOUND', message: notFoundMsg },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    const response: any = {
      success: true,
      data: {
        id: employee.id,
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        phone: employee.phone,
        role: employee.role,
        preferredLanguage: employee.preferredLanguage,
        preferredCurrency: employee.preferredCurrency,
        mfaEnabled: employee.mfaEnabled,
        mfaVerifiedAt: employee.mfaVerifiedAt,
        lastLoginAt: employee.lastLoginAt,
        lastLoginIp: employee.lastLoginIp,
        isActive: employee.isActive,
        isEmailVerified: employee.isEmailVerified,
        kycStatus: employee.kycStatus,
        avatarUrl: employee.avatarUrl,
        recentActivity: employee.auditLogs,
        verifications: employee.userVerifications,
        createdAt: employee.createdAt,
        updatedAt: employee.updatedAt,
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Failed to fetch employee', { error });

    const errorMsg =
      lang === 'AR'
        ? 'فشل في جلب بيانات الموظف'
        : lang === 'FR'
        ? 'Échec de la récupération des données de l\'employé'
        : 'Failed to fetch employee data';

    res.status(500).json({
      success: false,
      error: { code: 'FETCH_EMPLOYEE_FAILED', message: errorMsg },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}

// ============================================================================
// GET /api/v1/hr/attendance — جلب سجلات الحضور والانصراف
// ============================================================================

export async function getAttendanceLogs(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const employeeId = (req.query.employeeId as string) || '';
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const skip = (page - 1) * limit;

    // بناء شروط البحث لسجلات الحضور
    const where: any = {};

    if (employeeId) {
      where.userId = employeeId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: {
          ...where,
          action: { in: ['CHECK_IN', 'CHECK_OUT'] },
          entityType: 'ATTENDANCE',
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({
        where: {
          ...where,
          action: { in: ['CHECK_IN', 'CHECK_OUT'] },
          entityType: 'ATTENDANCE',
        },
      }),
    ]);

    const response: any = {
      success: true,
      data: {
        attendanceLogs: logs.map((log) => ({
          id: log.id,
          employee: log.user,
          type: log.action,
          location: (log.newValues as any)?.location || null,
          notes: log.description,
          timestamp: log.createdAt,
          ipAddress: log.ipAddress,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Failed to fetch attendance logs', { error });

    const errorMsg =
      lang === 'AR'
        ? 'فشل في جلب سجلات الحضور'
        : lang === 'FR'
        ? 'Échec de la récupération des registres de présence'
        : 'Failed to fetch attendance logs';

    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ATTENDANCE_FAILED', message: errorMsg },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}

// ============================================================================
// GET /api/v1/hr/pending-approvals — الطلبات المعلقة للiting المزدوج
// ============================================================================

export async function getPendingApprovals(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    const userId = (req as any).userId;
    const userHierarchy = (req as any).hierarchy || 0;

    // جلب الطلبات التي تتطلب اعتماداً ثنائياً وليست مكتملة بعد
    const pendingRequests = await prisma.custodyTransferRequest.findMany({
      where: {
        OR: [
          { status: 'PENDING', requiresDualAuth: true, firstApproverId: null },
          { status: 'FIRST_APPROVED', requiresDualAuth: true },
        ],
        initiatedById: { not: userId },
      },
      include: {
        asset: {
          select: {
            goldId: true,
            serialNumber: true,
            metalType: true,
            weightGross: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const response: any = {
      success: true,
      data: {
        pendingApprovals: pendingRequests.map((request) => ({
          requestId: request.requestId,
          asset: (request as any).asset,
          status: request.status,
          estimatedValue: request.estimatedValue,
          valueCurrency: request.valueCurrency,
          priority: request.priority,
          reason: request.reason,
          initiatedById: request.initiatedById,
          createdAt: request.createdAt,
          // التحقق مما إذا كان المستخدم الحالي مؤهلاً للموافقة
          requiresMyApproval: userHierarchy >= 4,
        })),
        totalPending: pendingRequests.length,
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Failed to fetch pending approvals', { error });

    const errorMsg =
      lang === 'AR'
        ? 'فشل في جلب الطلبات المعلقة'
        : lang === 'FR'
        ? 'Échec de la récupération des approbations en attente'
        : 'Failed to fetch pending approvals';

    res.status(500).json({
      success: false,
      error: { code: 'FETCH_PENDING_APPROVALS_FAILED', message: errorMsg },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}

// ============================================================================
// GET /api/v1/hr/staff-performance — مقاييس أداء الموظفين
// ============================================================================

export async function getStaffPerformance(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    // جلب جميع الموظفين النشطين مع أدوارهم
    const employees = await prisma.user.findMany({
      where: { isActive: true },
      include: {
        role: {
          select: {
            roleCode: true,
            nameEn: true,
            nameAr: true,
          },
        },
      },
    });

    // حساب مقاييس الأداء لكل موظف
    const performanceMetrics = await Promise.all(
      employees.map(async (employee) => {
        // عدد الأصول التي تم معالجتها (via audit logs)
        const assetsProcessed = await prisma.auditLog.count({
          where: {
            userId: employee.id,
            entityType: 'GOLD_ASSET',
            action: { in: ['CREATE', 'UPDATE', 'STATUS_CHANGE'] },
          },
        });

        // عدد الفحوصات المختبرية المكتملة
        const assaysCompleted = await prisma.auditLog.count({
          where: {
            userId: employee.id,
            entityType: 'ASSAY_RECORD',
            action: 'CREATE',
          },
        });

        // عدد عمليات النقل والحيزة
        const transfersHandled = await prisma.auditLog.count({
          where: {
            userId: employee.id,
            entityType: { in: ['CHAIN_OF_CUSTODY', 'CUSTODY_TRANSFER_REQUEST'] },
            action: { in: ['CREATE', 'UPDATE', 'APPROVAL'] },
          },
        });

        // عدد طلبات الاعتماد المقبولة
        const approvalsGranted = await prisma.auditLog.count({
          where: {
            userId: employee.id,
            entityType: 'CUSTODY_TRANSFER_REQUEST',
            action: 'APPROVAL',
          },
        });

        // آخر نشاط للموظف
        const lastActivity = await prisma.auditLog.findFirst({
          where: { userId: employee.id },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        });

        return {
          employeeId: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          role: employee.role,
          metrics: {
            assetsProcessed,
            assaysCompleted,
            transfersHandled,
            approvalsGranted,
          },
          lastActivityAt: lastActivity?.createdAt || null,
        };
      }),
    );

    const response: any = {
      success: true,
      data: {
        staffPerformance: performanceMetrics,
        summary: {
          totalEmployees: employees.length,
          totalAssetsProcessed: performanceMetrics.reduce(
            (sum, emp) => sum + emp.metrics.assetsProcessed,
            0,
          ),
          totalAssaysCompleted: performanceMetrics.reduce(
            (sum, emp) => sum + emp.metrics.assaysCompleted,
            0,
          ),
          totalTransfersHandled: performanceMetrics.reduce(
            (sum, emp) => sum + emp.metrics.transfersHandled,
            0,
          ),
        },
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Failed to fetch staff performance', { error });

    const errorMsg =
      lang === 'AR'
        ? 'فشل في جلب مقاييس أداء الموظفين'
        : lang === 'FR'
        ? 'Échec de la récupération des performances du personnel'
        : 'Failed to fetch staff performance metrics';

    res.status(500).json({
      success: false,
      error: { code: 'FETCH_PERFORMANCE_FAILED', message: errorMsg },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}

// ============================================================================
// POST /api/v1/hr/attendance — تسجيل حضور / انصراف
// ============================================================================

export async function recordAttendance(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    const { employeeId, type, location, notes } = req.body;
    const performedBy = (req as any).userId;

    // التحقق من صحة المدخلات
    if (!employeeId || !type) {
      const validationMsg =
        lang === 'AR'
          ? 'معرف الموظف ونوع العملية مطلوبان'
          : lang === 'FR'
          ? 'L\'identifiant de l\'employé et le type d\'opération sont requis'
          : 'Employee ID and type are required';

      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: validationMsg },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    if (!['CHECK_IN', 'CHECK_OUT'].includes(type)) {
      const invalidTypeMsg =
        lang === 'AR'
          ? 'نوع العملية غير صالح — يجب أن يكون CHECK_IN أو CHECK_OUT'
          : lang === 'FR'
          ? 'Type d\'opération invalide — doit être CHECK_IN ou CHECK_OUT'
          : 'Invalid type — must be CHECK_IN or CHECK_OUT';

      res.status(400).json({
        success: false,
        error: { code: 'INVALID_TYPE', message: invalidTypeMsg },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    // التحقق من وجود الموظف
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: { id: true, firstName: true, lastName: true, isActive: true },
    });

    if (!employee || !employee.isActive) {
      const notFoundMsg =
        lang === 'AR'
          ? 'لم يتم العثور على الموظف أو أنه غير نشط'
          : lang === 'FR'
          ? 'Employé non trouvé ou inactif'
          : 'Employee not found or inactive';

      res.status(404).json({
        success: false,
        error: { code: 'EMPLOYEE_NOT_FOUND', message: notFoundMsg },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    // تسجيل الحضور عبر سجل التدقيق
    const attendanceLog = await prisma.auditLog.create({
      data: {
        userId: employeeId,
        action: type,
        entityType: 'ATTENDANCE',
        entityId: employeeId,
        description: notes || `${type === 'CHECK_IN' ? 'تسجيل حضور' : 'تسجيل انصراف'}`,
        newValues: {
          location: location || null,
          type,
          recordedBy: performedBy,
        },
        severity: 'INFO',
        category: 'OPERATION',
      },
    });

    const responseMsg =
      lang === 'AR'
        ? type === 'CHECK_IN'
          ? 'تم تسجيل الحضور بنجاح'
          : 'تم تسجيل الانصراف بنجاح'
        : lang === 'FR'
        ? type === 'CHECK_IN'
          ? 'Présence enregistrée avec succès'
          : 'Sortie enregistrée avec succès'
        : type === 'CHECK_IN'
        ? 'Check-in recorded successfully'
        : 'Check-out recorded successfully';

    const response: any = {
      success: true,
      data: {
        logId: attendanceLog.id,
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        type,
        location: location || null,
        notes: notes || null,
        recordedBy: performedBy,
        timestamp: attendanceLog.createdAt,
      },
      message: responseMsg,
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    };

    res.status(201).json(response);
  } catch (error: any) {
    logger.error('Failed to record attendance', { error });

    const errorMsg =
      lang === 'AR'
        ? 'فشل في تسجيل الحضور'
        : lang === 'FR'
        ? 'Échec de l\'enregistrement de la présence'
        : 'Failed to record attendance';

    res.status(500).json({
      success: false,
      error: { code: 'RECORD_ATTENDANCE_FAILED', message: errorMsg },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}
