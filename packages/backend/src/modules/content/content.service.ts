import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsWhere } from "typeorm";
import {
  Article,
  NewsletterSubscriber,
  BuyerProgramRegistration,
  ContactMessage,
} from "./content.entity";

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Article) private articles: Repository<Article>,
    @InjectRepository(NewsletterSubscriber) private subscribers: Repository<NewsletterSubscriber>,
    @InjectRepository(BuyerProgramRegistration) private buyerProgram: Repository<BuyerProgramRegistration>,
    @InjectRepository(ContactMessage) private contacts: Repository<ContactMessage>
  ) {}

  // ---------- Public: articles ----------
  async findPublishedArticles(language?: string): Promise<Article[]> {
    const where: FindOptionsWhere<Article> = { isPublished: true };
    if (language) where.language = language;
    return this.articles.find({ where, order: { publishedAt: "DESC" } });
  }

  async findPublishedArticle(slug: string): Promise<Article> {
    const article = await this.articles.findOne({ where: { slug, isPublished: true } });
    if (!article) throw new NotFoundException("Article not found");
    return article;
  }

  // ---------- Public: newsletter ----------
  async subscribe(email: string): Promise<NewsletterSubscriber> {
    const existing = await this.subscribers.findOne({ where: { email } });
    if (existing) {
      if (existing.status === "UNSUBSCRIBED") {
        existing.status = "ACTIVE";
        return this.subscribers.save(existing);
      }
      throw new BadRequestException("Already subscribed");
    }
    return this.subscribers.save(this.subscribers.create({ email }));
  }

  async unsubscribe(email: string): Promise<{ unsubscribed: boolean }> {
    const existing = await this.subscribers.findOne({ where: { email } });
    if (!existing) throw new NotFoundException("Subscriber not found");
    existing.status = "UNSUBSCRIBED";
    await this.subscribers.save(existing);
    return { unsubscribed: true };
  }

  // ---------- Public: buyer program / contact ----------
  async registerBuyerProgram(dto: any): Promise<BuyerProgramRegistration> {
    return this.buyerProgram.save(this.buyerProgram.create(dto as Partial<BuyerProgramRegistration>));
  }

  async submitContact(dto: any): Promise<ContactMessage> {
    return this.contacts.save(this.contacts.create(dto as Partial<ContactMessage>));
  }

  // ---------- Admin: articles ----------
  async findAllArticles(): Promise<Article[]> {
    return this.articles.find({ order: { createdAt: "DESC" } });
  }

  async createArticle(dto: any, user: any): Promise<Article> {
    const article = this.articles.create({
      ...dto,
      authorId: user.id,
      isPublished: dto.isPublished ?? false,
      publishedAt: dto.isPublished ? new Date() : undefined,
      language: dto.language || "en",
    } as Article);
    return this.articles.save(article);
  }

  async updateArticle(id: string, dto: any): Promise<Article> {
    const article = await this.articles.findOne({ where: { id } });
    if (!article) throw new NotFoundException("Article not found");
    if (dto.isPublished !== undefined && dto.isPublished && !article.publishedAt) {
      article.publishedAt = new Date();
    }
    Object.assign(article, dto);
    return this.articles.save(article);
  }

  async deleteArticle(id: string): Promise<void> {
    const article = await this.articles.findOne({ where: { id } });
    if (!article) throw new NotFoundException("Article not found");
    await this.articles.remove(article);
  }

  // ---------- Admin: subscriptions / buyer program / contacts ----------
  async findAllSubscribers(): Promise<NewsletterSubscriber[]> {
    return this.subscribers.find({ order: { createdAt: "DESC" } });
  }

  async findAllBuyerProgram(): Promise<BuyerProgramRegistration[]> {
    return this.buyerProgram.find({ order: { createdAt: "DESC" } });
  }

  async updateBuyerProgramStatus(id: string, status: string): Promise<BuyerProgramRegistration> {
    const reg = await this.buyerProgram.findOne({ where: { id } });
    if (!reg) throw new NotFoundException("Registration not found");
    reg.status = status;
    return this.buyerProgram.save(reg);
  }

  async findAllContacts(): Promise<ContactMessage[]> {
    return this.contacts.find({ order: { createdAt: "DESC" } });
  }

  async updateContactStatus(id: string, status: string): Promise<ContactMessage> {
    const contact = await this.contacts.findOne({ where: { id } });
    if (!contact) throw new NotFoundException("Contact message not found");
    contact.status = status;
    return this.contacts.save(contact);
  }
}