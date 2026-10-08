import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Warehouse, Shipment, CustodyEvent } from "./logistics.entity";
import { Asset } from "../assets/asset.entity";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class LogisticsService {
  constructor(
    @InjectRepository(Warehouse) private warehouseRepo: Repository<Warehouse>,
    @InjectRepository(Shipment) private shipmentRepo: Repository<Shipment>,
    @InjectRepository(CustodyEvent) private custodyRepo: Repository<CustodyEvent>,
    @InjectRepository(Asset) private assetRepo: Repository<Asset>
  ) {}

  private isGlobalAdmin(user: any): boolean {
    return user?.roles?.includes("SUPER_ADMIN") || user?.roles?.includes("PLATFORM_ADMIN");
  }

  private isLogisticsStaff(user: any): boolean {
    return user?.roles?.includes("LOGISTICS_MANAGER");
  }

  private async assertCanAccessAsset(assetId: string, user: any): Promise<void> {
    const asset = await this.assetRepo.findOne({ where: { id: assetId } });
    if (!asset) throw new NotFoundException("Asset not found");
    if (this.isGlobalAdmin(user) || this.isLogisticsStaff(user)) return;
    if (asset.ownerId === user?.id) return;
    if (asset.currentLocationId && asset.currentLocationId === user?.organizationId) return;
    throw new ForbiddenException("Access denied: you do not have access to this asset");
  }

  async createWarehouse(data: Partial<Warehouse>): Promise<Warehouse> {
    const wh = this.warehouseRepo.create(data);
    return this.warehouseRepo.save(wh);
  }

  async findAllWarehouses(user: any): Promise<Warehouse[]> {
    if (this.isGlobalAdmin(user) || this.isLogisticsStaff(user)) {
      return this.warehouseRepo.find();
    }
    if (!user?.organizationId) return [];
    return this.warehouseRepo.find({
      where: { organizationId: user.organizationId },
    });
  }

  async createShipment(data: Partial<Shipment>): Promise<Shipment> {
    const trackingNumber = `SHP-${new Date().getFullYear()}-${uuidv4().slice(0, 8).toUpperCase()}`;
    const shipment = this.shipmentRepo.create({ ...data, trackingNumber, status: "PREPARING" });
    return this.shipmentRepo.save(shipment);
  }

  private async loadShipment(id: string): Promise<Shipment> {
    const shipment = await this.shipmentRepo.findOne({
      where: { id },
      relations: ["originWarehouse", "destinationWarehouse"],
    });
    if (!shipment) throw new NotFoundException("Shipment not found");
    return shipment;
  }

  async getShipment(id: string, user: any): Promise<Shipment> {
    const shipment = await this.loadShipment(id);
    if (this.isGlobalAdmin(user) || this.isLogisticsStaff(user)) return shipment;

    const warehouseIds = [
      shipment.originWarehouseId,
      shipment.destinationWarehouseId,
    ].filter((wid): wid is string => !!wid);
    if (warehouseIds.length && user?.organizationId) {
      const warehouses = await this.warehouseRepo.find({
        where: { id: In(warehouseIds) },
      });
      if (
        warehouses.some(
          (wh) => wh.organizationId && wh.organizationId === user.organizationId
        )
      ) {
        return shipment;
      }
    }

    throw new ForbiddenException("Access denied: you do not have access to this shipment");
  }

  async updateShipmentStatus(id: string, status: string): Promise<Shipment> {
    const shipment = await this.loadShipment(id);
    shipment.status = status;
    if (status === "DELIVERED") shipment.actualArrival = new Date();
    return this.shipmentRepo.save(shipment);
  }

  async recordCustodyEvent(data: Partial<CustodyEvent>, user: any): Promise<CustodyEvent> {
    if (data.assetId) {
      await this.assertCanAccessAsset(data.assetId, user);
    } else if (!this.isGlobalAdmin(user) && !this.isLogisticsStaff(user)) {
      throw new ForbiddenException("Access denied");
    }
    const event = this.custodyRepo.create({
      ...data,
      authorizedById: data.authorizedById || user?.id,
    });
    return this.custodyRepo.save(event);
  }

  async getCustodyHistory(assetId: string, user: any): Promise<CustodyEvent[]> {
    await this.assertCanAccessAsset(assetId, user);
    return this.custodyRepo.find({
      where: { assetId },
      order: { createdAt: "ASC" },
    });
  }
}