import { Request, Response } from 'express';
import { logisticsTracker } from '../services/LogisticsLiveTracker';
import { logger } from '../config/logger';

// قائمة جميع الشحنات
export const getShipments = async (_req: Request, res: Response): Promise<void> => {
  try {
    const lang = (_req.query.lang as string) || 'en';
    const currency = (_req.query.currency as string) || 'USD';

    const shipments = logisticsTracker.getAllShipments().map((s) => ({
      id: s.shipmentId,
      status: s.status,
      origin: {
        latitude: s.origin.latitude,
        longitude: s.origin.longitude,
      },
      destination: {
        latitude: s.destination.latitude,
        longitude: s.destination.longitude,
      },
      estimatedArrival: s.estimatedArrival,
      lastUpdate: s.currentLocation.timestamp,
      gpsLatitude: s.currentLocation.latitude,
      gpsLongitude: s.currentLocation.longitude,
      temperature: s.temperature,
      humidity: s.humidity,
      shockEvents: s.shockEvents,
      alerts: s.alerts,
      disclaimer: s.disclaimer,
    }));

    logger.info(`تم جلب الشحنات اللوجستية: ${shipments.length} شحنة`);

    res.json({
      success: true,
      data: { shipments },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('خطأ في جلب الشحنات اللوجستية:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL',
        message: 'Failed to fetch logistics shipments',
      },
    });
  }
};

// حالة شحنة محددة
export const getShipmentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const lang = (req.query.lang as string) || 'en';
    const currency = (req.query.currency as string) || 'USD';
    const shipmentId = req.params.id;

    const shipment = logisticsTracker.getShipmentStatus(shipmentId);

    if (!shipment) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Shipment ${shipmentId} not found` },
      });
      return;
    }

    res.json({
      success: true,
      data: { shipment },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('خطأ في جلب حالة الشحنة:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL',
        message: 'Failed to fetch shipment status',
      },
    });
  }
};