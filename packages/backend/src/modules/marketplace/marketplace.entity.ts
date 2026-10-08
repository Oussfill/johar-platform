import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Asset } from "../assets/asset.entity";
import { User } from "../users/user.entity";

@Entity("listings")
export class Listing {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  assetId: string;

  @Column()
  sellerId: string;

  @Column()
  price: number;

  @Column({ default: "USD" })
  currency: string;

  @Column({ default: "FIXED" })
  listingType: string;

  @Column({ default: "ACTIVE" })
  status: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  expiresAt: Date;

  @ManyToOne(() => Asset)
  @JoinColumn({ name: "assetId" })
  asset: Asset;

  @ManyToOne(() => User)
  @JoinColumn({ name: "sellerId" })
  seller: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity("offers")
export class Offer {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  listingId: string;

  @Column()
  buyerId: string;

  @Column()
  amount: number;

  @Column({ default: "USD" })
  currency: string;

  @Column({ default: "PENDING" })
  status: string;

  @Column({ nullable: true })
  message: string;

  @Column({ nullable: true })
  expiresAt: Date;

  @ManyToOne(() => Listing)
  @JoinColumn({ name: "listingId" })
  listing: Listing;

  @ManyToOne(() => User)
  @JoinColumn({ name: "buyerId" })
  buyer: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity("negotiations")
export class Negotiation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  offerId: string;

  @Column()
  round: number;

  @Column()
  actorId: string;

  @Column()
  price: number;

  @Column({ default: "USD" })
  currency: string;

  @Column({ nullable: true })
  message: string;

  @Column({ default: "PENDING" })
  status: string;

  @ManyToOne(() => Offer)
  @JoinColumn({ name: "offerId" })
  offer: Offer;

  @ManyToOne(() => User)
  @JoinColumn({ name: "actorId" })
  actor: User;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity("transactions")
export class Transaction {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  listingId: string;

  @Column()
  buyerId: string;

  @Column()
  sellerId: string;

  @Column()
  assetId: string;

  @Column()
  amount: number;

  @Column({ default: "USD" })
  currency: string;

  @Column({ default: "INITIATED" })
  status: string;

  @Column({ nullable: true })
  offerId: string;

  @ManyToOne(() => Listing)
  @JoinColumn({ name: "listingId" })
  listing: Listing;

  @ManyToOne(() => User)
  @JoinColumn({ name: "buyerId" })
  buyer: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: "sellerId" })
  seller: User;

  @ManyToOne(() => Asset)
  @JoinColumn({ name: "assetId" })
  asset: Asset;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
