import { Request, Response } from 'express';
import { Language, Currency, SecurityLevel } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { isValidUuid } from '../utils/guards';

export async function listVaults(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    const { securityLevel, warehouseId, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { isActive: true };
    if (securityLevel) where.securityGrade = securityLevel;
    if (warehouseId) where.warehouseId = warehouseId;

    const [vaults, total] = await Promise.all([
      prisma.custodyVault.findMany({
        where,
        include: {
          warehouse: {
            select: {
              warehouseCode: true,
              name: true,
              nameAr: true,
              nameFr: true,
              location: true,
              securityLevel: true,
            },
          },
          inventories: {
            select: { id: true, custodyStatus: true, currentValue: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.custodyVault.count({ where }),
    ]);

    const response = {
      success: true,
      data: {
        vaults: vaults.map((v) => {
          const occupancy = Number(v.capacityKg);
          const current = Number(v.currentOccupancyKg);
          const occupancyPercent = occupancy > 0 ? ((current / occupancy) * 100).toFixed(1) : '0';
          const loc = v.warehouse.location as any;
          return {
            vaultId: v.id,
            vaultCode: v.vaultCode,
            name: v.name,
            warehouse: {
              code: v.warehouse.warehouseCode,
              name: lang === 'AR' ? v.warehouse.nameAr : lang === 'FR' ? v.warehouse.nameFr : v.warehouse.name,
              location: loc,
              securityLevel: v.warehouse.securityLevel,
            },
            securityGrade: v.securityGrade,
            capacityKg: v.capacityKg,
            currentOccupancyKg: v.currentOccupancyKg,
            occupancyPercent,
            temperatureControl: v.temperatureControl,
            humidityControl: v.humidityControl,
            fireSupression: v.fireSupression,
            cctvMonitoring: v.cctvMonitoring,
            accessControl: v.accessControl,
            assetCount: v.inventories.length,
            insuranceValue: v.insuranceValue,
            insuranceCurrency: v.insuranceCurrency,
            lastInspectionAt: v.lastInspectionAt,
            isActive: v.isActive,
          };
        }),
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          itemsPerPage: limitNum,
        },
      },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    };

    res.json(response);
  } catch (error) {
    logger.error('List vaults failed', { error });
    res.status(500).json({
      success: false,
      error: { code: 'VAULTS_FAILED', message: 'Failed to list vaults' },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}

export async function getVaultDetails(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    const { vault_id } = req.params;

    const where = isValidUuid(vault_id)
      ? { OR: [{ id: vault_id }, { vaultCode: vault_id }] }
      : { vaultCode: vault_id };

    const vault = await prisma.custodyVault.findFirst({
      where,
      include: {
        warehouse: {
          select: {
            warehouseCode: true,
            name: true,
            nameAr: true,
            nameFr: true,
            location: true,
            securityLevel: true,
          },
        },
        inventories: {
          include: {
            asset: {
              select: {
                id: true,
                goldId: true,
                serialNumber: true,
                metalType: true,
                karat: true,
                weightGross: true,
                weightNet: true,
                measuredPurity: true,
                status: true,
                productType: true,
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (!vault) {
      res.status(404).json({
        success: false,
        error: { code: 'VAULT_NOT_FOUND', message: 'Vault not found' },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    const occupancy = Number(vault.capacityKg);
    const current = Number(vault.currentOccupancyKg);
    const loc = vault.warehouse.location as any;

    const response = {
      success: true,
      data: {
        vaultId: vault.id,
        vaultCode: vault.vaultCode,
        name: vault.name,
        warehouse: {
          code: vault.warehouse.warehouseCode,
          name: lang === 'AR' ? vault.warehouse.nameAr : lang === 'FR' ? vault.warehouse.nameFr : vault.warehouse.name,
          location: loc,
          securityLevel: vault.warehouse.securityLevel,
        },
        securityGrade: vault.securityGrade,
        capacityKg: vault.capacityKg,
        currentOccupancyKg: vault.currentOccupancyKg,
        occupancyPercent: occupancy > 0 ? ((current / occupancy) * 100).toFixed(1) : '0',
        climateControl: {
          temperature: vault.temperatureControl,
          humidity: vault.humidityControl,
          fireSupression: vault.fireSupression,
        },
        monitoring: {
          cctv: vault.cctvMonitoring,
          accessControl: vault.accessControl,
        },
        insurance: {
          value: vault.insuranceValue,
          currency: vault.insuranceCurrency,
        },
        lastInspectionAt: vault.lastInspectionAt,
        assets: vault.inventories.map((inv) => ({
          inventoryId: inv.id,
          custodyStatus: inv.custodyStatus,
          compartmentRef: inv.compartmentRef,
          currentValue: inv.currentValue,
          goldId: inv.asset.goldId,
          serialNumber: inv.asset.serialNumber,
          metalType: inv.asset.metalType,
          karat: inv.asset.karat,
          weightNet: inv.asset.weightNet,
          measuredPurity: inv.asset.measuredPurity,
          productType: inv.asset.productType,
          assetStatus: inv.asset.status,
        })),
      },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    };

    res.json(response);
  } catch (error) {
    logger.error('Get vault details failed', { error });
    res.status(500).json({
      success: false,
      error: { code: 'VAULT_DETAILS_FAILED', message: 'Failed to get vault details' },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}

export async function listWarehouses(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    const warehouses = await prisma.warehouse.findMany({
      where: { isActive: true },
      include: {
        custodyVaults: {
          select: { id: true, capacityKg: true, currentOccupancyKg: true, isActive: true },
        },
        inventories: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const response = {
      success: true,
      data: {
        warehouses: warehouses.map((w) => {
          const loc = w.location as any;
          const totalCapacity = w.custodyVaults.reduce((sum, v) => sum + Number(v.capacityKg), 0);
          const totalOccupancy = w.custodyVaults.reduce((sum, v) => sum + Number(v.currentOccupancyKg), 0);
          return {
            warehouseId: w.id,
            warehouseCode: w.warehouseCode,
            name: lang === 'AR' ? w.nameAr : lang === 'FR' ? w.nameFr : w.name,
            location: loc,
            facilityType: w.facilityType,
            securityLevel: w.securityLevel,
            vaultCount: w.custodyVaults.filter((v) => v.isActive).length,
            totalCapacityKg: totalCapacity,
            currentOccupancyKg: totalOccupancy,
            assetCount: w.inventories.length,
          };
        }),
      },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    };

    res.json(response);
  } catch (error) {
    logger.error('List warehouses failed', { error });
    res.status(500).json({
      success: false,
      error: { code: 'WAREHOUSES_FAILED', message: 'Failed to list warehouses' },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}
