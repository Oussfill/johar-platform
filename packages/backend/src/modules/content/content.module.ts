import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  Article,
  NewsletterSubscriber,
  BuyerProgramRegistration,
  ContactMessage,
} from "./content.entity";
import { ContentService } from "./content.service";
import { ContentController } from "./content.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Article,
      NewsletterSubscriber,
      BuyerProgramRegistration,
      ContactMessage,
    ]),
  ],
  controllers: [ContentController],
  providers: [ContentService],
})
export class ContentModule {}