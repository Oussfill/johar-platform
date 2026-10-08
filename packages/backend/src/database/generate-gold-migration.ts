import { DataSource } from "typeorm";
import * as path from "path";
import * as fs from "fs";
import { config } from "dotenv";
import { User } from "../modules/users/user.entity";
import { PasswordReset, EmailVerification, MfaDevice, OtpCode } from "../modules/auth/auth-entities";
import { Session } from "../modules/auth/session.entity";
import { Organization } from "../modules/organizations/organization.entity";
import { OrganizationMember } from "../modules/organizations/organization-member.entity";
import { Role } from "../modules/rbac/role.entity";
import { Permission } from "../modules/rbac/permission.entity";
import { UserRole } from "../modules/rbac/user-role.entity";
import { Asset, AssetEvent, DigitalPassport } from "../modules/assets/asset.entity";
import { KycProfile, KycDocument, ComplianceCheck } from "../modules/kyc/kyc.entity";
import { Listing, Offer, Negotiation, Transaction } from "../modules/marketplace/marketplace.entity";
import { Invoice, Payment, LedgerEntry } from "../modules/finance/finance.entity";
import { Laboratory, AssayRequest, AssayResult } from "../modules/labs/lab.entity";
import { Warehouse, Shipment, CustodyEvent } from "../modules/logistics/logistics.entity";
import { AuditLog, Notification } from "../modules/audit/audit.entity";
import { BlockchainEvent } from "../modules/blockchain/blockchain.entity";
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
} from "../modules/erp/erp.entity";
import { WorkerType, Worker, AttendanceRecord, SalaryPayment } from "../modules/hr/hr.entity";
import { CustodyVault, CustodyTransferRequest } from "../modules/custody/custody.entity";
import {
  Article,
  NewsletterSubscriber,
  BuyerProgramRegistration,
  ContactMessage,
} from "../modules/content/content.entity";
import { TrustVerification } from "../modules/trust/trust.entity";

const entities = [
  User,
  PasswordReset,
  EmailVerification,
  MfaDevice,
  OtpCode,
  Session,
  Organization,
  OrganizationMember,
  Role,
  Permission,
  UserRole,
  Asset,
  AssetEvent,
  DigitalPassport,
  KycProfile,
  KycDocument,
  ComplianceCheck,
  Listing,
  Offer,
  Negotiation,
  Transaction,
  Invoice,
  Payment,
  LedgerEntry,
  Laboratory,
  AssayRequest,
  AssayResult,
  Warehouse,
  Shipment,
  CustodyEvent,
  AuditLog,
  Notification,
  BlockchainEvent,
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
  WorkerType,
  Worker,
  AttendanceRecord,
  SalaryPayment,
  CustodyVault,
  CustodyTransferRequest,
  Article,
  NewsletterSubscriber,
  BuyerProgramRegistration,
  ContactMessage,
  TrustVerification,
];

const NEW_TABLES = [
  "erp_suppliers",
  "crm_customers",
  "crm_interactions",
  "crm_opportunities",
  "purchase_requests",
  "rfqs",
  "rfq_offers",
  "purchase_orders",
  "goods_receipts",
  "sales_orders",
  "sales_invoices",
  "worker_types",
  "workers",
  "attendance_records",
  "salary_payments",
  "custody_vaults",
  "custody_transfer_requests",
  "content_articles",
  "newsletter_subscribers",
  "buyer_program_registrations",
  "contact_messages",
  "trust_verifications",
];

config();

const TARGET_DIR = path.join(__dirname, "migrations");
const TIMESTAMP = "1787900000000";
const NAME = `GoldPort${TIMESTAMP}`;

async function generate() {
  const ds = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    entities,
    synchronize: false,
    migrations: [path.join(__dirname, "migrations", "*-*.ts")],
  });
  await ds.initialize();

  const schemaBuilder = ds.driver.createSchemaBuilder();
  const log = await schemaBuilder.log();
  const { upQueries, downQueries } = log as any;

  const isNew = (query: string) =>
    NEW_TABLES.some((t) => query.includes(`"${t}"`) || query.includes(t));

  const up = upQueries.map((q: any) => q.query).filter(isNew);
  const down = downQueries.map((q: any) => q.query).filter(isNew);

  console.log(`Total up queries: ${upQueries.length}, new-table up queries: ${up.length}`);
  console.log(`Total down queries: ${downQueries.length}, new-table down queries: ${down.length}`);

  if (up.length === 0) {
    console.log("No new-table diff detected; nothing written.");
    await ds.destroy();
    return;
  }

  const body = [
    `import { MigrationInterface, QueryRunner } from "typeorm";`,
    ``,
    `export class ${NAME} implements MigrationInterface {`,
    `  name = "${NAME}";`,
    ``,
    `  async up(queryRunner: QueryRunner): Promise<void> {`,
    ...up.map((q: string) => `    await queryRunner.query(\`${q}\`);`),
    `  }`,
    ``,
    `  async down(queryRunner: QueryRunner): Promise<void> {`,
    ...down.map((q: string) => `    await queryRunner.query(\`${q}\`);`),
    `  }`,
    `}`,
    ``,
  ].join("\n");

  const file = path.join(TARGET_DIR, `${TIMESTAMP}-GoldPort.ts`);
  fs.writeFileSync(file, body, "utf8");
  console.log(`Wrote ${file}`);
  await ds.destroy();
}

generate().catch((err) => {
  console.error("Generation failed:", err);
  process.exit(1);
});