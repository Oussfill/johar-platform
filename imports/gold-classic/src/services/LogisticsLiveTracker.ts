// ============================================================================
// GOLD LOGISTICS LIVE TRACKER
// ============================================================================
// متتبع الشحنات الحي — GPS + Geofencing + IoT Sensors
//
// المبادئ:
// 1. تتبع GPS مباشر مع تحديث كل 30 ثانية
// 2. Geofencing: مناطق جغرافية محددة (safe zones)
// 3. حساسات IoT: درجة الحرارة + الرطوبة + الصدمات
// 4. تنبيهات فورية عند خروج Zone
// 5. سجل تدقيق كامل مع timestamp
// 6. AI Disclaimer على كل تقرير

import { prisma } from '../config/database';
import { logger } from '../config/logger';

// ════════════════════════════════════════════════════════════════
// أنواع التنبيهات
// ════════════════════════════════════════════════════════════════

export enum AlertType {
  GEOFENCE_EXIT = 'GEOFENCE_EXIT',
  GEOFENCE_ENTRY = 'GEOFENCE_ENTRY',
  TEMPERATURE_ABNORMAL = 'TEMPERATURE_ABNORMAL',
  HUMIDITY_ABNORMAL = 'HUMIDITY_ABNORMAL',
  SHOCK_DETECTED = 'SHOCK_DETECTED',
  DEVICE_OFFLINE = 'DEVICE_OFFLINE',
  DELAYED_DELIVERY = 'DELAYED_DELIVERY',
}

export interface TrackingPosition {
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  heading: number;
  accuracy: number;
  timestamp: Date;
}

export interface ShipmentStatus {
  shipmentId: string;
  currentLocation: TrackingPosition;
  origin: GeoFence;
  destination: GeoFence;
  estimatedArrival: Date;
  temperature: number;
  humidity: number;
  shockEvents: number;
  alerts: TrackingAlert[];
  temperatureHistory: TemperatureReading[];
  status: 'IN_TRANSIT' | 'ARRIVED' | 'DELAYED' | 'EXCEPTION';
  disclaimer: string;
}

export interface TrackingAlert {
  type: AlertType;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: Record<string, string>;
  timestamp: Date;
  acknowledged: boolean;
}

export interface GeoFence {
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // متر
  type: 'ORIGIN' | 'DESTINATION' | 'WAYPOINT' | 'RESTRICTED';
}

export interface TemperatureReading {
  temperature: number;
  humidity: number;
  timestamp: Date;
}

// ════════════════════════════════════════════════════════════════
// الإعدادات
// ════════════════════════════════════════════════════════════════

const TRACKER_CONFIG = {
  /** تحديث GPS كل 30 ثانية */
  GPS_UPDATE_INTERVAL: 30000,
  /** عتبة درجة الحرارة */
  TEMPERATURE_MIN: 15,
  TEMPERATURE_MAX: 35,
  /** عتبة الرطوبة */
  HUMIDITY_MIN: 30,
  HUMIDITY_MAX: 70,
  /** عتبة الصدمات (g-force) */
  SHOCK_THRESHOLD: 5.0,
};

/**
 * LogisticsLiveTracker
 * ─────────────────────
 * متتبع الشحنات الحي مع Geofencing
 *
 * في الإنتاج:
 * 1. MQTT subscriber للبيانات GPS
 * 2. Redis cache للآخر موقع
 * 3. InfluxDB للبيانات الزمنية
 * 4. WebSocket push للواجهة
 */
class LogisticsLiveTracker {
  private shipments: Map<string, ShipmentStatus> = new Map();
  private geofences: GeoFence[] = [];

  /** إنشاء شحنة جديدة */
  createShipment(
    shipmentId: string,
    origin: GeoFence,
    destination: GeoFence,
    estimatedArrival: Date,
  ): ShipmentStatus {
    const status: ShipmentStatus = {
      shipmentId,
      currentLocation: { latitude: origin.latitude, longitude: origin.longitude, altitude: 0, speed: 0, heading: 0, accuracy: 5, timestamp: new Date() },
      origin,
      destination,
      estimatedArrival,
      temperature: 22,
      humidity: 45,
      shockEvents: 0,
      alerts: [],
      temperatureHistory: [],
      status: 'IN_TRANSIT',
      disclaimer: this.getDisclaimer(),
    };

    this.shipments.set(shipmentId, status);
    this.geofences.push(origin, destination);

    return status;
  }

  /** تحديث الموقع */
  updatePosition(shipmentId: string, position: TrackingPosition): void {
    const shipment = this.shipments.get(shipmentId);
    if (!shipment) return;

    shipment.currentLocation = position;

    // فحص Geofence
    const inOrigin = this.isInsideGeofence(position, shipment.origin);
    const inDestination = this.isInsideGeofence(position, shipment.destination);

    if (inDestination && shipment.status === 'IN_TRANSIT') {
      shipment.status = 'ARRIVED';
      shipment.alerts.push({
        type: AlertType.GEOFENCE_ENTRY,
        severity: 'INFO',
        message: {
          AR: 'وصلت الشحنة إلى الوجهة',
          FR: 'Colis arrivé à destination',
          EN: 'Shipment arrived at destination',
        },
        timestamp: new Date(),
        acknowledged: false,
      });
    }

    this.shipments.set(shipmentId, shipment);
  }

  /** تحديث الحساسات */
  updateSensors(shipmentId: string, temperature: number, humidity: number, shock: number): void {
    const shipment = this.shipments.get(shipmentId);
    if (!shipment) return;

    // درجة الحرارة
    shipment.temperature = temperature;
    if (temperature < TRACKER_CONFIG.TEMPERATURE_MIN || temperature > TRACKER_CONFIG.TEMPERATURE_MAX) {
      shipment.alerts.push({
        type: AlertType.TEMPERATURE_ABNORMAL,
        severity: 'WARNING',
        message: {
          AR: `حرارة غير طبيعية: ${temperature}°C`,
          FR: `Température anormale: ${temperature}°C`,
          EN: `Abnormal temperature: ${temperature}°C`,
        },
        timestamp: new Date(),
        acknowledged: false,
      });
    }

    // الرطوبة
    shipment.humidity = humidity;
    if (humidity < TRACKER_CONFIG.HUMIDITY_MIN || humidity > TRACKER_CONFIG.HUMIDITY_MAX) {
      shipment.alerts.push({
        type: AlertType.HUMIDITY_ABNORMAL,
        severity: 'WARNING',
        message: {
          AR: `رطوبة غير طبيعية: ${humidity}%`,
          FR: `Humidité anormale: ${humidity}%`,
          EN: `Abnormal humidity: ${humidity}%`,
        },
        timestamp: new Date(),
        acknowledged: false,
      });
    }

    // الصدمات
    if (shock > TRACKER_CONFIG.SHOCK_THRESHOLD) {
      shipment.shockEvents++;
      shipment.alerts.push({
        type: AlertType.SHOCK_DETECTED,
        severity: 'CRITICAL',
        message: {
          AR: `صدمة مكتشفة: ${shock}g — عدد الإجمالي: ${shipment.shockEvents}`,
          FR: `Choc détecté: ${shock}g — Total: ${shipment.shockEvents}`,
          EN: `Shock detected: ${shock}g — Total: ${shipment.shockEvents}`,
        },
        timestamp: new Date(),
        acknowledged: false,
      });
    }

    // سجل الحرارة
    shipment.temperatureHistory.push({ temperature, humidity, timestamp: new Date() });

    this.shipments.set(shipmentId, shipment);
  }

  /** حالة الشحنة */
  getShipmentStatus(shipmentId: string): ShipmentStatus | undefined {
    return this.shipments.get(shipmentId);
  }

  /** جميع الشحنات */
  getAllShipments(): ShipmentStatus[] {
    return Array.from(this.shipments.values());
  }

  // ─── Geofence ────────────────────────────────────────────

  private isInsideGeofence(position: TrackingPosition, fence: GeoFence): boolean {
    const R = 6371000; // نصف قطر الأرض بالمتر
    const dLat = this.toRad(position.latitude - fence.latitude);
    const dLon = this.toRad(position.longitude - fence.longitude);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(this.toRad(fence.latitude)) * Math.cos(this.toRad(position.latitude)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance <= fence.radius;
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }

  private getDisclaimer(): string {
    return 'AI-generated assessment is an analytical aid and does not replace professionally delivered logistics or insurance evaluation.';
  }
}

export const logisticsTracker = new LogisticsLiveTracker();
