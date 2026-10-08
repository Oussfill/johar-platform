import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Listing, Offer, Negotiation, Transaction } from "./marketplace.entity";
import { Asset } from "../assets/asset.entity";
import { MarketplaceService } from "./marketplace.service";
import { MarketplaceController } from "./marketplace.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Listing, Offer, Negotiation, Transaction, Asset])],
  providers: [MarketplaceService],
  controllers: [MarketplaceController],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
