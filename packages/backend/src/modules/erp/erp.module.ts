import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  ErpSupplier,
  CrmCustomer,
  CrmInteraction,
  CrmOpportunity,
  PurchaseRequest,
  Rfq,
  RfqOffer,
  PurchaseOrder,
  GoodsReceipt,
  SalesOrder,
  SalesInvoice,
} from "./erp.entity";
import { ErpService } from "./erp.service";
import { ErpController } from "./erp.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ErpSupplier,
      CrmCustomer,
      CrmInteraction,
      CrmOpportunity,
      PurchaseRequest,
      Rfq,
      RfqOffer,
      PurchaseOrder,
      GoodsReceipt,
      SalesOrder,
      SalesInvoice,
    ]),
  ],
  controllers: [ErpController],
  providers: [ErpService],
})
export class ErpModule {}